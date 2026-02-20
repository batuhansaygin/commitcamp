-- ─────────────────────────────────────────────────────────────────────────────
-- 00025_fix_achievement_rpcs.sql
-- Fix: get_user_achievement_progress and check_and_award_achievements referenced
-- v_profile.total_solved which does not exist; the actual column is challenges_solved.
-- Also adds icon_url to the RPC return table to match the updated achievements schema.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Fix check_and_award_achievements ──────────────────────────────────────

DROP FUNCTION IF EXISTS public.check_and_award_achievements(uuid) CASCADE;

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

  v_challenges_solved := COALESCE(v_profile.challenges_solved, 0);
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

-- ── 2. Fix get_user_achievement_progress (also adds icon_url to return) ────────

DROP FUNCTION IF EXISTS public.get_user_achievement_progress(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_achievement_progress(p_user_id uuid)
RETURNS TABLE (
  id                uuid,
  name              text,
  description       text,
  category          text,
  rarity            text,
  icon              text,
  icon_url          text,
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

  v_challenges := COALESCE(v_profile.challenges_solved, 0);
  v_duel_wins  := COALESCE(v_profile.duel_wins, 0);

  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.description,
    a.category::text,
    a.rarity::text,
    a.icon,
    a.icon_url,
    a.xp_reward,
    a.requirement_type,
    a.requirement_value,
    a.sort_order,
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
