-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 00015 — Achievements & Badge System
-- ─────────────────────────────────────────────────────────────────────────────

-- ── ENUMs ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE achievement_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE achievement_category AS ENUM (
    'milestone', 'streak', 'community', 'skill',
    'level', 'special', 'explorer', 'quality'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Achievements catalog ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.achievements (
  id                text PRIMARY KEY,
  name              text NOT NULL,
  description       text NOT NULL,
  category          achievement_category NOT NULL,
  rarity            achievement_rarity NOT NULL,
  icon              text NOT NULL,
  xp_reward         integer DEFAULT 0,
  requirement_type  text NOT NULL,
  requirement_value integer NOT NULL,
  sort_order        integer DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);

-- ── User achievements (earned) ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id text NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user
  ON public.user_achievements (user_id, unlocked_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement
  ON public.user_achievements (achievement_id);

-- ── Streak columns on profiles ──────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_streak  integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak  integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date;

-- ── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.achievements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements  ENABLE ROW LEVEL SECURITY;

-- Anyone can read the achievement catalog
DROP POLICY IF EXISTS "achievements_public_read" ON public.achievements;
CREATE POLICY "achievements_public_read"
  ON public.achievements FOR SELECT
  USING (true);

-- User achievements are public (visible on profiles)
DROP POLICY IF EXISTS "user_achievements_public_read" ON public.user_achievements;
CREATE POLICY "user_achievements_public_read"
  ON public.user_achievements FOR SELECT
  USING (true);

-- Authenticated users can insert their own achievements
DROP POLICY IF EXISTS "user_achievements_insert_own" ON public.user_achievements;
CREATE POLICY "user_achievements_insert_own"
  ON public.user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ── update_streak() ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_active    date;
  v_current_streak integer;
  v_longest_streak integer;
  v_today          date := CURRENT_DATE;
BEGIN
  SELECT last_active_date, COALESCE(current_streak, 0), COALESCE(longest_streak, 0)
  INTO   v_last_active, v_current_streak, v_longest_streak
  FROM   public.profiles
  WHERE  id = p_user_id;

  -- Already counted today
  IF v_last_active = v_today THEN
    RETURN v_current_streak;
  END IF;

  -- Consecutive day → extend streak
  IF v_last_active = v_today - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
  ELSE
    -- Gap → reset
    v_current_streak := 1;
  END IF;

  IF v_current_streak > v_longest_streak THEN
    v_longest_streak := v_current_streak;
  END IF;

  UPDATE public.profiles
  SET    current_streak   = v_current_streak,
         longest_streak   = v_longest_streak,
         last_active_date = v_today
  WHERE  id = p_user_id;

  RETURN v_current_streak;
END;
$$;

-- ── check_and_award_achievements() ──────────────────────────────────────────
-- Returns an array of (achievement_id, xp_reward) for newly unlocked items.
-- XP is awarded from TypeScript to avoid enum dependency.

CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_achievements text[];
BEGIN
  WITH stats AS (
    SELECT
      p.posts_count,
      p.followers_count,
      p.following_count,
      COALESCE(p.level, 1)                                           AS level,
      COALESCE(p.xp_points, 0)                                      AS total_xp,
      COALESCE(p.current_streak, 0)                                  AS streak_days,
      COALESCE(array_length(p.tech_stack, 1), 0)                    AS tech_stack_count,
      (SELECT COUNT(*)::integer FROM public.comments
       WHERE user_id = p_user_id)                                    AS comments_count,
      (SELECT COUNT(*)::integer FROM public.snippets
       WHERE user_id = p_user_id)                                    AS snippets_count,
      (SELECT COUNT(*)::integer FROM public.posts
       WHERE user_id = p_user_id AND type = 'showcase')             AS showcases_count,
      (SELECT COUNT(*)::integer FROM public.reactions r
       JOIN public.posts post ON r.target_id = post.id
       WHERE r.target_type = 'post' AND post.user_id = p_user_id)   AS likes_received,
      (SELECT COUNT(DISTINCT language)::integer FROM public.snippets
       WHERE user_id = p_user_id)                                    AS languages_count,
      (SELECT COUNT(*)::integer FROM public.bookmarks
       WHERE user_id = p_user_id)                                    AS bookmarks_count,
      (EXTRACT(DAY FROM (now() - p.created_at)))::integer            AS member_days,
      -- profile_complete: bio + location + avatar + at least 1 tech
      CASE WHEN p.bio IS NOT NULL AND p.bio != ''
                AND p.location IS NOT NULL AND p.location != ''
                AND p.avatar_url IS NOT NULL
                AND COALESCE(array_length(p.tech_stack, 1), 0) >= 1
           THEN 1 ELSE 0 END                                         AS profile_complete_val
    FROM public.profiles p
    WHERE p.id = p_user_id
  ),
  eligible AS (
    SELECT a.id
    FROM public.achievements a, stats s
    WHERE
      -- Not already earned
      NOT EXISTS (
        SELECT 1 FROM public.user_achievements ua
        WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
      )
      -- Only auto-checkable requirement types
      AND a.requirement_type IN (
        'posts_count','comments_count','snippets_count','showcases_count',
        'followers_count','following_count','level','total_xp','streak_days',
        'likes_received','languages_count','tech_stack_count','bookmarks_count',
        'member_days','profile_complete'
      )
      -- Value threshold
      AND CASE a.requirement_type
            WHEN 'posts_count'      THEN s.posts_count
            WHEN 'comments_count'   THEN s.comments_count
            WHEN 'snippets_count'   THEN s.snippets_count
            WHEN 'showcases_count'  THEN s.showcases_count
            WHEN 'followers_count'  THEN s.followers_count
            WHEN 'following_count'  THEN s.following_count
            WHEN 'level'            THEN s.level
            WHEN 'total_xp'         THEN s.total_xp
            WHEN 'streak_days'      THEN s.streak_days
            WHEN 'likes_received'   THEN s.likes_received
            WHEN 'languages_count'  THEN s.languages_count
            WHEN 'tech_stack_count' THEN s.tech_stack_count
            WHEN 'bookmarks_count'  THEN s.bookmarks_count
            WHEN 'member_days'      THEN s.member_days
            WHEN 'profile_complete' THEN s.profile_complete_val
            ELSE 0
          END >= a.requirement_value
  ),
  inserted AS (
    INSERT INTO public.user_achievements (user_id, achievement_id)
    SELECT p_user_id, id FROM eligible
    ON CONFLICT (user_id, achievement_id) DO NOTHING
    RETURNING achievement_id
  )
  SELECT COALESCE(array_agg(achievement_id), '{}')
  INTO   v_new_achievements
  FROM   inserted;

  RETURN v_new_achievements;
END;
$$;

-- ── get_user_achievement_progress() ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_achievement_progress(p_user_id uuid)
RETURNS TABLE (
  id                text,
  name              text,
  description       text,
  category          achievement_category,
  rarity            achievement_rarity,
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
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_posts_count      integer;
  v_comments_count   integer;
  v_snippets_count   integer;
  v_showcases_count  integer;
  v_followers_count  integer;
  v_following_count  integer;
  v_level            integer;
  v_total_xp         integer;
  v_streak_days      integer;
  v_likes_received   integer;
  v_languages_count  integer;
  v_tech_stack_count integer;
  v_bookmarks_count  integer;
  v_member_days      integer;
  v_profile_complete integer;
BEGIN
  SELECT
    p.posts_count,
    p.followers_count,
    p.following_count,
    COALESCE(p.level, 1),
    COALESCE(p.xp_points, 0),
    COALESCE(p.current_streak, 0),
    COALESCE(array_length(p.tech_stack, 1), 0),
    (EXTRACT(DAY FROM (now() - p.created_at)))::integer,
    CASE WHEN p.bio IS NOT NULL AND p.bio != ''
              AND p.location IS NOT NULL AND p.location != ''
              AND p.avatar_url IS NOT NULL
              AND COALESCE(array_length(p.tech_stack, 1), 0) >= 1
         THEN 1 ELSE 0 END
  INTO
    v_posts_count, v_followers_count, v_following_count, v_level,
    v_total_xp, v_streak_days, v_tech_stack_count, v_member_days,
    v_profile_complete
  FROM public.profiles p
  WHERE p.id = p_user_id;

  SELECT COUNT(*)::integer INTO v_comments_count  FROM public.comments WHERE user_id = p_user_id;
  SELECT COUNT(*)::integer INTO v_snippets_count  FROM public.snippets WHERE user_id = p_user_id;
  SELECT COUNT(*)::integer INTO v_showcases_count FROM public.posts WHERE user_id = p_user_id AND type = 'showcase';
  SELECT COUNT(*)::integer INTO v_likes_received
    FROM public.reactions r
    JOIN public.posts po ON r.target_id = po.id
    WHERE r.target_type = 'post' AND po.user_id = p_user_id;
  SELECT COUNT(DISTINCT language)::integer INTO v_languages_count FROM public.snippets WHERE user_id = p_user_id;
  SELECT COUNT(*)::integer INTO v_bookmarks_count FROM public.bookmarks WHERE user_id = p_user_id;

  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.description,
    a.category,
    a.rarity,
    a.icon,
    a.xp_reward,
    a.requirement_type,
    a.requirement_value,
    a.sort_order,
    CASE a.requirement_type
      WHEN 'posts_count'      THEN v_posts_count
      WHEN 'comments_count'   THEN v_comments_count
      WHEN 'snippets_count'   THEN v_snippets_count
      WHEN 'showcases_count'  THEN v_showcases_count
      WHEN 'followers_count'  THEN v_followers_count
      WHEN 'following_count'  THEN v_following_count
      WHEN 'level'            THEN v_level
      WHEN 'total_xp'         THEN v_total_xp
      WHEN 'streak_days'      THEN v_streak_days
      WHEN 'likes_received'   THEN v_likes_received
      WHEN 'languages_count'  THEN v_languages_count
      WHEN 'tech_stack_count' THEN v_tech_stack_count
      WHEN 'bookmarks_count'  THEN v_bookmarks_count
      WHEN 'member_days'      THEN v_member_days
      WHEN 'profile_complete' THEN v_profile_complete
      ELSE 0
    END::integer AS current_value,
    EXISTS(
      SELECT 1 FROM public.user_achievements ua
      WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
    ) AS is_unlocked,
    (
      SELECT ua.unlocked_at FROM public.user_achievements ua
      WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
      LIMIT 1
    ) AS unlocked_at,
    LEAST(100,
      CASE
        WHEN EXISTS(
          SELECT 1 FROM public.user_achievements ua
          WHERE ua.user_id = p_user_id AND ua.achievement_id = a.id
        ) THEN 100
        WHEN a.requirement_value = 0 THEN 0
        ELSE (
          CASE a.requirement_type
            WHEN 'posts_count'      THEN v_posts_count
            WHEN 'comments_count'   THEN v_comments_count
            WHEN 'snippets_count'   THEN v_snippets_count
            WHEN 'showcases_count'  THEN v_showcases_count
            WHEN 'followers_count'  THEN v_followers_count
            WHEN 'following_count'  THEN v_following_count
            WHEN 'level'            THEN v_level
            WHEN 'total_xp'         THEN v_total_xp
            WHEN 'streak_days'      THEN v_streak_days
            WHEN 'likes_received'   THEN v_likes_received
            WHEN 'languages_count'  THEN v_languages_count
            WHEN 'tech_stack_count' THEN v_tech_stack_count
            WHEN 'bookmarks_count'  THEN v_bookmarks_count
            WHEN 'member_days'      THEN v_member_days
            WHEN 'profile_complete' THEN v_profile_complete
            ELSE 0
          END * 100 / a.requirement_value
        )
      END
    )::integer AS progress_percent
  FROM public.achievements a
  ORDER BY a.category, a.sort_order;
END;
$$;

-- ── Seed: all 74 achievements ────────────────────────────────────────────────

INSERT INTO public.achievements (id, name, description, category, rarity, icon, xp_reward, requirement_type, requirement_value, sort_order) VALUES

-- MILESTONE (15)
('first_post',      'First Commit',         'Publish your very first post',                       'milestone', 'common',    '🎉', 100,  'posts_count',    1,   1),
('posts_5',         'Getting Started',      'Publish 5 posts',                                    'milestone', 'common',    '📝', 50,   'posts_count',    5,   2),
('posts_10',        'Regular Contributor',  'Publish 10 posts',                                   'milestone', 'uncommon',  '📰', 100,  'posts_count',    10,  3),
('posts_25',        'Prolific Writer',      'Publish 25 posts',                                   'milestone', 'rare',      '✍️', 200,  'posts_count',    25,  4),
('posts_50',        'Content Machine',      'Publish 50 posts',                                   'milestone', 'epic',      '🏭', 500,  'posts_count',    50,  5),
('posts_100',       'Centurion',            'Publish 100 posts',                                  'milestone', 'legendary', '💯', 1000, 'posts_count',    100, 6),
('first_comment',   'Conversation Starter', 'Write your first comment',                           'milestone', 'common',    '💬', 50,   'comments_count', 1,   7),
('comments_10',     'Active Discussant',    'Write 10 comments',                                  'milestone', 'common',    '🗣️', 75,   'comments_count', 10,  8),
('comments_50',     'Community Voice',      'Write 50 comments',                                  'milestone', 'uncommon',  '📢', 150,  'comments_count', 50,  9),
('comments_100',    'Discussion Leader',    'Write 100 comments',                                 'milestone', 'rare',      '🎤', 300,  'comments_count', 100, 10),
('comments_500',    'The Mentor',           'Write 500 comments — you love helping others',       'milestone', 'epic',      '🧑‍🏫', 750, 'comments_count', 500, 11),
('first_snippet',   'Code Dropper',         'Share your first code snippet',                      'milestone', 'common',    '💻', 75,   'snippets_count', 1,   12),
('snippets_10',     'Snippet Collector',    'Share 10 code snippets',                             'milestone', 'uncommon',  '📦', 150,  'snippets_count', 10,  13),
('snippets_50',     'Code Library',         'Share 50 code snippets',                             'milestone', 'rare',      '📚', 400,  'snippets_count', 50,  14),
('first_showcase',  'Show & Tell',          'Showcase your first project',                        'milestone', 'common',    '🚀', 100,  'showcases_count', 1,  15),

-- STREAK (8)
('streak_3',        'Warming Up',           '3-day activity streak',                              'streak', 'common',    '🔥', 50,   'streak_days', 3,   1),
('streak_7',        'On Fire',              '7-day activity streak',                              'streak', 'uncommon',  '🔥', 150,  'streak_days', 7,   2),
('streak_14',       'Unstoppable',          '14-day activity streak',                             'streak', 'rare',      '⚡', 300,  'streak_days', 14,  3),
('streak_30',       'Monthly Warrior',      '30-day activity streak',                             'streak', 'epic',      '🗓️', 750,  'streak_days', 30,  4),
('streak_60',       'Iron Will',            '60-day activity streak',                             'streak', 'epic',      '💪', 1500, 'streak_days', 60,  5),
('streak_100',      'The Machine',          '100-day activity streak — incredible dedication',    'streak', 'legendary', '🤖', 3000, 'streak_days', 100, 6),
('streak_365',      'Year-Round Coder',     '365-day activity streak — you never stop',          'streak', 'legendary', '👑', 10000,'streak_days', 365, 7),
('weekend_warrior', 'Weekend Warrior',      'Be active on 10 weekends',                          'streak', 'uncommon',  '🏋️', 200, 'weekend_days', 10,  8),

-- COMMUNITY (12)
('first_follower',       'Getting Noticed',        'Gain your first follower',                   'community', 'common',    '👋', 50,   'followers_count', 1,    1),
('followers_10',         'Rising Star',            'Reach 10 followers',                         'community', 'uncommon',  '⭐', 150,  'followers_count', 10,   2),
('followers_50',         'Influencer',             'Reach 50 followers',                         'community', 'rare',      '🌟', 400,  'followers_count', 50,   3),
('followers_100',        'Community Leader',       'Reach 100 followers',                        'community', 'epic',      '👑', 1000, 'followers_count', 100,  4),
('followers_500',        'Dev Celebrity',          'Reach 500 followers',                        'community', 'legendary', '🏆', 3000, 'followers_count', 500,  5),
('followers_1000',       'Legend of CommitCamp',   'Reach 1000 followers',                       'community', 'legendary', '🐐', 5000, 'followers_count', 1000, 6),
('first_follow',         'Friendly Face',          'Follow your first developer',                'community', 'common',    '🤝', 25,   'following_count', 1,    7),
('following_20',         'Networking',             'Follow 20 developers',                       'community', 'common',    '🌐', 75,   'following_count', 20,   8),
('first_like_received',  'Appreciated',            'Receive your first like',                    'community', 'common',    '❤️', 50,   'likes_received',  1,    9),
('likes_received_50',    'Crowd Favorite',         'Receive 50 likes on your posts',             'community', 'uncommon',  '💖', 200,  'likes_received',  50,   10),
('likes_received_500',   'Beloved Creator',        'Receive 500 likes on your posts',            'community', 'epic',      '💝', 1000, 'likes_received',  500,  11),
('likes_received_1000',  'Heart of the Community', 'Receive 1000 likes',                         'community', 'legendary', '💗', 2500, 'likes_received',  1000, 12),

-- SKILL (10)
('polyglot_3',     'Bilingual Coder',     'Share snippets in 3 different languages',             'skill', 'uncommon', '🌍', 200,  'languages_count', 3,  1),
('polyglot_5',     'Polyglot',            'Share snippets in 5 different languages',             'skill', 'rare',     '🗺️', 400,  'languages_count', 5,  2),
('polyglot_10',    'Language Master',     'Share snippets in 10 different languages',            'skill', 'epic',     '🧠', 1000, 'languages_count', 10, 3),
('tech_stack_5',   'Full Stack Explorer', 'Add 5+ technologies to your tech stack',             'skill', 'common',   '🔧', 100,  'tech_stack_count', 5, 4),
('tech_stack_10',  'Tech Hoarder',        'Add 10+ technologies to your tech stack',            'skill', 'uncommon', '🛠️', 200,  'tech_stack_count', 10,5),
('all_post_types', 'Jack of All Trades',  'Create at least one of each post type',              'skill', 'rare',     '🃏', 500,  'post_types_count', 4, 6),
('tag_master',     'Tag Master',          'Use 20 different tags across your posts',            'skill', 'uncommon', '🏷️', 150,  'unique_tags_count', 20,7),
('long_form',      'Deep Diver',          'Write a post with 1000+ words',                      'skill', 'uncommon', '📖', 200,  'long_post',        1, 8),
('code_reviewer',  'Code Reviewer',       'Comment on 20 different users'' posts',              'skill', 'rare',     '🔍', 300,  'reviewed_users_count',20,9),
('helper',         'The Helper',          'Answer 10 question-type posts with comments',        'skill', 'rare',     '🦸', 400,  'questions_answered', 10,10),

-- LEVEL (8)
('level_5',    'Bronze Graduate',  'Reach Level 5',           'level', 'common',    '🥉', 100,  'level',    5,      1),
('level_10',   'Silver Rank',      'Reach Level 10',          'level', 'uncommon',  '🥈', 250,  'level',    10,     2),
('level_20',   'Gold Rank',        'Reach Level 20',          'level', 'rare',      '🥇', 500,  'level',    20,     3),
('level_35',   'Platinum Elite',   'Reach Level 35',          'level', 'epic',      '💎', 1000, 'level',    35,     4),
('level_50',   'Diamond Authority','Reach Level 50',          'level', 'legendary', '💠', 2500, 'level',    50,     5),
('xp_1000',    'XP Collector',     'Earn 1,000 total XP',     'level', 'common',    '✨', 50,   'total_xp', 1000,   6),
('xp_10000',   'XP Hoarder',       'Earn 10,000 total XP',    'level', 'rare',      '🌟', 500,  'total_xp', 10000,  7),
('xp_100000',  'XP Overlord',      'Earn 100,000 total XP',   'level', 'legendary', '☀️', 5000, 'total_xp', 100000, 8),

-- EXPLORER (8)
('profile_complete', 'Identity Established', 'Fill out bio, location, avatar, and tech stack',  'explorer', 'common',   '🪪', 100, 'profile_complete', 1,  1),
('first_search',     'Explorer',             'Use the search feature for the first time',       'explorer', 'common',   '🔎', 25,  'search_used',      1,  2),
('first_bookmark',   'Bookworm',             'Bookmark your first post',                        'explorer', 'common',   '📌', 25,  'bookmarks_count',  1,  3),
('bookmarks_25',     'Curator',              'Bookmark 25 posts',                               'explorer', 'uncommon', '📋', 100, 'bookmarks_count',  25, 4),
('dark_mode',        'Dark Side',            'Switch to dark mode',                             'explorer', 'common',   '🌙', 10,  'dark_mode_used',   1,  5),
('night_owl',        'Night Owl',            'Create a post between midnight and 5 AM',         'explorer', 'uncommon', '🦉', 100, 'night_post',       1,  6),
('early_bird',       'Early Bird',           'Create a post between 5 AM and 7 AM',             'explorer', 'uncommon', '🐦', 100, 'early_post',       1,  7),
('multilingual',     'Global Citizen',       'Switch the platform language at least once',      'explorer', 'common',   '🌐', 25,  'language_switched',1,  8),

-- QUALITY (7)
('trending_post',       'Trending',          'Have a post with 10+ likes',                      'quality', 'uncommon', '📈', 200,  'max_post_likes',      10,  1),
('viral_post',          'Viral',             'Have a post with 50+ likes',                      'quality', 'rare',     '🔥', 500,  'max_post_likes',      50,  2),
('mega_viral',          'Mega Viral',        'Have a post with 200+ likes',                     'quality', 'epic',     '💥', 1500, 'max_post_likes',      200, 3),
('conversation_starter','Hot Topic',         'Have a post with 20+ comments',                   'quality', 'rare',     '🗨️', 300,  'max_post_comments',   20,  4),
('most_viewed',         'Page Turner',       'Have a post with 500+ views',                     'quality', 'rare',     '👀', 300,  'max_post_views',      500, 5),
('consistent_quality',  'Consistency King',  'Have 10 posts each with 5+ likes',                'quality', 'epic',     '👑', 1000, 'quality_posts_count', 10,  6),
('top_of_week',         'Weekly Champion',   'Be the #1 developer on the weekly leaderboard',  'quality', 'epic',     '🏅', 1000, 'weekly_top_1',        1,   7),

-- SPECIAL (6)
('beta_tester',   'Beta Tester',   'Joined during the beta period',                            'special', 'epic',      '🧪', 500,  'special',        0,   1),
('early_adopter', 'Early Adopter', 'Among the first 100 users to join',                        'special', 'rare',      '🌱', 300,  'special',        0,   2),
('og_member',     'OG Member',     'Among the first 1000 users to join',                       'special', 'uncommon',  '🏛️', 150,  'special',        0,   3),
('anniversary_1', 'One Year Strong','Be a member for 1 year',                                  'special', 'rare',      '🎂', 500,  'member_days',    365, 4),
('first_day',     'Day One',       'Complete 5 actions on your first day',                     'special', 'uncommon',  '📅', 200,  'first_day_actions',5, 5),
('comeback',      'The Comeback',  'Return after 30+ days of inactivity',                      'special', 'uncommon',  '🔄', 150,  'comeback',       1,   6)

ON CONFLICT (id) DO NOTHING;
