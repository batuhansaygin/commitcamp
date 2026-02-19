-- ─────────────────────────────────────────────────────────────────────────────
-- 00017_challenge_achievements.sql
-- Adds coding challenge achievements to the achievements table.
-- Uses ON CONFLICT (id) DO NOTHING for idempotency.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.achievements
  (id, name, description, category, rarity, icon, xp_reward, requirement_type, requirement_value, sort_order)
VALUES
  -- Milestone: challenges solved
  (
    'c1000000-0000-0000-0000-000000000001',
    'Challenge Accepted',
    'Solve your first coding challenge.',
    'milestone', 'common', '⚔️', 100,
    'challenges_solved', 1, 200
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    'Problem Solver',
    'Solve 5 coding challenges.',
    'milestone', 'common', '🧮', 150,
    'challenges_solved', 5, 201
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    'Algorithm Adept',
    'Solve 25 coding challenges.',
    'milestone', 'rare', '🎯', 500,
    'challenges_solved', 25, 202
  ),
  (
    'c1000000-0000-0000-0000-000000000004',
    'Coding Warrior',
    'Solve 100 coding challenges.',
    'milestone', 'epic', '🛡️', 1500,
    'challenges_solved', 100, 203
  ),
  (
    'c1000000-0000-0000-0000-000000000005',
    'Grandmaster Coder',
    'Solve 200 challenges — you are unstoppable.',
    'milestone', 'legendary', '👑', 5000,
    'challenges_solved', 200, 204
  ),
  -- Streak: daily challenges
  (
    'c2000000-0000-0000-0000-000000000001',
    'Daily Grinder',
    'Complete daily challenges for 7 days straight.',
    'streak', 'uncommon', '📅', 200,
    'challenge_streak', 7, 210
  ),
  (
    'c2000000-0000-0000-0000-000000000002',
    'Monthly Devotion',
    'Maintain a 30-day daily challenge streak.',
    'streak', 'epic', '🗓️', 1000,
    'challenge_streak', 30, 211
  ),
  -- Duel wins
  (
    'c3000000-0000-0000-0000-000000000001',
    'Gladiator',
    'Win your first 1v1 coding duel.',
    'community', 'uncommon', '🤺', 200,
    'duel_wins', 1, 220
  ),
  (
    'c3000000-0000-0000-0000-000000000002',
    'Duel Master',
    'Win 10 coding duels.',
    'community', 'rare', '🏆', 500,
    'duel_wins', 10, 221
  )
ON CONFLICT (id) DO NOTHING;
