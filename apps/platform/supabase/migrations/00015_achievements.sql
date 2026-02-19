-- ─────────────────────────────────────────────────────────────────────────────
-- 00015_achievements.sql
-- Achievement & badge system: tables, streak columns, RPCs, and 65 seed records.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. ENUMs ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.achievement_rarity AS ENUM
    ('common','uncommon','rare','epic','legendary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.achievement_category AS ENUM
    ('milestone','streak','community','skill','level','explorer','quality','special');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. achievements table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.achievements (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  description      text NOT NULL,
  category         public.achievement_category NOT NULL,
  rarity           public.achievement_rarity   NOT NULL,
  icon             text NOT NULL DEFAULT '🏅',
  xp_reward        integer NOT NULL DEFAULT 0,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL DEFAULT 1,
  sort_order       integer NOT NULL DEFAULT 999,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS achievements_select ON public.achievements;
CREATE POLICY achievements_select ON public.achievements
  FOR SELECT TO public USING (true);

-- ── 3. user_achievements table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user   ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON public.user_achievements(achievement_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_achievements_select_own ON public.user_achievements;
CREATE POLICY user_achievements_select_own ON public.user_achievements
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_achievements_insert_own ON public.user_achievements;
CREATE POLICY user_achievements_insert_own ON public.user_achievements
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Admins / system can insert for any user (via service role — bypasses RLS)

-- ── 4. Streak columns on profiles ────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_at  timestamptz;

-- ── 5. update_streak RPC ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last    timestamptz;
  v_streak  integer;
  v_longest integer;
  v_today   date := (now() AT TIME ZONE 'UTC')::date;
BEGIN
  SELECT last_active_at, current_streak, longest_streak
    INTO v_last, v_streak, v_longest
    FROM public.profiles
   WHERE id = p_user_id;

  IF NOT FOUND THEN RETURN 0; END IF;

  -- Already updated today — no change
  IF v_last IS NOT NULL AND (v_last AT TIME ZONE 'UTC')::date = v_today THEN
    RETURN v_streak;
  END IF;

  IF v_last IS NOT NULL AND (v_last AT TIME ZONE 'UTC')::date = v_today - 1 THEN
    -- Consecutive day — increment
    v_streak := v_streak + 1;
  ELSE
    -- Gap or first time — reset
    v_streak := 1;
  END IF;

  v_longest := GREATEST(v_longest, v_streak);

  UPDATE public.profiles
     SET current_streak = v_streak,
         longest_streak = v_longest,
         last_active_at = now()
   WHERE id = p_user_id;

  RETURN v_streak;
END;
$$;

-- ── 6. check_and_award_achievements RPC ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile           public.profiles%ROWTYPE;
  v_achievement       RECORD;
  v_current_value     integer;
  v_new_ids           uuid[] := '{}';
  v_comments_count    integer;
  v_snippets_count    integer;
  v_reactions_rcvd    integer;
  v_challenges_solved integer;
  v_duel_wins         integer;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN v_new_ids; END IF;

  SELECT COUNT(*) INTO v_comments_count
    FROM public.comments WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_snippets_count
    FROM public.snippets WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_reactions_rcvd
    FROM public.reactions r
    JOIN public.posts po ON r.target_id = po.id AND r.target_type = 'post'
   WHERE po.user_id = p_user_id;

  v_challenges_solved := COALESCE(v_profile.total_solved, 0);
  v_duel_wins         := COALESCE(v_profile.duel_wins, 0);

  FOR v_achievement IN
    SELECT a.*
      FROM public.achievements a
     WHERE NOT EXISTS (
       SELECT 1 FROM public.user_achievements ua
        WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
     )
  LOOP
    CASE v_achievement.requirement_type
      WHEN 'posts_count'        THEN v_current_value := COALESCE(v_profile.posts_count, 0);
      WHEN 'comments_count'     THEN v_current_value := v_comments_count;
      WHEN 'snippets_count'     THEN v_current_value := v_snippets_count;
      WHEN 'followers_count'    THEN v_current_value := COALESCE(v_profile.followers_count, 0);
      WHEN 'following_count'    THEN v_current_value := COALESCE(v_profile.following_count, 0);
      WHEN 'xp_points'          THEN v_current_value := COALESCE(v_profile.xp_points, 0);
      WHEN 'level'              THEN v_current_value := COALESCE(v_profile.level, 1);
      WHEN 'current_streak'     THEN v_current_value := COALESCE(v_profile.current_streak, 0);
      WHEN 'longest_streak'     THEN v_current_value := COALESCE(v_profile.longest_streak, 0);
      WHEN 'reactions_received' THEN v_current_value := v_reactions_rcvd;
      WHEN 'challenges_solved'  THEN v_current_value := v_challenges_solved;
      WHEN 'duel_wins'          THEN v_current_value := v_duel_wins;
      ELSE v_current_value := 0;
    END CASE;

    IF v_current_value >= v_achievement.requirement_value THEN
      INSERT INTO public.user_achievements (user_id, achievement_id)
        VALUES (p_user_id, v_achievement.id)
        ON CONFLICT DO NOTHING;
      IF FOUND THEN
        v_new_ids := array_append(v_new_ids, v_achievement.id);
      END IF;
    END IF;
  END LOOP;

  RETURN v_new_ids;
END;
$$;

-- ── 7. get_user_achievement_progress RPC ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_achievement_progress(p_user_id uuid)
RETURNS TABLE (
  id                uuid,
  name              text,
  description       text,
  category          text,
  rarity            text,
  icon              text,
  xp_reward         integer,
  requirement_type  text,
  requirement_value integer,
  sort_order        integer,
  current_value     integer,
  is_unlocked       boolean,
  unlocked_at       timestamptz,
  progress_percent  integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile        public.profiles%ROWTYPE;
  v_comments       integer;
  v_snippets       integer;
  v_reactions      integer;
  v_challenges     integer;
  v_duel_wins      integer;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT COUNT(*) INTO v_comments  FROM public.comments  WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_snippets  FROM public.snippets  WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_reactions
    FROM public.reactions r
    JOIN public.posts po ON r.target_id = po.id AND r.target_type = 'post'
   WHERE po.user_id = p_user_id;

  v_challenges := COALESCE(v_profile.total_solved, 0);
  v_duel_wins  := COALESCE(v_profile.duel_wins, 0);

  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.description,
    a.category::text,
    a.rarity::text,
    a.icon,
    a.xp_reward,
    a.requirement_type,
    a.requirement_value,
    a.sort_order,
    -- current_value (capped at requirement)
    LEAST(
      CASE a.requirement_type
        WHEN 'posts_count'        THEN COALESCE(v_profile.posts_count, 0)
        WHEN 'comments_count'     THEN v_comments
        WHEN 'snippets_count'     THEN v_snippets
        WHEN 'followers_count'    THEN COALESCE(v_profile.followers_count, 0)
        WHEN 'following_count'    THEN COALESCE(v_profile.following_count, 0)
        WHEN 'xp_points'          THEN COALESCE(v_profile.xp_points, 0)
        WHEN 'level'              THEN COALESCE(v_profile.level, 1)
        WHEN 'current_streak'     THEN COALESCE(v_profile.current_streak, 0)
        WHEN 'longest_streak'     THEN COALESCE(v_profile.longest_streak, 0)
        WHEN 'reactions_received' THEN v_reactions
        WHEN 'challenges_solved'  THEN v_challenges
        WHEN 'duel_wins'          THEN v_duel_wins
        ELSE 0
      END,
      a.requirement_value
    ) AS current_value,
    (ua.id IS NOT NULL)                 AS is_unlocked,
    ua.unlocked_at,
    LEAST(100,
      CASE WHEN a.requirement_value = 0 THEN 100
      ELSE (
        LEAST(
          CASE a.requirement_type
            WHEN 'posts_count'        THEN COALESCE(v_profile.posts_count, 0)
            WHEN 'comments_count'     THEN v_comments
            WHEN 'snippets_count'     THEN v_snippets
            WHEN 'followers_count'    THEN COALESCE(v_profile.followers_count, 0)
            WHEN 'following_count'    THEN COALESCE(v_profile.following_count, 0)
            WHEN 'xp_points'          THEN COALESCE(v_profile.xp_points, 0)
            WHEN 'level'              THEN COALESCE(v_profile.level, 1)
            WHEN 'current_streak'     THEN COALESCE(v_profile.current_streak, 0)
            WHEN 'longest_streak'     THEN COALESCE(v_profile.longest_streak, 0)
            WHEN 'reactions_received' THEN v_reactions
            WHEN 'challenges_solved'  THEN v_challenges
            WHEN 'duel_wins'          THEN v_duel_wins
            ELSE 0
          END,
          a.requirement_value
        ) * 100 / a.requirement_value
      )
      END
    ) AS progress_percent
  FROM public.achievements a
  LEFT JOIN public.user_achievements ua
         ON ua.achievement_id = a.id AND ua.user_id = p_user_id
  ORDER BY a.sort_order;
END;
$$;

-- ── 8. Seed: 65 base achievements ─────────────────────────────────────────────

INSERT INTO public.achievements
  (id, name, description, category, rarity, icon, xp_reward, requirement_type, requirement_value, sort_order)
VALUES

-- ── MILESTONE: Posts ──────────────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000001','First Commit','Publish your very first post.',
  'milestone','common','🚀',100,'posts_count',1,1),
('a1000000-0000-0000-0000-000000000002','Getting Started','Publish 5 posts.',
  'milestone','common','📝',50,'posts_count',5,2),
('a1000000-0000-0000-0000-000000000003','Regular Contributor','Publish 10 posts.',
  'milestone','uncommon','✍️',100,'posts_count',10,3),
('a1000000-0000-0000-0000-000000000004','Prolific Writer','Publish 25 posts.',
  'milestone','rare','📖',200,'posts_count',25,4),
('a1000000-0000-0000-0000-000000000005','Content Machine','Publish 50 posts.',
  'milestone','epic','🖊️',500,'posts_count',50,5),
('a1000000-0000-0000-0000-000000000006','Centurion','Publish 100 posts.',
  'milestone','legendary','📚',1000,'posts_count',100,6),

-- ── MILESTONE: Comments ───────────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000011','Conversation Starter','Write your first comment.',
  'milestone','common','💬',50,'comments_count',1,11),
('a1000000-0000-0000-0000-000000000012','Active Discussant','Write 50 comments.',
  'milestone','common','🗣️',75,'comments_count',50,12),
('a1000000-0000-0000-0000-000000000013','Community Voice','Write 100 comments.',
  'milestone','uncommon','📢',150,'comments_count',100,13),
('a1000000-0000-0000-0000-000000000014','Discussion Leader','Write 300 comments.',
  'milestone','rare','🎙️',300,'comments_count',300,14),

-- ── MILESTONE: Snippets ───────────────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000021','Code Dropper','Share your first code snippet.',
  'milestone','common','💻',75,'snippets_count',1,21),
('a1000000-0000-0000-0000-000000000022','Show & Tell','Share 5 code snippets.',
  'milestone','common','🎨',100,'snippets_count',5,22),
('a1000000-0000-0000-0000-000000000023','Code Collector','Share 25 snippets.',
  'milestone','rare','🗂️',300,'snippets_count',25,23),
('a1000000-0000-0000-0000-000000000024','Repository','Share 50 snippets.',
  'milestone','epic','🏛️',750,'snippets_count',50,24),

-- ── MILESTONE: Reactions received ────────────────────────────────────────────
('a1000000-0000-0000-0000-000000000031','Liked!','Receive your first reaction.',
  'milestone','common','❤️',25,'reactions_received',1,31),
('a1000000-0000-0000-0000-000000000032','Rising Star','Receive 10 reactions.',
  'milestone','common','⭐',75,'reactions_received',10,32),
('a1000000-0000-0000-0000-000000000033','Community Approved','Receive 50 reactions.',
  'milestone','uncommon','🌟',200,'reactions_received',50,33),
('a1000000-0000-0000-0000-000000000034','Crowd Favorite','Receive 200 reactions.',
  'milestone','rare','✨',500,'reactions_received',200,34),
('a1000000-0000-0000-0000-000000000035','Legendary Content','Receive 1000 reactions.',
  'milestone','legendary','💎',2000,'reactions_received',1000,35),

-- ── STREAK ────────────────────────────────────────────────────────────────────
('a2000000-0000-0000-0000-000000000001','Day One','Start your first activity streak.',
  'streak','common','🔥',25,'current_streak',1,51),
('a2000000-0000-0000-0000-000000000002','Habit Forming','Maintain a 3-day streak.',
  'streak','common','⚡',50,'current_streak',3,52),
('a2000000-0000-0000-0000-000000000003','Week Warrior','Maintain a 7-day streak.',
  'streak','uncommon','🌊',100,'current_streak',7,53),
('a2000000-0000-0000-0000-000000000004','Fortnight Fanatic','Maintain a 14-day streak.',
  'streak','uncommon','💪',200,'current_streak',14,54),
('a2000000-0000-0000-0000-000000000005','Monthly Maven','Maintain a 30-day streak.',
  'streak','rare','🎯',400,'current_streak',30,55),
('a2000000-0000-0000-0000-000000000006','Iron Coder','Maintain a 60-day streak.',
  'streak','epic','🛡️',1000,'current_streak',60,56),
('a2000000-0000-0000-0000-000000000007','Unstoppable','Maintain a 100-day streak.',
  'streak','legendary','⚔️',2500,'current_streak',100,57),
('a2000000-0000-0000-0000-000000000008','Best Week','Achieve a longest streak of 7+ days.',
  'streak','uncommon','🏆',150,'longest_streak',7,58),
('a2000000-0000-0000-0000-000000000009','Best Month','Achieve a longest streak of 30+ days.',
  'streak','rare','🥇',600,'longest_streak',30,59),

-- ── COMMUNITY ─────────────────────────────────────────────────────────────────
('a3000000-0000-0000-0000-000000000001','First Follower','Get your first follower.',
  'community','common','👥',50,'followers_count',1,101),
('a3000000-0000-0000-0000-000000000002','Community Builder','Reach 10 followers.',
  'community','uncommon','🤝',150,'followers_count',10,102),
('a3000000-0000-0000-0000-000000000003','Influencer','Reach 50 followers.',
  'community','rare','📣',400,'followers_count',50,103),
('a3000000-0000-0000-0000-000000000004','Tech Celebrity','Reach 100 followers.',
  'community','epic','🌍',1000,'followers_count',100,104),
('a3000000-0000-0000-0000-000000000005','Network Builder','Follow 5 developers.',
  'community','common','🔗',50,'following_count',5,105),
('a3000000-0000-0000-0000-000000000006','Social Butterfly','Follow 20 developers.',
  'community','uncommon','🦋',100,'following_count',20,106),
('a3000000-0000-0000-0000-000000000007','Connected','Follow 50 developers.',
  'community','rare','🌐',250,'following_count',50,107),

-- ── SKILL ─────────────────────────────────────────────────────────────────────
('a4000000-0000-0000-0000-000000000001','First Blood','Win your first duel.',
  'skill','common','⚔️',100,'duel_wins',1,151),
('a4000000-0000-0000-0000-000000000002','Duel Champion','Win 10 duels.',
  'skill','uncommon','🥊',300,'duel_wins',10,152),
('a4000000-0000-0000-0000-000000000003','Duel Master','Win 25 duels.',
  'skill','rare','🏹',750,'duel_wins',25,153),
('a4000000-0000-0000-0000-000000000004','PvP Legend','Win 50 duels.',
  'skill','epic','👑',2000,'duel_wins',50,154),

-- ── LEVEL ─────────────────────────────────────────────────────────────────────
('a5000000-0000-0000-0000-000000000001','Novice','Reach Level 5.',
  'level','common','🌱',50,'level',5,201),
('a5000000-0000-0000-0000-000000000002','Apprentice','Reach Level 10.',
  'level','common','🌿',100,'level',10,202),
('a5000000-0000-0000-0000-000000000003','Journeyman','Reach Level 15.',
  'level','uncommon','🌳',200,'level',15,203),
('a5000000-0000-0000-0000-000000000004','Expert','Reach Level 20.',
  'level','uncommon','⚡',300,'level',20,204),
('a5000000-0000-0000-0000-000000000005','Master','Reach Level 25.',
  'level','rare','🔥',500,'level',25,205),
('a5000000-0000-0000-0000-000000000006','Grandmaster','Reach Level 35.',
  'level','epic','💫',1000,'level',35,206),
('a5000000-0000-0000-0000-000000000007','Living Legend','Reach Level 50.',
  'level','legendary','🌟',3000,'level',50,207),

-- ── EXPLORER ─────────────────────────────────────────────────────────────────
('a6000000-0000-0000-0000-000000000001','First Steps','Earn your first 100 XP.',
  'explorer','common','👣',0,'xp_points',100,251),
('a6000000-0000-0000-0000-000000000002','Getting Familiar','Earn 500 XP.',
  'explorer','common','🗺️',50,'xp_points',500,252),
('a6000000-0000-0000-0000-000000000003','Seasoned Developer','Earn 2,000 XP.',
  'explorer','uncommon','🧭',100,'xp_points',2000,253),
('a6000000-0000-0000-0000-000000000004','Senior Developer','Earn 5,000 XP.',
  'explorer','rare','🔭',250,'xp_points',5000,254),
('a6000000-0000-0000-0000-000000000005','Principal Developer','Earn 10,000 XP.',
  'explorer','epic','🚀',500,'xp_points',10000,255),
('a6000000-0000-0000-0000-000000000006','Tech Lead','Earn 25,000 XP.',
  'explorer','legendary','🌌',1000,'xp_points',25000,256),

-- ── QUALITY ───────────────────────────────────────────────────────────────────
('a7000000-0000-0000-0000-000000000001','Appreciated','A post you made received 5 reactions.',
  'quality','common','💝',50,'reactions_received',5,301),
('a7000000-0000-0000-0000-000000000002','Well Received','A post you made received 25 reactions.',
  'quality','uncommon','🌸',150,'reactions_received',25,302),
('a7000000-0000-0000-0000-000000000003','Viral Post','A post you made received 100 reactions.',
  'quality','rare','🎆',400,'reactions_received',100,303),

-- ── SPECIAL ───────────────────────────────────────────────────────────────────
('a8000000-0000-0000-0000-000000000001','Early Adopter','One of the first to join CommitCamp.',
  'special','epic','🌅',500,'posts_count',1,351),
('a8000000-0000-0000-0000-000000000002','Alpha Tester','Active during CommitCamp alpha.',
  'special','rare','🧪',300,'posts_count',1,352),
('a8000000-0000-0000-0000-000000000003','Power User','Reach 1,000 XP.',
  'special','uncommon','⚡',200,'xp_points',1000,353),
('a8000000-0000-0000-0000-000000000004','Full Stack','Post, comment, and share a snippet.',
  'special','uncommon','🥞',200,'snippets_count',1,354),
('a8000000-0000-0000-0000-000000000005','Dedicated','Maintain any streak for 7 days.',
  'special','uncommon','💎',200,'current_streak',7,355)

ON CONFLICT (id) DO NOTHING;
