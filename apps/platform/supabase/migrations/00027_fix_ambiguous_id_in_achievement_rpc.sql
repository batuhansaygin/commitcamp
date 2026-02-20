-- ─────────────────────────────────────────────────────────────────────────────
-- 00027_fix_ambiguous_id_in_achievement_rpc.sql
-- Fix: "column reference id is ambiguous" in get_user_achievement_progress.
-- RETURNS TABLE defines `id` as an OUT parameter; using `ua.id` inside the
-- RETURN QUERY body clashes with that OUT variable.
-- Fix: replace `(ua.id IS NOT NULL)` with `(ua.achievement_id IS NOT NULL)`.
-- ─────────────────────────────────────────────────────────────────────────────

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
  v_profile    public.profiles%ROWTYPE;
  v_comments   integer;
  v_snippets   integer;
  v_reactions  integer;
  v_challenges integer;
  v_duel_wins  integer;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE profiles.id = p_user_id;
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
    )::integer AS current_value,
    -- Use ua.achievement_id (not ua.id) to avoid ambiguity with the OUT variable `id`
    (ua.achievement_id IS NOT NULL) AS is_unlocked,
    ua.unlocked_at,
    -- progress_percent (0-100)
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
    )::integer AS progress_percent
  FROM public.achievements a
  LEFT JOIN public.user_achievements ua
         ON ua.achievement_id = a.id AND ua.user_id = p_user_id
  ORDER BY a.sort_order;
END;
$$;
