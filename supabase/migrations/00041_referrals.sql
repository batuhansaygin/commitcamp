-- Referral program: invite codes on profiles + referral rows + achievement seed

-- ── XP reason for referral rewards ───────────────────────────────────────────
ALTER TABLE public.xp_transactions DROP CONSTRAINT IF EXISTS xp_transactions_reason_check;
ALTER TABLE public.xp_transactions ADD CONSTRAINT xp_transactions_reason_check
  CHECK (reason IN (
    'post_created','first_post','comment_added','reaction_received','follower_gained',
    'challenge_solved','duel_won','duel_lost','contest_participation','contest_placement',
    'challenge_created','daily_challenge','achievement_unlocked','hint_penalty',
    'referral_reward'
  ));

-- ── Profile invite code (one stable code per user) ───────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS invite_code text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_invite_code_unique
  ON public.profiles (invite_code)
  WHERE invite_code IS NOT NULL;

-- ── Referrals ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invite_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','rewarded')),
  reward_type text CHECK (reward_type IS NULL OR reward_type IN ('free_month','xp_bonus')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  rewarded_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS referrals_referred_unique
  ON public.referrals (referred_id)
  WHERE referred_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON public.referrals (referrer_id);
CREATE INDEX IF NOT EXISTS referrals_status_idx ON public.referrals (status);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrals_select_own" ON public.referrals;
CREATE POLICY "referrals_select_own"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- ── Achievement: first successful referral ───────────────────────────────────
INSERT INTO public.achievements (
  id, name, description, category, rarity, icon, xp_reward,
  requirement_type, requirement_value, sort_order
) VALUES (
  'referral_first',
  'Networker',
  'Successfully referred a friend who subscribed to Pro',
  'special',
  'uncommon',
  '🔗',
  100,
  'manual',
  1,
  950
)
ON CONFLICT (id) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  xp_reward = excluded.xp_reward;
