-- ============================================================
-- Migration: 00016_challenges.sql
-- Coding Challenge System
-- Tables, RLS, triggers, RPCs, and 20 seed challenges
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

CREATE TYPE challenge_difficulty AS ENUM ('easy','medium','hard','expert');
CREATE TYPE challenge_status    AS ENUM ('draft','pending_review','published','archived');
CREATE TYPE submission_status   AS ENUM ('pending','running','passed','failed','error','timeout');
CREATE TYPE challenge_category  AS ENUM (
  'algorithms','data_structures','strings','arrays','math','sorting','searching',
  'dynamic_programming','graphs','trees','recursion','regex','sql_challenge',
  'web','api','system_design','debugging','optimization','fun'
);
CREATE TYPE duel_status    AS ENUM ('pending','active','completed','expired','declined');
CREATE TYPE contest_status AS ENUM ('upcoming','active','ended');

-- ============================================================
-- 2. TABLE: challenges
-- ============================================================

CREATE TABLE public.challenges (
  id                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  title                text         NOT NULL,
  slug                 text         UNIQUE NOT NULL,
  description          text         NOT NULL,
  difficulty           challenge_difficulty NOT NULL,
  category             challenge_category   NOT NULL,
  tags                 text[]       DEFAULT '{}',
  supported_languages  text[]       NOT NULL DEFAULT '{"javascript","typescript","python","go","java","csharp","cpp","rust","ruby","php","kotlin","swift"}',
  starter_code         jsonb        NOT NULL DEFAULT '{}',
  test_cases           jsonb        NOT NULL,
  time_limit_ms        integer      DEFAULT 5000,
  memory_limit_mb      integer      DEFAULT 256,
  author_id            uuid         REFERENCES profiles(id) ON DELETE SET NULL,
  is_official          boolean      DEFAULT false,
  status               challenge_status DEFAULT 'draft',
  submissions_count    integer      DEFAULT 0,
  solved_count         integer      DEFAULT 0,
  solve_rate           numeric(5,2) DEFAULT 0,
  avg_solve_time_ms    integer      DEFAULT 0,
  likes_count          integer      DEFAULT 0,
  xp_reward            integer      NOT NULL,
  xp_first_solve_bonus integer      DEFAULT 0,
  xp_speed_bonus_max   integer      DEFAULT 0,
  hints                jsonb        DEFAULT '[]',
  constraints          text,
  examples             jsonb        DEFAULT '[]',
  created_at           timestamptz  DEFAULT now(),
  updated_at           timestamptz  DEFAULT now()
);

-- ============================================================
-- 3. TABLE: submissions
-- ============================================================

CREATE TABLE public.submissions (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id      uuid         REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id           uuid         REFERENCES profiles(id)   ON DELETE CASCADE NOT NULL,
  code              text         NOT NULL,
  language          text         NOT NULL,
  status            submission_status DEFAULT 'pending',
  test_results      jsonb        DEFAULT '[]',
  tests_passed      integer      DEFAULT 0,
  tests_total       integer      DEFAULT 0,
  execution_time_ms integer      DEFAULT 0,
  memory_used_mb    numeric(10,2) DEFAULT 0,
  error_message     text,
  score             integer      DEFAULT 0,
  xp_earned         integer      DEFAULT 0,
  is_first_solve    boolean      DEFAULT false,
  created_at        timestamptz  DEFAULT now()
);

-- ============================================================
-- 4. TABLE: challenge_solves
-- ============================================================

CREATE TABLE public.challenge_solves (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id        uuid        REFERENCES challenges(id)  ON DELETE CASCADE NOT NULL,
  user_id             uuid        REFERENCES profiles(id)    ON DELETE CASCADE NOT NULL,
  best_submission_id  uuid        REFERENCES submissions(id),
  best_time_ms        integer,
  best_language       text,
  solved_at           timestamptz DEFAULT now(),
  attempts_count      integer     DEFAULT 1,
  hints_used          integer     DEFAULT 0,
  UNIQUE(challenge_id, user_id)
);

-- ============================================================
-- 5. TABLE: challenge_likes
-- ============================================================

CREATE TABLE public.challenge_likes (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid        REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id      uuid        REFERENCES profiles(id)   ON DELETE CASCADE NOT NULL,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- ============================================================
-- 6. TABLE: duels
-- ============================================================

CREATE TABLE public.duels (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id             uuid        REFERENCES challenges(id)  ON DELETE CASCADE NOT NULL,
  challenger_id            uuid        REFERENCES profiles(id)    ON DELETE CASCADE NOT NULL,
  opponent_id              uuid        REFERENCES profiles(id)    ON DELETE CASCADE,
  status                   duel_status DEFAULT 'pending',
  challenger_submission_id uuid        REFERENCES submissions(id),
  opponent_submission_id   uuid        REFERENCES submissions(id),
  challenger_time_ms       integer,
  opponent_time_ms         integer,
  winner_id                uuid        REFERENCES profiles(id),
  xp_stake                 integer     DEFAULT 50,
  started_at               timestamptz,
  expires_at               timestamptz,
  completed_at             timestamptz,
  time_limit_minutes       integer     DEFAULT 30,
  created_at               timestamptz DEFAULT now()
);

-- ============================================================
-- 7. TABLE: contests
-- ============================================================

CREATE TABLE public.contests (
  id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  title              text          NOT NULL,
  description        text,
  status             contest_status DEFAULT 'upcoming',
  challenge_ids      uuid[]        NOT NULL DEFAULT '{}',
  starts_at          timestamptz   NOT NULL,
  ends_at            timestamptz   NOT NULL,
  xp_participation   integer       DEFAULT 50,
  xp_first_place     integer       DEFAULT 500,
  xp_second_place    integer       DEFAULT 300,
  xp_third_place     integer       DEFAULT 150,
  xp_top_10          integer       DEFAULT 75,
  participants_count integer       DEFAULT 0,
  created_at         timestamptz   DEFAULT now()
);

-- ============================================================
-- 8. TABLE: contest_participants
-- ============================================================

CREATE TABLE public.contest_participants (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id        uuid        REFERENCES contests(id) ON DELETE CASCADE NOT NULL,
  user_id           uuid        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  score             integer     DEFAULT 0,
  challenges_solved integer     DEFAULT 0,
  total_time_ms     integer     DEFAULT 0,
  rank              integer,
  xp_earned         integer     DEFAULT 0,
  joined_at         timestamptz DEFAULT now(),
  UNIQUE(contest_id, user_id)
);

-- ============================================================
-- 9. TABLE: daily_challenges
-- ============================================================

CREATE TABLE public.daily_challenges (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid        REFERENCES challenges(id) NOT NULL,
  date         date        UNIQUE NOT NULL,
  created_at   timestamptz DEFAULT now()
);

-- ============================================================
-- 10. TABLE: challenge_comments
-- ============================================================

CREATE TABLE public.challenge_comments (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid        REFERENCES challenges(id)          ON DELETE CASCADE NOT NULL,
  user_id      uuid        REFERENCES profiles(id)            ON DELETE CASCADE NOT NULL,
  parent_id    uuid        REFERENCES challenge_comments(id)  ON DELETE CASCADE,
  content      text        NOT NULL,
  is_solution  boolean     DEFAULT false,
  spoiler      boolean     DEFAULT false,
  likes_count  integer     DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

-- ============================================================
-- 11. ALTER TABLE profiles — add challenge columns
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS challenges_solved integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS challenge_streak  integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS challenge_rank    text    DEFAULT 'unranked';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS duel_wins         integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS duel_losses       integer DEFAULT 0;

-- ============================================================
-- 12. ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.challenges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_solves     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_likes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duels                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_comments   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 13. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_challenges_difficulty      ON public.challenges(difficulty, status);
CREATE INDEX IF NOT EXISTS idx_challenges_category        ON public.challenges(category, status);
CREATE INDEX IF NOT EXISTS idx_challenges_slug            ON public.challenges(slug);
CREATE INDEX IF NOT EXISTS idx_challenges_author          ON public.challenges(author_id);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge_user ON public.submissions(challenge_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_user           ON public.submissions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_solves_user      ON public.challenge_solves(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_solves_challenge ON public.challenge_solves(challenge_id, best_time_ms ASC);
CREATE INDEX IF NOT EXISTS idx_duels_users                ON public.duels(challenger_id, opponent_id, status);
CREATE INDEX IF NOT EXISTS idx_contest_participants       ON public.contest_participants(contest_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date      ON public.daily_challenges(date DESC);

-- ============================================================
-- 14. RLS POLICIES
-- ============================================================

-- challenges: published visible to all; authors see their own drafts
CREATE POLICY "challenges_select_published" ON public.challenges
  FOR SELECT USING (status = 'published' OR auth.uid() = author_id);
CREATE POLICY "challenges_insert_auth" ON public.challenges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "challenges_update_own" ON public.challenges
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- submissions: users see only their own
CREATE POLICY "submissions_select_own" ON public.submissions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "submissions_insert_own" ON public.submissions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- challenge_solves: public leaderboard
CREATE POLICY "challenge_solves_select_all" ON public.challenge_solves FOR SELECT USING (true);
CREATE POLICY "challenge_solves_insert_own" ON public.challenge_solves
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "challenge_solves_update_own" ON public.challenge_solves
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- challenge_likes
CREATE POLICY "challenge_likes_select_all" ON public.challenge_likes FOR SELECT USING (true);
CREATE POLICY "challenge_likes_insert_own" ON public.challenge_likes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "challenge_likes_delete_own" ON public.challenge_likes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- duels: participants only
CREATE POLICY "duels_select_participant" ON public.duels
  FOR SELECT TO authenticated USING (challenger_id = auth.uid() OR opponent_id = auth.uid());
CREATE POLICY "duels_insert_auth" ON public.duels
  FOR INSERT TO authenticated WITH CHECK (challenger_id = auth.uid());
CREATE POLICY "duels_update_participant" ON public.duels
  FOR UPDATE TO authenticated USING (challenger_id = auth.uid() OR opponent_id = auth.uid());

-- contests: public read
CREATE POLICY "contests_select_all" ON public.contests FOR SELECT USING (true);

-- contest_participants: public leaderboard
CREATE POLICY "contest_participants_select_all" ON public.contest_participants FOR SELECT USING (true);
CREATE POLICY "contest_participants_insert_own" ON public.contest_participants
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- daily_challenges: public read
CREATE POLICY "daily_challenges_select_all" ON public.daily_challenges FOR SELECT USING (true);

-- challenge_comments: public read, own write
CREATE POLICY "challenge_comments_select_all" ON public.challenge_comments FOR SELECT USING (true);
CREATE POLICY "challenge_comments_insert_own" ON public.challenge_comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "challenge_comments_update_own" ON public.challenge_comments
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "challenge_comments_delete_own" ON public.challenge_comments
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============================================================
-- 15. TRIGGER FUNCTIONS
-- ============================================================

-- On new challenge_solve: update solved_count + solve_rate + profile counter
CREATE OR REPLACE FUNCTION public.handle_challenge_solve()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.challenges
  SET solved_count = solved_count + 1,
      solve_rate   = ROUND((solved_count + 1)::numeric / NULLIF(submissions_count, 0) * 100, 2)
  WHERE id = NEW.challenge_id;
  UPDATE public.profiles
  SET challenges_solved = challenges_solved + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_challenge_solve ON public.challenge_solves;
CREATE TRIGGER trg_challenge_solve
  AFTER INSERT ON public.challenge_solves
  FOR EACH ROW EXECUTE FUNCTION public.handle_challenge_solve();

-- On new submission: increment submissions_count
CREATE OR REPLACE FUNCTION public.handle_submission_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.challenges SET submissions_count = submissions_count + 1 WHERE id = NEW.challenge_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_submission_count ON public.submissions;
CREATE TRIGGER trg_submission_count
  AFTER INSERT ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_submission_insert();

-- On like insert/delete: sync likes_count
CREATE OR REPLACE FUNCTION public.handle_challenge_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.challenges SET likes_count = likes_count + 1 WHERE id = NEW.challenge_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.challenges SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.challenge_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_challenge_like ON public.challenge_likes;
CREATE TRIGGER trg_challenge_like
  AFTER INSERT OR DELETE ON public.challenge_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_challenge_like();

-- ============================================================
-- 16. RPC FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_challenge_leaderboard(
  p_challenge_id uuid,
  p_limit        int DEFAULT 20
)
RETURNS TABLE (
  rank         bigint,
  user_id      uuid,
  username     text,
  display_name text,
  avatar_url   text,
  level        int,
  best_time_ms int,
  best_language text,
  solved_at    timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY cs.best_time_ms ASC NULLS LAST, cs.solved_at ASC) AS rank,
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.level,
    cs.best_time_ms,
    cs.best_language,
    cs.solved_at
  FROM public.challenge_solves cs
  JOIN public.profiles p ON p.id = cs.user_id
  WHERE cs.challenge_id = p_challenge_id
  ORDER BY cs.best_time_ms ASC NULLS LAST, cs.solved_at ASC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.calculate_challenge_rank(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_solved int;
  v_rank   text;
BEGIN
  SELECT challenges_solved INTO v_solved FROM public.profiles WHERE id = p_user_id;
  v_rank := CASE
    WHEN v_solved >= 201 THEN 'grandmaster'
    WHEN v_solved >= 101 THEN 'diamond'
    WHEN v_solved >= 61  THEN 'platinum'
    WHEN v_solved >= 31  THEN 'gold'
    WHEN v_solved >= 11  THEN 'silver'
    WHEN v_solved >= 1   THEN 'bronze'
    ELSE 'unranked'
  END;
  UPDATE public.profiles SET challenge_rank = v_rank WHERE id = p_user_id;
  RETURN v_rank;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_challenge_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_profile     record;
  v_easy        int;
  v_medium      int;
  v_hard        int;
  v_expert      int;
  v_global_rank bigint;
BEGIN
  SELECT challenges_solved, challenge_streak, challenge_rank, duel_wins, duel_losses
  INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  SELECT
    COUNT(*) FILTER (WHERE c.difficulty = 'easy'),
    COUNT(*) FILTER (WHERE c.difficulty = 'medium'),
    COUNT(*) FILTER (WHERE c.difficulty = 'hard'),
    COUNT(*) FILTER (WHERE c.difficulty = 'expert')
  INTO v_easy, v_medium, v_hard, v_expert
  FROM public.challenge_solves cs
  JOIN public.challenges c ON c.id = cs.challenge_id
  WHERE cs.user_id = p_user_id;

  SELECT COUNT(*) + 1 INTO v_global_rank
  FROM public.profiles
  WHERE challenges_solved > COALESCE(v_profile.challenges_solved, 0);

  RETURN json_build_object(
    'total_solved',   COALESCE(v_profile.challenges_solved, 0),
    'easy_solved',    COALESCE(v_easy, 0),
    'medium_solved',  COALESCE(v_medium, 0),
    'hard_solved',    COALESCE(v_hard, 0),
    'expert_solved',  COALESCE(v_expert, 0),
    'current_streak', COALESCE(v_profile.challenge_streak, 0),
    'challenge_rank', COALESCE(v_profile.challenge_rank, 'unranked'),
    'duel_wins',      COALESCE(v_profile.duel_wins, 0),
    'duel_losses',    COALESCE(v_profile.duel_losses, 0),
    'global_rank',    v_global_rank
  );
END;
$$;

-- ============================================================
-- 17. UPDATE xp_transactions CONSTRAINT
-- ============================================================

ALTER TABLE public.xp_transactions DROP CONSTRAINT IF EXISTS xp_transactions_reason_check;
ALTER TABLE public.xp_transactions ADD CONSTRAINT xp_transactions_reason_check
  CHECK (reason IN (
    'post_created','first_post','comment_added','reaction_received','follower_gained',
    'challenge_solved','duel_won','duel_lost','contest_participation','contest_placement',
    'challenge_created','daily_challenge','achievement_unlocked','hint_penalty'
  ));

-- ============================================================
-- 18. ENABLE REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.duels;

-- ============================================================
-- 19. SEED DATA — 20 official challenges
-- ============================================================

DO $$
BEGIN

-- ----------------------------------------------------------------
-- Challenge 1: Two Sum (easy, arrays)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Two Sum',
  'two-sum',
  $d$## Two Sum

Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers that add up to `target`.

Each input has exactly one solution. You may not use the same element twice. Return the two 0-based indices separated by a space in any order.

### Input Format
- Line 1: `n` (array size)
- Line 2: `n` space-separated integers
- Line 3: `target`

### Output Format
Two space-separated indices, e.g. `0 1`$d$,
  'easy', 'arrays', ARRAY['hash-map','array','classic'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const lines = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\n');
const n = parseInt(lines[0]);
const nums = lines[1].split(' ').map(Number);
const target = parseInt(lines[2]);

/**
 * @param {number[]} nums
 * @param {number} target
 * @returns {number[]} - indices of the two numbers
 */
function solve(nums, target) {
  // TODO: implement your solution
}

const result = solve(nums, target);
console.log(result.join(' '));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const lines: string[] = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\n');
const n: number = parseInt(lines[0]);
const nums: number[] = lines[1].split(' ').map(Number);
const target: number = parseInt(lines[2]);

function solve(nums: number[], target: number): number[] {
  // TODO: implement your solution
  return [];
}

const result = solve(nums, target);
console.log(result.join(' '));
$tsc$,
    'python', $pyc$import sys
data = sys.stdin.read().strip().split('\n')
n = int(data[0])
nums = list(map(int, data[1].split()))
target = int(data[2])

def solve(nums: list, target: int) -> list:
    # TODO: implement your solution
    pass

result = solve(nums, target)
print(' '.join(map(str, result)))
$pyc$,
    'java', $jvc$import java.util.Scanner;

public class Solution {
    public static int[] solve(int[] nums, int target) {
        // TODO: implement your solution
        return new int[]{};
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.nextLine().trim());
        String[] parts = sc.nextLine().trim().split(" ");
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = Integer.parseInt(parts[i]);
        int target = Integer.parseInt(sc.nextLine().trim());
        int[] r = solve(nums, target);
        System.out.println(r[0] + " " + r[1]);
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func solve(nums []int, target int) [2]int {
	// TODO: implement your solution
	return [2]int{}
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	sc.Scan() // n
	sc.Scan()
	parts := strings.Fields(sc.Text())
	nums := make([]int, len(parts))
	for i, p := range parts {
		nums[i], _ = strconv.Atoi(p)
	}
	sc.Scan()
	target, _ := strconv.Atoi(strings.TrimSpace(sc.Text()))
	r := solve(nums, target)
	fmt.Printf("%d %d\n", r[0], r[1])
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <vector>
using namespace std;

vector<int> solve(vector<int>& nums, int target) {
    // TODO: implement your solution
    return {};
}

int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target; cin >> target;
    auto r = solve(nums, target);
    cout << r[0] << " " << r[1] << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', '4
2 7 11 15
9', 'expected_output', '0 1', 'is_hidden', false),
    jsonb_build_object('input', '3
3 2 4
6', 'expected_output', '1 2', 'is_hidden', false),
    jsonb_build_object('input', '2
3 3
6', 'expected_output', '0 1', 'is_hidden', false),
    jsonb_build_object('input', '4
1 5 3 8
11', 'expected_output', '1 3', 'is_hidden', true),
    jsonb_build_object('input', '5
0 4 3 0 1
0', 'expected_output', '0 3', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Use a hash map to store each number and its index as you iterate.',
    'For each element x, check if (target - x) already exists in the map before inserting x.'
  ),
  '2 <= n <= 10^4; -10^9 <= nums[i] <= 10^9; Exactly one valid answer exists.',
  jsonb_build_array(
    jsonb_build_object('input', '4\n2 7 11 15\n9', 'output', '0 1', 'explanation', 'nums[0] + nums[1] = 2 + 7 = 9')
  ),
  true, 'published', 50, 25, 15
);

-- ----------------------------------------------------------------
-- Challenge 2: Reverse String (easy, strings)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Reverse String',
  'reverse-string',
  $d$## Reverse String

Write a function that takes a string and returns it reversed.

### Input Format
A single line containing a string (may be empty).

### Output Format
The reversed string on a single line.$d$,
  'easy', 'strings', ARRAY['string','two-pointers'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const input = fs.readFileSync('/dev/stdin', 'utf8');
const s = input.split('\n')[0];

/**
 * @param {string} s
 * @returns {string}
 */
function solve(s) {
  // TODO: implement your solution
}

console.log(solve(s));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const s: string = fs.readFileSync('/dev/stdin', 'utf8').split('\n')[0];

function solve(s: string): string {
  // TODO: implement your solution
  return '';
}

console.log(solve(s));
$tsc$,
    'python', $pyc$import sys
s = sys.stdin.readline().rstrip('\n')

def solve(s: str) -> str:
    # TODO: implement your solution
    pass

print(solve(s))
$pyc$,
    'java', $jvc$import java.util.Scanner;

public class Solution {
    public static String solve(String s) {
        // TODO: implement your solution
        return "";
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        System.out.println(solve(s));
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func solve(s string) string {
	// TODO: implement your solution
	return ""
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Scan()
	s := strings.TrimRight(sc.Text(), "\r")
	fmt.Println(solve(s))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <string>
using namespace std;

string solve(string s) {
    // TODO: implement your solution
    return "";
}

int main() {
    string s;
    getline(cin, s);
    cout << solve(s) << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', 'hello', 'expected_output', 'olleh', 'is_hidden', false),
    jsonb_build_object('input', 'world', 'expected_output', 'dlrow', 'is_hidden', false),
    jsonb_build_object('input', '', 'expected_output', '', 'is_hidden', false),
    jsonb_build_object('input', 'racecar', 'expected_output', 'racecar', 'is_hidden', false),
    jsonb_build_object('input', 'abcde', 'expected_output', 'edcba', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Try iterating from end to start and building a new string.',
    'You can use a two-pointer approach: swap characters at positions i and n-1-i.'
  ),
  '0 <= s.length <= 10^5; s consists of printable ASCII characters.',
  jsonb_build_array(
    jsonb_build_object('input', 'hello', 'output', 'olleh', 'explanation', 'Characters read in reverse order')
  ),
  true, 'published', 50, 20, 10
);

-- ----------------------------------------------------------------
-- Challenge 3: FizzBuzz (easy, fun)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'FizzBuzz',
  'fizzbuzz',
  $d$## FizzBuzz

Given an integer `n`, return a list of strings from `1` to `n` where:
- Multiples of **15** → `"FizzBuzz"`
- Multiples of **3** only → `"Fizz"`
- Multiples of **5** only → `"Buzz"`
- All others → the number as a string

### Input Format
A single integer `n`.

### Output Format
`n` lines, one entry per line.$d$,
  'easy', 'fun', ARRAY['iteration','modulo','classic'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const n = parseInt(fs.readFileSync('/dev/stdin', 'utf8').trim());

/**
 * @param {number} n
 * @returns {string[]}
 */
function solve(n) {
  // TODO: return an array of n FizzBuzz strings
}

console.log(solve(n).join('\n'));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const n: number = parseInt(fs.readFileSync('/dev/stdin', 'utf8').trim());

function solve(n: number): string[] {
  // TODO: return an array of n FizzBuzz strings
  return [];
}

console.log(solve(n).join('\n'));
$tsc$,
    'python', $pyc$import sys
n = int(sys.stdin.read().strip())

def solve(n: int) -> list:
    # TODO: return a list of n FizzBuzz strings
    pass

print('\n'.join(solve(n)))
$pyc$,
    'java', $jvc$import java.util.Scanner;

public class Solution {
    public static String[] solve(int n) {
        // TODO: return array of n FizzBuzz strings
        return new String[]{};
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.nextLine().trim());
        String[] result = solve(n);
        for (String s : result) System.out.println(s);
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func solve(n int) []string {
	// TODO: return a slice of n FizzBuzz strings
	return nil
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Scan()
	n, _ := strconv.Atoi(strings.TrimSpace(sc.Text()))
	fmt.Println(strings.Join(solve(n), "\n"))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <vector>
#include <string>
using namespace std;

vector<string> solve(int n) {
    // TODO: return a vector of n FizzBuzz strings
    return {};
}

int main() {
    int n; cin >> n;
    auto result = solve(n);
    for (const auto& s : result) cout << s << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', '5', 'expected_output', '1
2
Fizz
4
Buzz', 'is_hidden', false),
    jsonb_build_object('input', '15', 'expected_output', '1
2
Fizz
4
Buzz
Fizz
7
8
Fizz
Buzz
11
Fizz
13
14
FizzBuzz', 'is_hidden', false),
    jsonb_build_object('input', '1', 'expected_output', '1', 'is_hidden', false),
    jsonb_build_object('input', '20', 'expected_output', '1
2
Fizz
4
Buzz
Fizz
7
8
Fizz
Buzz
11
Fizz
13
14
FizzBuzz
16
17
Fizz
19
Buzz', 'is_hidden', true),
    jsonb_build_object('input', '3', 'expected_output', '1
2
Fizz', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Check divisibility by 15 first, then 3, then 5.',
    'Use the modulo operator (%) to check divisibility.'
  ),
  '1 <= n <= 10^4',
  jsonb_build_array(
    jsonb_build_object('input', '5', 'output', '1\n2\nFizz\n4\nBuzz', 'explanation', 'Multiples of 3 become Fizz, multiples of 5 become Buzz')
  ),
  true, 'published', 30, 10, 5
);

-- ----------------------------------------------------------------
-- Challenge 4: Palindrome Check (easy, strings)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Palindrome Check',
  'palindrome-check',
  $d$## Palindrome Check

Given a string `s` of lowercase letters, return `"true"` if it is a palindrome, or `"false"` otherwise.

A palindrome reads the same forwards and backwards.

### Input Format
A single line string (lowercase letters only).

### Output Format
`true` or `false`$d$,
  'easy', 'strings', ARRAY['string','two-pointers','palindrome'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const s = fs.readFileSync('/dev/stdin', 'utf8').trim();

/**
 * @param {string} s
 * @returns {boolean}
 */
function solve(s) {
  // TODO: return true if s is a palindrome
}

console.log(String(solve(s)));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const s: string = fs.readFileSync('/dev/stdin', 'utf8').trim();

function solve(s: string): boolean {
  // TODO: return true if s is a palindrome
  return false;
}

console.log(String(solve(s)));
$tsc$,
    'python', $pyc$import sys
s = sys.stdin.read().strip()

def solve(s: str) -> bool:
    # TODO: return True if s is a palindrome
    pass

print(str(solve(s)).lower())
$pyc$,
    'java', $jvc$import java.util.Scanner;

public class Solution {
    public static boolean solve(String s) {
        // TODO: return true if s is a palindrome
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine().trim() : "";
        System.out.println(solve(s));
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func solve(s string) bool {
	// TODO: return true if s is a palindrome
	return false
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Scan()
	s := strings.TrimSpace(sc.Text())
	fmt.Println(solve(s))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <string>
using namespace std;

bool solve(const string& s) {
    // TODO: return true if s is a palindrome
    return false;
}

int main() {
    string s;
    getline(cin, s);
    cout << (solve(s) ? "true" : "false") << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', 'racecar', 'expected_output', 'true', 'is_hidden', false),
    jsonb_build_object('input', 'hello', 'expected_output', 'false', 'is_hidden', false),
    jsonb_build_object('input', '', 'expected_output', 'true', 'is_hidden', false),
    jsonb_build_object('input', 'a', 'expected_output', 'true', 'is_hidden', false),
    jsonb_build_object('input', 'abcba', 'expected_output', 'true', 'is_hidden', false),
    jsonb_build_object('input', 'abcd', 'expected_output', 'false', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Compare the string with its reverse.',
    'Use two pointers: one at start, one at end, moving toward the center.'
  ),
  '0 <= s.length <= 10^5; s contains only lowercase English letters.',
  jsonb_build_array(
    jsonb_build_object('input', 'racecar', 'output', 'true', 'explanation', 'Reads the same forwards and backwards')
  ),
  true, 'published', 50, 20, 10
);

-- ----------------------------------------------------------------
-- Challenge 5: Find Maximum (easy, arrays)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Find Maximum',
  'find-maximum',
  $d$## Find Maximum

Given an array of integers, return the largest value.

### Input Format
- Line 1: `n` (array size)
- Line 2: `n` space-separated integers

### Output Format
A single integer — the maximum value.$d$,
  'easy', 'arrays', ARRAY['array','iteration'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const lines = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\n');
const n = parseInt(lines[0]);
const nums = lines[1].split(' ').map(Number);

/**
 * @param {number[]} nums
 * @returns {number}
 */
function solve(nums) {
  // TODO: return the maximum value
}

console.log(solve(nums));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const lines: string[] = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\n');
const nums: number[] = lines[1].split(' ').map(Number);

function solve(nums: number[]): number {
  // TODO: return the maximum value
  return 0;
}

console.log(solve(nums));
$tsc$,
    'python', $pyc$import sys
data = sys.stdin.read().strip().split('\n')
n = int(data[0])
nums = list(map(int, data[1].split()))

def solve(nums: list) -> int:
    # TODO: return the maximum value
    pass

print(solve(nums))
$pyc$,
    'java', $jvc$import java.util.Scanner;

public class Solution {
    public static int solve(int[] nums) {
        // TODO: return the maximum value
        return Integer.MIN_VALUE;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.nextLine().trim());
        String[] parts = sc.nextLine().trim().split(" ");
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = Integer.parseInt(parts[i]);
        System.out.println(solve(nums));
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func solve(nums []int) int {
	// TODO: return the maximum value
	return 0
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	sc.Scan() // n
	sc.Scan()
	parts := strings.Fields(sc.Text())
	nums := make([]int, len(parts))
	for i, p := range parts {
		nums[i], _ = strconv.Atoi(p)
	}
	fmt.Println(solve(nums))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <vector>
using namespace std;

int solve(vector<int>& nums) {
    // TODO: return the maximum value
    return 0;
}

int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    cout << solve(nums) << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', '3
1 5 3', 'expected_output', '5', 'is_hidden', false),
    jsonb_build_object('input', '1
-5', 'expected_output', '-5', 'is_hidden', false),
    jsonb_build_object('input', '5
9 2 7 3 1', 'expected_output', '9', 'is_hidden', false),
    jsonb_build_object('input', '4
-1 -3 -2 -4', 'expected_output', '-1', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Initialize max with the first element, not 0 (handles all-negative arrays).',
    'Iterate through the array, updating max whenever you find a larger value.'
  ),
  '1 <= n <= 10^5; -10^9 <= nums[i] <= 10^9',
  jsonb_build_array(
    jsonb_build_object('input', '3\n1 5 3', 'output', '5', 'explanation', '5 is the largest of 1, 5, 3')
  ),
  true, 'published', 30, 10, 5
);

-- ----------------------------------------------------------------
-- Challenge 6: Count Vowels (easy, strings)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Count Vowels',
  'count-vowels',
  $d$## Count Vowels

Given a string, count the number of vowels (`a`, `e`, `i`, `o`, `u`) it contains. The check is case-insensitive.

### Input Format
A single line string.

### Output Format
A single integer — the count of vowels.$d$,
  'easy', 'strings', ARRAY['string','iteration','counting'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const s = fs.readFileSync('/dev/stdin', 'utf8').split('\n')[0];

/**
 * @param {string} s
 * @returns {number}
 */
function solve(s) {
  // TODO: count vowels (a, e, i, o, u), case-insensitive
}

console.log(solve(s));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const s: string = fs.readFileSync('/dev/stdin', 'utf8').split('\n')[0];

function solve(s: string): number {
  // TODO: count vowels (a, e, i, o, u), case-insensitive
  return 0;
}

console.log(solve(s));
$tsc$,
    'python', $pyc$import sys
s = sys.stdin.readline().rstrip('\n')

def solve(s: str) -> int:
    # TODO: count vowels (a, e, i, o, u), case-insensitive
    pass

print(solve(s))
$pyc$,
    'java', $jvc$import java.util.Scanner;

public class Solution {
    public static int solve(String s) {
        // TODO: count vowels (a, e, i, o, u), case-insensitive
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        System.out.println(solve(s));
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func solve(s string) int {
	// TODO: count vowels (a, e, i, o, u), case-insensitive
	return 0
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Scan()
	s := strings.TrimRight(sc.Text(), "\r")
	fmt.Println(solve(s))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <string>
using namespace std;

int solve(const string& s) {
    // TODO: count vowels (a, e, i, o, u), case-insensitive
    return 0;
}

int main() {
    string s;
    getline(cin, s);
    cout << solve(s) << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', 'hello', 'expected_output', '2', 'is_hidden', false),
    jsonb_build_object('input', 'world', 'expected_output', '1', 'is_hidden', false),
    jsonb_build_object('input', 'aeiou', 'expected_output', '5', 'is_hidden', false),
    jsonb_build_object('input', 'rhythm', 'expected_output', '0', 'is_hidden', false),
    jsonb_build_object('input', 'Programming', 'expected_output', '3', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Convert the string to lowercase first, then check each character.',
    'You can use a set containing "aeiou" for O(1) membership checks.'
  ),
  '0 <= s.length <= 10^5; s consists of printable ASCII characters.',
  jsonb_build_array(
    jsonb_build_object('input', 'hello', 'output', '2', 'explanation', 'e and o are vowels')
  ),
  true, 'published', 40, 15, 5
);

-- ----------------------------------------------------------------
-- Challenge 7: Valid Parentheses (medium, data_structures)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Valid Parentheses',
  'valid-parentheses',
  $d$## Valid Parentheses

Given a string containing only the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is **valid**.

A string is valid if:
1. Open brackets are closed by the same type of brackets.
2. Open brackets are closed in the correct order.
3. Every closing bracket has a corresponding open bracket.

### Input Format
A single line string of bracket characters (may be empty).

### Output Format
`true` or `false`$d$,
  'medium', 'data_structures', ARRAY['stack','string','brackets'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const s = fs.readFileSync('/dev/stdin', 'utf8').split('\n')[0];

/**
 * @param {string} s
 * @returns {boolean}
 */
function solve(s) {
  // TODO: return true if s has valid bracket nesting
}

console.log(String(solve(s)));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const s: string = fs.readFileSync('/dev/stdin', 'utf8').split('\n')[0];

function solve(s: string): boolean {
  // TODO: return true if s has valid bracket nesting
  return false;
}

console.log(String(solve(s)));
$tsc$,
    'python', $pyc$import sys
s = sys.stdin.readline().rstrip('\n')

def solve(s: str) -> bool:
    # TODO: return True if s has valid bracket nesting
    pass

print(str(solve(s)).lower())
$pyc$,
    'java', $jvc$import java.util.Scanner;

public class Solution {
    public static boolean solve(String s) {
        // TODO: return true if s has valid bracket nesting
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        System.out.println(solve(s));
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func solve(s string) bool {
	// TODO: return true if s has valid bracket nesting
	return false
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Scan()
	s := strings.TrimRight(sc.Text(), "\r")
	fmt.Println(solve(s))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <string>
using namespace std;

bool solve(const string& s) {
    // TODO: return true if s has valid bracket nesting
    return false;
}

int main() {
    string s;
    getline(cin, s);
    cout << (solve(s) ? "true" : "false") << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', '()', 'expected_output', 'true', 'is_hidden', false),
    jsonb_build_object('input', '()[]{};', 'expected_output', 'true', 'is_hidden', false),
    jsonb_build_object('input', '(]', 'expected_output', 'false', 'is_hidden', false),
    jsonb_build_object('input', '([)]', 'expected_output', 'false', 'is_hidden', false),
    jsonb_build_object('input', '{[]}', 'expected_output', 'true', 'is_hidden', false),
    jsonb_build_object('input', '(((', 'expected_output', 'false', 'is_hidden', true),
    jsonb_build_object('input', '', 'expected_output', 'true', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Use a stack: push open brackets, pop and verify on closing brackets.',
    'At the end, the stack must be empty for the string to be valid.'
  ),
  '0 <= s.length <= 10^4; s consists only of the characters ()[]{};',
  jsonb_build_array(
    jsonb_build_object('input', '{[]}', 'output', 'true', 'explanation', 'Each closing bracket matches the most recent open bracket')
  ),
  true, 'published', 100, 40, 20
);

-- ----------------------------------------------------------------
-- Challenge 8: Fibonacci Sequence (medium, dynamic_programming)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Fibonacci Sequence',
  'fibonacci-sequence',
  $d$## Fibonacci Sequence

Given `n`, return the `n`-th Fibonacci number (0-indexed).

The Fibonacci sequence is defined as:
- `fib(0) = 0`
- `fib(1) = 1`
- `fib(n) = fib(n-1) + fib(n-2)` for `n >= 2`

### Input Format
A single integer `n`.

### Output Format
The `n`-th Fibonacci number.$d$,
  'medium', 'dynamic_programming', ARRAY['dp','recursion','memoization'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const n = parseInt(fs.readFileSync('/dev/stdin', 'utf8').trim());

/**
 * @param {number} n
 * @returns {number}
 */
function solve(n) {
  // TODO: return the n-th Fibonacci number (fib(0)=0, fib(1)=1)
}

console.log(solve(n));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const n: number = parseInt(fs.readFileSync('/dev/stdin', 'utf8').trim());

function solve(n: number): number {
  // TODO: return the n-th Fibonacci number (fib(0)=0, fib(1)=1)
  return 0;
}

console.log(solve(n));
$tsc$,
    'python', $pyc$import sys
n = int(sys.stdin.read().strip())

def solve(n: int) -> int:
    # TODO: return the n-th Fibonacci number (fib(0)=0, fib(1)=1)
    pass

print(solve(n))
$pyc$,
    'java', $jvc$import java.util.Scanner;

public class Solution {
    public static long solve(int n) {
        // TODO: return the n-th Fibonacci number (fib(0)=0, fib(1)=1)
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.nextLine().trim());
        System.out.println(solve(n));
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func solve(n int) int64 {
	// TODO: return the n-th Fibonacci number (fib(0)=0, fib(1)=1)
	return 0
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Scan()
	n, _ := strconv.Atoi(strings.TrimSpace(sc.Text()))
	fmt.Println(solve(n))
}
$goc$,
    'cpp', $cppc$#include <iostream>
using namespace std;

long long solve(int n) {
    // TODO: return the n-th Fibonacci number (fib(0)=0, fib(1)=1)
    return 0;
}

int main() {
    int n; cin >> n;
    cout << solve(n) << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', '0', 'expected_output', '0', 'is_hidden', false),
    jsonb_build_object('input', '1', 'expected_output', '1', 'is_hidden', false),
    jsonb_build_object('input', '10', 'expected_output', '55', 'is_hidden', false),
    jsonb_build_object('input', '6', 'expected_output', '8', 'is_hidden', false),
    jsonb_build_object('input', '20', 'expected_output', '6765', 'is_hidden', true),
    jsonb_build_object('input', '30', 'expected_output', '832040', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Avoid naive recursion — it has O(2^n) time complexity.',
    'Use dynamic programming with two variables (a, b) tracking the previous two values.',
    'A loop from 2..n, updating a, b = b, a+b is O(n) time and O(1) space.'
  ),
  '0 <= n <= 50',
  jsonb_build_array(
    jsonb_build_object('input', '10', 'output', '55', 'explanation', '0,1,1,2,3,5,8,13,21,34,55')
  ),
  true, 'published', 100, 40, 20
);

-- ----------------------------------------------------------------
-- Challenge 9: Anagram Detector (medium, strings)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Anagram Detector',
  'anagram-detector',
  $d$## Anagram Detector

Given two strings `s1` and `s2`, return `"true"` if they are anagrams of each other, otherwise `"false"`.

Two strings are anagrams if one can be rearranged to form the other (same characters, same frequencies).

### Input Format
- Line 1: `s1`
- Line 2: `s2`

### Output Format
`true` or `false`$d$,
  'medium', 'strings', ARRAY['hash-map','sorting','anagram'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const lines = fs.readFileSync('/dev/stdin', 'utf8').split('\n');
const s1 = lines[0];
const s2 = lines[1];

/**
 * @param {string} s1
 * @param {string} s2
 * @returns {boolean}
 */
function solve(s1, s2) {
  // TODO: return true if s1 and s2 are anagrams
}

console.log(String(solve(s1, s2)));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const lines: string[] = fs.readFileSync('/dev/stdin', 'utf8').split('\n');
const s1: string = lines[0];
const s2: string = lines[1];

function solve(s1: string, s2: string): boolean {
  // TODO: return true if s1 and s2 are anagrams
  return false;
}

console.log(String(solve(s1, s2)));
$tsc$,
    'python', $pyc$import sys
lines = sys.stdin.read().split('\n')
s1 = lines[0]
s2 = lines[1]

def solve(s1: str, s2: str) -> bool:
    # TODO: return True if s1 and s2 are anagrams
    pass

print(str(solve(s1, s2)).lower())
$pyc$,
    'java', $jvc$import java.util.Scanner;

public class Solution {
    public static boolean solve(String s1, String s2) {
        // TODO: return true if s1 and s2 are anagrams
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s1 = sc.hasNextLine() ? sc.nextLine() : "";
        String s2 = sc.hasNextLine() ? sc.nextLine() : "";
        System.out.println(solve(s1, s2));
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
)

func solve(s1, s2 string) bool {
	// TODO: return true if s1 and s2 are anagrams
	return false
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Scan(); s1 := sc.Text()
	sc.Scan(); s2 := sc.Text()
	fmt.Println(solve(s1, s2))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <string>
using namespace std;

bool solve(const string& s1, const string& s2) {
    // TODO: return true if s1 and s2 are anagrams
    return false;
}

int main() {
    string s1, s2;
    getline(cin, s1);
    getline(cin, s2);
    cout << (solve(s1, s2) ? "true" : "false") << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', 'anagram
nagaram', 'expected_output', 'true', 'is_hidden', false),
    jsonb_build_object('input', 'rat
car', 'expected_output', 'false', 'is_hidden', false),
    jsonb_build_object('input', 'listen
silent', 'expected_output', 'true', 'is_hidden', false),
    jsonb_build_object('input', 'hello
world', 'expected_output', 'false', 'is_hidden', false),
    jsonb_build_object('input', 'a
a', 'expected_output', 'true', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Sort both strings and compare — anagrams will be identical when sorted.',
    'Alternatively, use a frequency map: count characters in s1, subtract for s2, check all zeros.'
  ),
  '1 <= s1.length, s2.length <= 5 * 10^4; s contains only lowercase English letters.',
  jsonb_build_array(
    jsonb_build_object('input', 'listen\nsilent', 'output', 'true', 'explanation', 'Both contain l,i,s,t,e,n with the same frequencies')
  ),
  true, 'published', 100, 40, 20
);

-- ----------------------------------------------------------------
-- Challenge 10: Binary Search (medium, searching)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Binary Search',
  'binary-search',
  $d$## Binary Search

Given a **sorted** array of distinct integers and a `target`, return the **index** of `target` in the array. If not found, return `-1`.

You must achieve `O(log n)` runtime.

### Input Format
- Line 1: `n` (array size)
- Line 2: `n` sorted space-separated integers
- Line 3: `target`

### Output Format
The index (0-based) of `target`, or `-1` if not found.$d$,
  'medium', 'searching', ARRAY['binary-search','array','divide-and-conquer'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const lines = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\n');
const n = parseInt(lines[0]);
const nums = lines[1].split(' ').map(Number);
const target = parseInt(lines[2]);

/**
 * @param {number[]} nums - sorted array
 * @param {number} target
 * @returns {number} index or -1
 */
function solve(nums, target) {
  // TODO: implement binary search
}

console.log(solve(nums, target));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const lines: string[] = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\n');
const nums: number[] = lines[1].split(' ').map(Number);
const target: number = parseInt(lines[2]);

function solve(nums: number[], target: number): number {
  // TODO: implement binary search
  return -1;
}

console.log(solve(nums, target));
$tsc$,
    'python', $pyc$import sys
data = sys.stdin.read().strip().split('\n')
n = int(data[0])
nums = list(map(int, data[1].split()))
target = int(data[2])

def solve(nums: list, target: int) -> int:
    # TODO: implement binary search
    pass

print(solve(nums, target))
$pyc$,
    'java', $jvc$import java.util.Scanner;

public class Solution {
    public static int solve(int[] nums, int target) {
        // TODO: implement binary search
        return -1;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = Integer.parseInt(sc.nextLine().trim());
        String[] parts = sc.nextLine().trim().split(" ");
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = Integer.parseInt(parts[i]);
        int target = Integer.parseInt(sc.nextLine().trim());
        System.out.println(solve(nums, target));
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func solve(nums []int, target int) int {
	// TODO: implement binary search
	return -1
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	sc.Scan() // n
	sc.Scan()
	parts := strings.Fields(sc.Text())
	nums := make([]int, len(parts))
	for i, p := range parts {
		nums[i], _ = strconv.Atoi(p)
	}
	sc.Scan()
	target, _ := strconv.Atoi(strings.TrimSpace(sc.Text()))
	fmt.Println(solve(nums, target))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <vector>
using namespace std;

int solve(vector<int>& nums, int target) {
    // TODO: implement binary search
    return -1;
}

int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target; cin >> target;
    cout << solve(nums, target) << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', '5
-1 0 3 5 9
3', 'expected_output', '2', 'is_hidden', false),
    jsonb_build_object('input', '4
-1 0 3 5
2', 'expected_output', '-1', 'is_hidden', false),
    jsonb_build_object('input', '1
5
5', 'expected_output', '0', 'is_hidden', false),
    jsonb_build_object('input', '6
1 3 5 7 9 11
9', 'expected_output', '4', 'is_hidden', false),
    jsonb_build_object('input', '3
2 5 8
1', 'expected_output', '-1', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Maintain left and right pointers. Compare the middle element with target.',
    'If middle == target, return mid. If middle < target, search right half. Otherwise search left half.'
  ),
  '1 <= n <= 10^4; All elements are distinct; -10^9 <= nums[i] <= 10^9',
  jsonb_build_array(
    jsonb_build_object('input', '5\n-1 0 3 5 9\n3', 'output', '2', 'explanation', 'nums[2] = 3 = target')
  ),
  true, 'published', 120, 50, 25
);

-- ----------------------------------------------------------------
-- Challenge 11: Merge Sorted Arrays (medium, sorting)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Merge Sorted Arrays',
  'merge-sorted-arrays',
  $d$## Merge Sorted Arrays

Given two sorted integer arrays `arr1` and `arr2`, return a new sorted array containing all elements from both.

### Input Format
- Line 1: `m` (size of arr1)
- Line 2: `m` space-separated integers (may be empty if m=0)
- Line 3: `n` (size of arr2)
- Line 4: `n` space-separated integers (may be empty if n=0)

### Output Format
Space-separated merged sorted array.$d$,
  'medium', 'sorting', ARRAY['merge','sorting','two-pointers'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const lines = fs.readFileSync('/dev/stdin', 'utf8').split('\n');
const m = parseInt(lines[0]);
const arr1 = m > 0 ? lines[1].trim().split(' ').map(Number) : [];
const n = parseInt(lines[2]);
const arr2 = n > 0 ? lines[3].trim().split(' ').map(Number) : [];

/**
 * @param {number[]} arr1
 * @param {number[]} arr2
 * @returns {number[]}
 */
function solve(arr1, arr2) {
  // TODO: return merged sorted array
}

console.log(solve(arr1, arr2).join(' '));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const lines: string[] = fs.readFileSync('/dev/stdin', 'utf8').split('\n');
const m: number = parseInt(lines[0]);
const arr1: number[] = m > 0 ? lines[1].trim().split(' ').map(Number) : [];
const n: number = parseInt(lines[2]);
const arr2: number[] = n > 0 ? lines[3].trim().split(' ').map(Number) : [];

function solve(arr1: number[], arr2: number[]): number[] {
  // TODO: return merged sorted array
  return [];
}

console.log(solve(arr1, arr2).join(' '));
$tsc$,
    'python', $pyc$import sys
lines = sys.stdin.read().split('\n')
m = int(lines[0])
arr1 = list(map(int, lines[1].split())) if m > 0 and lines[1].strip() else []
n = int(lines[2])
arr2 = list(map(int, lines[3].split())) if n > 0 and lines[3].strip() else []

def solve(arr1: list, arr2: list) -> list:
    # TODO: return merged sorted array
    pass

print(' '.join(map(str, solve(arr1, arr2))))
$pyc$,
    'java', $jvc$import java.util.Scanner;

public class Solution {
    public static int[] solve(int[] arr1, int[] arr2) {
        // TODO: return merged sorted array
        return new int[]{};
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int m = Integer.parseInt(sc.nextLine().trim());
        String line1 = m > 0 ? sc.nextLine() : (sc.hasNextLine() ? sc.nextLine() : "");
        int[] arr1 = new int[m];
        if (m > 0) {
            String[] p = line1.trim().split(" ");
            for (int i = 0; i < m; i++) arr1[i] = Integer.parseInt(p[i]);
        }
        int n = Integer.parseInt(sc.nextLine().trim());
        String line2 = n > 0 ? sc.nextLine() : (sc.hasNextLine() ? sc.nextLine() : "");
        int[] arr2 = new int[n];
        if (n > 0) {
            String[] p = line2.trim().split(" ");
            for (int i = 0; i < n; i++) arr2[i] = Integer.parseInt(p[i]);
        }
        int[] r = solve(arr1, arr2);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < r.length; i++) { if (i > 0) sb.append(' '); sb.append(r[i]); }
        System.out.println(sb);
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func solve(arr1, arr2 []int) []int {
	// TODO: return merged sorted array
	return nil
}

func parseInts(s string) []int {
	s = strings.TrimSpace(s)
	if s == "" { return nil }
	parts := strings.Fields(s)
	nums := make([]int, len(parts))
	for i, p := range parts { nums[i], _ = strconv.Atoi(p) }
	return nums
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	sc.Scan(); m, _ := strconv.Atoi(strings.TrimSpace(sc.Text()))
	sc.Scan(); arr1 := parseInts(sc.Text())
	sc.Scan(); n, _ := strconv.Atoi(strings.TrimSpace(sc.Text()))
	sc.Scan(); arr2 := parseInts(sc.Text())
	_, _ = m, n
	r := solve(arr1, arr2)
	parts := make([]string, len(r))
	for i, v := range r { parts[i] = strconv.Itoa(v) }
	fmt.Println(strings.Join(parts, " "))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

vector<int> solve(vector<int>& arr1, vector<int>& arr2) {
    // TODO: return merged sorted array
    return {};
}

vector<int> readLine(int count) {
    string line; getline(cin, line);
    vector<int> result;
    if (count == 0) return result;
    istringstream ss(line);
    int x;
    while (ss >> x) result.push_back(x);
    return result;
}

int main() {
    int m; cin >> m; cin.ignore();
    auto arr1 = readLine(m);
    int n; cin >> n; cin.ignore();
    auto arr2 = readLine(n);
    auto r = solve(arr1, arr2);
    for (int i = 0; i < (int)r.size(); i++) { if (i) cout << ' '; cout << r[i]; }
    cout << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', '3
1 2 4
3
1 3 4', 'expected_output', '1 1 2 3 4 4', 'is_hidden', false),
    jsonb_build_object('input', '1
5
1
2', 'expected_output', '2 5', 'is_hidden', false),
    jsonb_build_object('input', '0

2
1 2', 'expected_output', '1 2', 'is_hidden', false),
    jsonb_build_object('input', '3
1 5 9
3
2 6 8', 'expected_output', '1 2 5 6 8 9', 'is_hidden', false),
    jsonb_build_object('input', '4
1 3 5 7
4
2 4 6 8', 'expected_output', '1 2 3 4 5 6 7 8', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Use two pointers, one for each array, advancing the one with the smaller current element.',
    'After one array is exhausted, append the remaining elements of the other.'
  ),
  '0 <= m, n <= 10^4; -10^9 <= arr[i] <= 10^9; Both arrays are sorted in non-decreasing order.',
  jsonb_build_array(
    jsonb_build_object('input', '3\n1 2 4\n3\n1 3 4', 'output', '1 1 2 3 4 4', 'explanation', 'Merge with two pointers in O(m+n) time')
  ),
  true, 'published', 120, 50, 25
);

-- ----------------------------------------------------------------
-- Challenge 12: Flatten Array (medium, recursion)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Flatten Array',
  'flatten-array',
  $d$## Flatten Array

Given a (possibly nested) JSON array of integers, return all integers in a single flat list, space-separated.

### Input Format
A single line containing a valid JSON array (may be nested to any depth).

### Output Format
Space-separated integers in order of appearance. Print an empty line for an empty array.$d$,
  'medium', 'recursion', ARRAY['recursion','array','json','depth-first'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const input = fs.readFileSync('/dev/stdin', 'utf8').trim();
const nested = JSON.parse(input);

/**
 * @param {Array} arr - possibly nested array of numbers
 * @returns {number[]} - flat array
 */
function solve(arr) {
  // TODO: recursively flatten the array
}

const result = solve(nested);
console.log(result.join(' '));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const input: string = fs.readFileSync('/dev/stdin', 'utf8').trim();
const nested: any = JSON.parse(input);

function solve(arr: any[]): number[] {
  // TODO: recursively flatten the array
  return [];
}

const result = solve(nested);
console.log(result.join(' '));
$tsc$,
    'python', $pyc$import sys
import json

data = sys.stdin.read().strip()
nested = json.loads(data)

def solve(arr) -> list:
    # TODO: recursively flatten the array
    pass

result = solve(nested)
print(' '.join(map(str, result)))
$pyc$,
    'java', $jvc$import java.util.*;

public class Solution {
    public static List<Integer> solve(List<Object> arr) {
        // TODO: recursively flatten the array
        // Elements are either Integer or List<Object>
        return new ArrayList<>();
    }

    @SuppressWarnings("unchecked")
    private static List<Object> parseJson(String s, int[] pos) {
        List<Object> result = new ArrayList<>();
        pos[0]++; // skip '['
        while (pos[0] < s.length() && s.charAt(pos[0]) != ']') {
            char c = s.charAt(pos[0]);
            if (c == '[') {
                result.add(parseJson(s, pos));
            } else if (c == '-' || Character.isDigit(c)) {
                int start = pos[0];
                if (c == '-') pos[0]++;
                while (pos[0] < s.length() && Character.isDigit(s.charAt(pos[0]))) pos[0]++;
                result.add(Integer.parseInt(s.substring(start, pos[0])));
                continue;
            }
            if (pos[0] < s.length() && s.charAt(pos[0]) == ',') pos[0]++;
            else pos[0]++;
        }
        if (pos[0] < s.length()) pos[0]++;
        return result;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String json = sc.hasNextLine() ? sc.nextLine().trim() : "[]";
        int[] pos = {0};
        List<Object> nested = parseJson(json, pos);
        List<Integer> flat = solve(nested);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < flat.size(); i++) { if (i > 0) sb.append(' '); sb.append(flat.get(i)); }
        System.out.println(sb);
    }
}
$jvc$,
    'go', $goc$package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func solve(arr []interface{}) []int {
	// TODO: recursively flatten the array
	return nil
}

func main() {
	data, _ := os.ReadFile("/dev/stdin")
	input := strings.TrimSpace(string(data))
	var nested []interface{}
	json.Unmarshal([]byte(input), &nested)
	result := solve(nested)
	parts := make([]string, len(result))
	for i, v := range result { parts[i] = strconv.Itoa(v) }
	fmt.Println(strings.Join(parts, " "))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <vector>
#include <string>
using namespace std;

// Simple recursive JSON array parser + flatten
void flatten(const string& s, int& i, vector<int>& result) {
    i++; // skip '['
    while (i < (int)s.size() && s[i] != ']') {
        if (s[i] == '[') {
            flatten(s, i, result);
        } else if (s[i] == '-' || isdigit(s[i])) {
            int sign = 1;
            if (s[i] == '-') { sign = -1; i++; }
            int num = 0;
            while (i < (int)s.size() && isdigit(s[i])) { num = num * 10 + (s[i] - '0'); i++; }
            result.push_back(sign * num);
            continue;
        }
        i++;
    }
    if (i < (int)s.size()) i++; // skip ']'
}

vector<int> solve(const string& json) {
    // TODO: parse and flatten; the flatten() helper above is provided for reference
    vector<int> result;
    int i = 0;
    flatten(json, i, result);
    return result;
}

int main() {
    string json;
    getline(cin, json);
    auto result = solve(json);
    for (int i = 0; i < (int)result.size(); i++) { if (i) cout << ' '; cout << result[i]; }
    cout << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', '[1,2,3]', 'expected_output', '1 2 3', 'is_hidden', false),
    jsonb_build_object('input', '[[1,2],3]', 'expected_output', '1 2 3', 'is_hidden', false),
    jsonb_build_object('input', '[1,[2,[3,[4,5]]]]', 'expected_output', '1 2 3 4 5', 'is_hidden', false),
    jsonb_build_object('input', '[]', 'expected_output', '', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Use recursion: if an element is an array, recurse into it; if a number, collect it.',
    'A depth-first traversal visits elements in the correct order.'
  ),
  'Elements are integers in range [-10^6, 10^6]; nesting depth <= 20; total elements <= 10^4.',
  jsonb_build_array(
    jsonb_build_object('input', '[1,[2,[3,[4,5]]]]', 'output', '1 2 3 4 5', 'explanation', 'All integers collected depth-first left-to-right')
  ),
  true, 'published', 100, 40, 20
);

-- ----------------------------------------------------------------
-- Challenge 13: Roman to Integer (medium, math)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Roman to Integer',
  'roman-to-integer',
  $d$## Roman to Integer

Convert a Roman numeral string to an integer.

Roman numeral values: `I=1, V=5, X=10, L=50, C=100, D=500, M=1000`.

Subtraction rule: if a smaller value appears before a larger value, subtract it (e.g. `IV=4`, `IX=9`, `XL=40`, `XC=90`, `CD=400`, `CM=900`).

### Input Format
A single line containing a valid Roman numeral string.

### Output Format
The corresponding integer.$d$,
  'medium', 'math', ARRAY['string','math','roman-numerals'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const s = fs.readFileSync('/dev/stdin', 'utf8').trim();

/**
 * @param {string} s - Roman numeral string
 * @returns {number}
 */
function solve(s) {
  // TODO: convert Roman numeral to integer
}

console.log(solve(s));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const s: string = fs.readFileSync('/dev/stdin', 'utf8').trim();

function solve(s: string): number {
  // TODO: convert Roman numeral to integer
  return 0;
}

console.log(solve(s));
$tsc$,
    'python', $pyc$import sys
s = sys.stdin.read().strip()

def solve(s: str) -> int:
    # TODO: convert Roman numeral to integer
    pass

print(solve(s))
$pyc$,
    'java', $jvc$import java.util.Scanner;

public class Solution {
    public static int solve(String s) {
        // TODO: convert Roman numeral to integer
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println(solve(sc.nextLine().trim()));
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func solve(s string) int {
	// TODO: convert Roman numeral to integer
	return 0
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Scan()
	fmt.Println(solve(strings.TrimSpace(sc.Text())))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <string>
using namespace std;

int solve(const string& s) {
    // TODO: convert Roman numeral to integer
    return 0;
}

int main() {
    string s; cin >> s;
    cout << solve(s) << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', 'III', 'expected_output', '3', 'is_hidden', false),
    jsonb_build_object('input', 'LVIII', 'expected_output', '58', 'is_hidden', false),
    jsonb_build_object('input', 'MCMXCIV', 'expected_output', '1994', 'is_hidden', false),
    jsonb_build_object('input', 'IX', 'expected_output', '9', 'is_hidden', false),
    jsonb_build_object('input', 'XL', 'expected_output', '40', 'is_hidden', false),
    jsonb_build_object('input', 'MMXXIV', 'expected_output', '2024', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Build a value map for each Roman symbol.',
    'Iterate right-to-left: if current value < previous value, subtract; otherwise add.'
  ),
  '1 <= s.length <= 15; s contains only valid Roman numeral characters; 1 <= result <= 3999.',
  jsonb_build_array(
    jsonb_build_object('input', 'MCMXCIV', 'output', '1994', 'explanation', 'M=1000, CM=900, XC=90, IV=4')
  ),
  true, 'published', 100, 40, 20
);

-- ----------------------------------------------------------------
-- Challenge 14: Longest Substring Without Repeating Characters (hard, strings)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Longest Substring Without Repeating Characters',
  'longest-substring-no-repeat',
  $d$## Longest Substring Without Repeating Characters

Given a string `s`, find the length of the **longest substring** without repeating characters.

### Input Format
A single line string (may be empty).

### Output Format
A single integer — the length of the longest such substring.$d$,
  'hard', 'strings', ARRAY['sliding-window','hash-map','two-pointers'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const s = fs.readFileSync('/dev/stdin', 'utf8').split('\n')[0];

/**
 * @param {string} s
 * @returns {number}
 */
function solve(s) {
  // TODO: return length of longest substring without repeating characters
}

console.log(solve(s));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const s: string = fs.readFileSync('/dev/stdin', 'utf8').split('\n')[0];

function solve(s: string): number {
  // TODO: return length of longest substring without repeating characters
  return 0;
}

console.log(solve(s));
$tsc$,
    'python', $pyc$import sys
s = sys.stdin.readline().rstrip('\n')

def solve(s: str) -> int:
    # TODO: return length of longest substring without repeating characters
    pass

print(solve(s))
$pyc$,
    'java', $jvc$import java.util.Scanner;

public class Solution {
    public static int solve(String s) {
        // TODO: return length of longest substring without repeating characters
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.hasNextLine() ? sc.nextLine() : "";
        System.out.println(solve(s));
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func solve(s string) int {
	// TODO: return length of longest substring without repeating characters
	return 0
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Scan()
	fmt.Println(solve(strings.TrimRight(sc.Text(), "\r")))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <string>
using namespace std;

int solve(const string& s) {
    // TODO: return length of longest substring without repeating characters
    return 0;
}

int main() {
    string s;
    getline(cin, s);
    cout << solve(s) << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', 'abcabcbb', 'expected_output', '3', 'is_hidden', false),
    jsonb_build_object('input', 'bbbbb', 'expected_output', '1', 'is_hidden', false),
    jsonb_build_object('input', 'pwwkew', 'expected_output', '3', 'is_hidden', false),
    jsonb_build_object('input', '', 'expected_output', '0', 'is_hidden', false),
    jsonb_build_object('input', 'abcdef', 'expected_output', '6', 'is_hidden', true),
    jsonb_build_object('input', 'dvdf', 'expected_output', '3', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Use a sliding window with two pointers (left and right).',
    'Maintain a hash map of character → last seen index. Advance left past duplicates.',
    'Window size at each step is right - left + 1; track the maximum.'
  ),
  '0 <= s.length <= 5 * 10^4; s consists of English letters, digits, symbols, and spaces.',
  jsonb_build_array(
    jsonb_build_object('input', 'abcabcbb', 'output', '3', 'explanation', 'The longest substring is "abc" with length 3')
  ),
  true, 'published', 200, 80, 50
);

-- ----------------------------------------------------------------
-- Challenge 15: Matrix Spiral Order (hard, arrays)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Matrix Spiral Order',
  'matrix-spiral-order',
  $d$## Matrix Spiral Order

Given an `m x n` matrix, return all elements in **spiral order** (clockwise, starting from top-left).

### Input Format
- Line 1: `m n` (rows and columns, space-separated)
- Lines 2 to m+1: space-separated integers for each row

### Output Format
Space-separated integers in spiral order.$d$,
  'hard', 'arrays', ARRAY['matrix','simulation','spiral'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const lines = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\n');
const [m, n] = lines[0].split(' ').map(Number);
const matrix = [];
for (let i = 1; i <= m; i++) matrix.push(lines[i].split(' ').map(Number));

/**
 * @param {number[][]} matrix
 * @returns {number[]}
 */
function solve(matrix) {
  // TODO: return elements in clockwise spiral order
}

console.log(solve(matrix).join(' '));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const lines: string[] = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\n');
const [m, n] = lines[0].split(' ').map(Number);
const matrix: number[][] = [];
for (let i = 1; i <= m; i++) matrix.push(lines[i].split(' ').map(Number));

function solve(matrix: number[][]): number[] {
  // TODO: return elements in clockwise spiral order
  return [];
}

console.log(solve(matrix).join(' '));
$tsc$,
    'python', $pyc$import sys
data = sys.stdin.read().strip().split('\n')
m, n = map(int, data[0].split())
matrix = [list(map(int, data[i+1].split())) for i in range(m)]

def solve(matrix: list) -> list:
    # TODO: return elements in clockwise spiral order
    pass

print(' '.join(map(str, solve(matrix))))
$pyc$,
    'java', $jvc$import java.util.*;

public class Solution {
    public static List<Integer> solve(int[][] matrix) {
        // TODO: return elements in clockwise spiral order
        return new ArrayList<>();
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int m = sc.nextInt(), n = sc.nextInt();
        int[][] matrix = new int[m][n];
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) matrix[i][j] = sc.nextInt();
        List<Integer> result = solve(matrix);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < result.size(); i++) { if (i > 0) sb.append(' '); sb.append(result.get(i)); }
        System.out.println(sb);
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func solve(matrix [][]int) []int {
	// TODO: return elements in clockwise spiral order
	return nil
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	sc.Scan()
	dims := strings.Fields(sc.Text())
	m, _ := strconv.Atoi(dims[0])
	n, _ := strconv.Atoi(dims[1])
	matrix := make([][]int, m)
	for i := 0; i < m; i++ {
		sc.Scan()
		parts := strings.Fields(sc.Text())
		row := make([]int, n)
		for j := 0; j < n; j++ { row[j], _ = strconv.Atoi(parts[j]) }
		matrix[i] = row
	}
	result := solve(matrix)
	strs := make([]string, len(result))
	for i, v := range result { strs[i] = strconv.Itoa(v) }
	fmt.Println(strings.Join(strs, " "))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <vector>
#include <string>
using namespace std;

vector<int> solve(vector<vector<int>>& matrix) {
    // TODO: return elements in clockwise spiral order
    return {};
}

int main() {
    int m, n; cin >> m >> n;
    vector<vector<int>> matrix(m, vector<int>(n));
    for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) cin >> matrix[i][j];
    auto r = solve(matrix);
    for (int i = 0; i < (int)r.size(); i++) { if (i) cout << ' '; cout << r[i]; }
    cout << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', '3 3
1 2 3
4 5 6
7 8 9', 'expected_output', '1 2 3 6 9 8 7 4 5', 'is_hidden', false),
    jsonb_build_object('input', '1 4
1 2 3 4', 'expected_output', '1 2 3 4', 'is_hidden', false),
    jsonb_build_object('input', '2 2
1 2
3 4', 'expected_output', '1 2 4 3', 'is_hidden', false),
    jsonb_build_object('input', '3 4
1 2 3 4
5 6 7 8
9 10 11 12', 'expected_output', '1 2 3 4 8 12 11 10 9 5 6 7', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Maintain four boundaries: top, bottom, left, right. Shrink them as you traverse.',
    'Traverse: left→right (top row), top→bottom (right col), right→left (bottom row), bottom→top (left col). Increment/decrement boundaries after each traversal.'
  ),
  '1 <= m, n <= 10; -1000 <= matrix[i][j] <= 1000',
  jsonb_build_array(
    jsonb_build_object('input', '3 3\n1 2 3\n4 5 6\n7 8 9', 'output', '1 2 3 6 9 8 7 4 5', 'explanation', 'Go right across top, down right side, left across bottom, up left side, then center')
  ),
  true, 'published', 200, 80, 50
);

-- ----------------------------------------------------------------
-- Challenge 16: LRU Cache (hard, data_structures)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'LRU Cache',
  'lru-cache',
  $d$## LRU Cache

Design and implement a **Least Recently Used (LRU) cache** with `get` and `put` operations, both in `O(1)`.

- `get(key)` — return the value if the key exists, otherwise `-1`. Marks the key as recently used.
- `put(key, value)` — insert or update the key. If capacity is exceeded, evict the least recently used key.

### Input Format
- Line 1: `capacity`
- Each subsequent line is an operation: `put key value` or `get key`

### Output Format
One line per `get` operation: the value or `-1`. `put` operations produce no output.$d$,
  'hard', 'data_structures', ARRAY['lru','linked-list','hash-map','design'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const lines = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\n');
const capacity = parseInt(lines[0]);

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    // TODO: initialize your data structures
  }

  get(key) {
    // TODO: return value or -1; mark as recently used
    return -1;
  }

  put(key, value) {
    // TODO: insert/update; evict LRU if over capacity
  }
}

const cache = new LRUCache(capacity);
const results = [];
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].trim().split(' ');
  if (parts[0] === 'get') {
    results.push(cache.get(parseInt(parts[1])));
  } else if (parts[0] === 'put') {
    cache.put(parseInt(parts[1]), parseInt(parts[2]));
  }
}
console.log(results.join('\n'));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const lines: string[] = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\n');
const capacity: number = parseInt(lines[0]);

class LRUCache {
  private cap: number;
  constructor(capacity: number) {
    this.cap = capacity;
    // TODO: initialize your data structures
  }

  get(key: number): number {
    // TODO: return value or -1; mark as recently used
    return -1;
  }

  put(key: number, value: number): void {
    // TODO: insert/update; evict LRU if over capacity
  }
}

const cache = new LRUCache(capacity);
const results: number[] = [];
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].trim().split(' ');
  if (parts[0] === 'get') results.push(cache.get(parseInt(parts[1])));
  else if (parts[0] === 'put') cache.put(parseInt(parts[1]), parseInt(parts[2]));
}
console.log(results.join('\n'));
$tsc$,
    'python', $pyc$import sys
lines = sys.stdin.read().strip().split('\n')
capacity = int(lines[0])

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        # TODO: initialize your data structures

    def get(self, key: int) -> int:
        # TODO: return value or -1; mark as recently used
        return -1

    def put(self, key: int, value: int) -> None:
        # TODO: insert/update; evict LRU if over capacity
        pass

cache = LRUCache(capacity)
results = []
for line in lines[1:]:
    parts = line.strip().split()
    if not parts:
        continue
    if parts[0] == 'get':
        results.append(cache.get(int(parts[1])))
    elif parts[0] == 'put':
        cache.put(int(parts[1]), int(parts[2]))
print('\n'.join(map(str, results)))
$pyc$,
    'java', $jvc$import java.util.*;

public class Solution {
    static class LRUCache {
        private int capacity;
        // TODO: add fields for your data structures

        public LRUCache(int capacity) {
            this.capacity = capacity;
            // TODO: initialize data structures
        }

        public int get(int key) {
            // TODO: return value or -1; mark as recently used
            return -1;
        }

        public void put(int key, int value) {
            // TODO: insert/update; evict LRU if over capacity
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int capacity = Integer.parseInt(sc.nextLine().trim());
        LRUCache cache = new LRUCache(capacity);
        List<Integer> results = new ArrayList<>();
        while (sc.hasNextLine()) {
            String line = sc.nextLine().trim();
            if (line.isEmpty()) continue;
            String[] parts = line.split(" ");
            if (parts[0].equals("get")) {
                results.add(cache.get(Integer.parseInt(parts[1])));
            } else if (parts[0].equals("put")) {
                cache.put(Integer.parseInt(parts[1]), Integer.parseInt(parts[2]));
            }
        }
        for (int r : results) System.out.println(r);
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"container/list"
	"fmt"
	"os"
	"strconv"
	"strings"
)

type entry struct{ key, val int }

type LRUCache struct {
	cap   int
	lst   *list.List
	cache map[int]*list.Element
}

func newLRUCache(cap int) *LRUCache {
	return &LRUCache{cap: cap, lst: list.New(), cache: make(map[int]*list.Element)}
}

func (c *LRUCache) get(key int) int {
	// TODO: return value or -1; move to front
	return -1
}

func (c *LRUCache) put(key, val int) {
	// TODO: insert/update; evict back if over capacity
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	sc.Scan()
	cap, _ := strconv.Atoi(strings.TrimSpace(sc.Text()))
	cache := newLRUCache(cap)
	var results []string
	for sc.Scan() {
		parts := strings.Fields(sc.Text())
		if len(parts) == 0 { continue }
		switch parts[0] {
		case "get":
			key, _ := strconv.Atoi(parts[1])
			results = append(results, strconv.Itoa(cache.get(key)))
		case "put":
			key, _ := strconv.Atoi(parts[1])
			val, _ := strconv.Atoi(parts[2])
			cache.put(key, val)
		}
	}
	fmt.Println(strings.Join(results, "\n"))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <list>
#include <unordered_map>
#include <string>
#include <sstream>
using namespace std;

class LRUCache {
    int capacity;
    list<pair<int,int>> lst;
    unordered_map<int, list<pair<int,int>>::iterator> cache;
public:
    LRUCache(int cap) : capacity(cap) {}

    int get(int key) {
        // TODO: return value or -1; move to front
        return -1;
    }

    void put(int key, int val) {
        // TODO: insert/update; evict LRU if over capacity
    }
};

int main() {
    int cap; cin >> cap; cin.ignore();
    LRUCache cache(cap);
    string line;
    bool first = true;
    string output;
    while (getline(cin, line)) {
        if (line.empty()) continue;
        istringstream iss(line);
        string op; iss >> op;
        if (op == "get") {
            int key; iss >> key;
            if (!first) output += '\n';
            output += to_string(cache.get(key));
            first = false;
        } else if (op == "put") {
            int key, val; iss >> key >> val;
            cache.put(key, val);
        }
    }
    cout << output << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', '2
put 1 1
put 2 2
get 1
put 3 3
get 2
put 4 4
get 1
get 3
get 4', 'expected_output', '1
-1
-1
3
4', 'is_hidden', false),
    jsonb_build_object('input', '1
put 2 1
get 2
put 3 2
get 2
get 3', 'expected_output', '1
-1
2', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Use a doubly linked list for O(1) front insertion and back eviction.',
    'Combine with a hash map (key → list node pointer) for O(1) access and move-to-front.'
  ),
  '1 <= capacity <= 3000; 0 <= key, value <= 10^4; At most 10^4 get and put operations.',
  jsonb_build_array(
    jsonb_build_object('input', 'capacity=2, [put 1 1, put 2 2, get 1, put 3 3, get 2]', 'output', '1\n-1', 'explanation', 'get 1 → 1 (hit); put 3 evicts key 2 (LRU); get 2 → -1 (miss)')
  ),
  true, 'published', 250, 100, 60
);

-- ----------------------------------------------------------------
-- Challenge 17: Balanced Binary Tree (hard, trees)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Balanced Binary Tree',
  'balanced-binary-tree',
  $d$## Balanced Binary Tree

Given a binary tree as a **level-order traversal** (BFS order), determine if it is **height-balanced**.

A binary tree is height-balanced if for every node, the heights of its left and right subtrees differ by at most 1.

Use `-1` to represent null nodes in the input.

### Input Format
A single line of space-separated integers representing the level-order traversal. Use `-1` for null.

### Output Format
`true` or `false`$d$,
  'hard', 'trees', ARRAY['tree','recursion','depth-first','height'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const vals = fs.readFileSync('/dev/stdin', 'utf8').trim().split(' ').map(Number);

class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

function buildTree(vals) {
  if (!vals.length || vals[0] === -1) return null;
  const root = new TreeNode(vals[0]);
  const queue = [root];
  let i = 1;
  while (queue.length && i < vals.length) {
    const node = queue.shift();
    if (i < vals.length && vals[i] !== -1) { node.left = new TreeNode(vals[i]); queue.push(node.left); } i++;
    if (i < vals.length && vals[i] !== -1) { node.right = new TreeNode(vals[i]); queue.push(node.right); } i++;
  }
  return root;
}

/**
 * @param {TreeNode|null} root
 * @returns {boolean}
 */
function solve(root) {
  // TODO: return true if the tree is height-balanced
}

console.log(String(solve(buildTree(vals))));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const vals: number[] = fs.readFileSync('/dev/stdin', 'utf8').trim().split(' ').map(Number);

class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val: number) { this.val = val; this.left = null; this.right = null; }
}

function buildTree(vals: number[]): TreeNode | null {
  if (!vals.length || vals[0] === -1) return null;
  const root = new TreeNode(vals[0]);
  const queue: TreeNode[] = [root];
  let i = 1;
  while (queue.length && i < vals.length) {
    const node = queue.shift()!;
    if (i < vals.length && vals[i] !== -1) { node.left = new TreeNode(vals[i]); queue.push(node.left); } i++;
    if (i < vals.length && vals[i] !== -1) { node.right = new TreeNode(vals[i]); queue.push(node.right); } i++;
  }
  return root;
}

function solve(root: TreeNode | null): boolean {
  // TODO: return true if the tree is height-balanced
  return false;
}

console.log(String(solve(buildTree(vals))));
$tsc$,
    'python', $pyc$import sys
from collections import deque

data = sys.stdin.read().strip().split()
vals = [int(x) for x in data]

class TreeNode:
    def __init__(self, val=0):
        self.val = val
        self.left = None
        self.right = None

def build_tree(vals):
    if not vals or vals[0] == -1:
        return None
    root = TreeNode(vals[0])
    queue = deque([root])
    i = 1
    while queue and i < len(vals):
        node = queue.popleft()
        if i < len(vals) and vals[i] != -1:
            node.left = TreeNode(vals[i])
            queue.append(node.left)
        i += 1
        if i < len(vals) and vals[i] != -1:
            node.right = TreeNode(vals[i])
            queue.append(node.right)
        i += 1
    return root

def solve(root) -> bool:
    # TODO: return True if the tree is height-balanced
    pass

root = build_tree(vals)
print(str(solve(root)).lower())
$pyc$,
    'java', $jvc$import java.util.*;

class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

public class Solution {
    public static boolean solve(TreeNode root) {
        // TODO: return true if the tree is height-balanced
        return false;
    }

    private static TreeNode buildTree(int[] vals) {
        if (vals.length == 0 || vals[0] == -1) return null;
        TreeNode root = new TreeNode(vals[0]);
        Queue<TreeNode> q = new LinkedList<>();
        q.offer(root);
        int i = 1;
        while (!q.isEmpty() && i < vals.length) {
            TreeNode node = q.poll();
            if (i < vals.length && vals[i] != -1) { node.left = new TreeNode(vals[i]); q.offer(node.left); } i++;
            if (i < vals.length && vals[i] != -1) { node.right = new TreeNode(vals[i]); q.offer(node.right); } i++;
        }
        return root;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String[] parts = sc.nextLine().trim().split(" ");
        int[] vals = new int[parts.length];
        for (int i = 0; i < parts.length; i++) vals[i] = Integer.parseInt(parts[i]);
        System.out.println(solve(buildTree(vals)));
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

type TreeNode struct {
	Val   int
	Left  *TreeNode
	Right *TreeNode
}

func buildTree(vals []int) *TreeNode {
	if len(vals) == 0 || vals[0] == -1 { return nil }
	root := &TreeNode{Val: vals[0]}
	queue := []*TreeNode{root}
	i := 1
	for len(queue) > 0 && i < len(vals) {
		node := queue[0]; queue = queue[1:]
		if i < len(vals) && vals[i] != -1 { node.Left = &TreeNode{Val: vals[i]}; queue = append(queue, node.Left) }; i++
		if i < len(vals) && vals[i] != -1 { node.Right = &TreeNode{Val: vals[i]}; queue = append(queue, node.Right) }; i++
	}
	return root
}

func solve(root *TreeNode) bool {
	// TODO: return true if the tree is height-balanced
	return false
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	sc.Scan()
	parts := strings.Fields(sc.Text())
	vals := make([]int, len(parts))
	for i, p := range parts { vals[i], _ = strconv.Atoi(p) }
	fmt.Println(solve(buildTree(vals)))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <vector>
#include <queue>
#include <sstream>
#include <string>
using namespace std;

struct TreeNode {
    int val; TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* buildTree(vector<int>& vals) {
    if (vals.empty() || vals[0] == -1) return nullptr;
    TreeNode* root = new TreeNode(vals[0]);
    queue<TreeNode*> q; q.push(root);
    int i = 1;
    while (!q.empty() && i < (int)vals.size()) {
        TreeNode* node = q.front(); q.pop();
        if (i < (int)vals.size() && vals[i] != -1) { node->left = new TreeNode(vals[i]); q.push(node->left); } i++;
        if (i < (int)vals.size() && vals[i] != -1) { node->right = new TreeNode(vals[i]); q.push(node->right); } i++;
    }
    return root;
}

bool solve(TreeNode* root) {
    // TODO: return true if the tree is height-balanced
    return false;
}

int main() {
    string line; getline(cin, line);
    istringstream iss(line);
    vector<int> vals; int x;
    while (iss >> x) vals.push_back(x);
    cout << (solve(buildTree(vals)) ? "true" : "false") << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', '3 9 20 -1 -1 15 7', 'expected_output', 'true', 'is_hidden', false),
    jsonb_build_object('input', '1 2 2 3 3 -1 -1 4 4', 'expected_output', 'false', 'is_hidden', false),
    jsonb_build_object('input', '1', 'expected_output', 'true', 'is_hidden', false),
    jsonb_build_object('input', '-1', 'expected_output', 'true', 'is_hidden', true),
    jsonb_build_object('input', '1 2 -1 3 -1 4 -1', 'expected_output', 'false', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Write a recursive height function that returns -1 if the subtree is unbalanced.',
    'If at any node |height(left) - height(right)| > 1, return -1 (unbalanced) up the call stack.'
  ),
  '0 <= number of nodes <= 5000; -10^4 <= node.val <= 10^4',
  jsonb_build_array(
    jsonb_build_object('input', '3 9 20 -1 -1 15 7', 'output', 'true', 'explanation', 'All subtrees differ in height by at most 1')
  ),
  true, 'published', 200, 80, 50
);

-- ----------------------------------------------------------------
-- Challenge 18: Minimum Path Sum (hard, dynamic_programming)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Minimum Path Sum',
  'minimum-path-sum',
  $d$## Minimum Path Sum

Given an `m x n` grid of non-negative integers, find the path from the **top-left** to the **bottom-right** corner with the **minimum sum**. You can only move **right** or **down**.

### Input Format
- Line 1: `m n` (rows and columns, space-separated)
- Lines 2 to m+1: space-separated integers for each row

### Output Format
A single integer — the minimum path sum.$d$,
  'hard', 'dynamic_programming', ARRAY['dp','grid','path'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const lines = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\n');
const [m, n] = lines[0].split(' ').map(Number);
const grid = [];
for (let i = 1; i <= m; i++) grid.push(lines[i].split(' ').map(Number));

/**
 * @param {number[][]} grid
 * @returns {number}
 */
function solve(grid) {
  // TODO: return minimum path sum from top-left to bottom-right
}

console.log(solve(grid));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const lines: string[] = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\n');
const [m, n] = lines[0].split(' ').map(Number);
const grid: number[][] = [];
for (let i = 1; i <= m; i++) grid.push(lines[i].split(' ').map(Number));

function solve(grid: number[][]): number {
  // TODO: return minimum path sum from top-left to bottom-right
  return 0;
}

console.log(solve(grid));
$tsc$,
    'python', $pyc$import sys
data = sys.stdin.read().strip().split('\n')
m, n = map(int, data[0].split())
grid = [list(map(int, data[i+1].split())) for i in range(m)]

def solve(grid: list) -> int:
    # TODO: return minimum path sum from top-left to bottom-right
    pass

print(solve(grid))
$pyc$,
    'java', $jvc$import java.util.Scanner;

public class Solution {
    public static int solve(int[][] grid) {
        // TODO: return minimum path sum from top-left to bottom-right
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int m = sc.nextInt(), n = sc.nextInt();
        int[][] grid = new int[m][n];
        for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) grid[i][j] = sc.nextInt();
        System.out.println(solve(grid));
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func solve(grid [][]int) int {
	// TODO: return minimum path sum from top-left to bottom-right
	return 0
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	sc.Scan()
	dims := strings.Fields(sc.Text())
	m, _ := strconv.Atoi(dims[0])
	n, _ := strconv.Atoi(dims[1])
	grid := make([][]int, m)
	for i := 0; i < m; i++ {
		sc.Scan()
		parts := strings.Fields(sc.Text())
		row := make([]int, n)
		for j := 0; j < n; j++ { row[j], _ = strconv.Atoi(parts[j]) }
		grid[i] = row
	}
	fmt.Println(solve(grid))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <vector>
using namespace std;

int solve(vector<vector<int>>& grid) {
    // TODO: return minimum path sum from top-left to bottom-right
    return 0;
}

int main() {
    int m, n; cin >> m >> n;
    vector<vector<int>> grid(m, vector<int>(n));
    for (int i = 0; i < m; i++) for (int j = 0; j < n; j++) cin >> grid[i][j];
    cout << solve(grid) << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', '3 3
1 3 1
1 5 1
4 2 1', 'expected_output', '7', 'is_hidden', false),
    jsonb_build_object('input', '2 3
1 2 3
4 5 6', 'expected_output', '12', 'is_hidden', false),
    jsonb_build_object('input', '1 1
5', 'expected_output', '5', 'is_hidden', false),
    jsonb_build_object('input', '2 2
1 2
1 1', 'expected_output', '3', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Use dynamic programming: dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1]).',
    'The first row and column have only one direction to come from, so fill them first.'
  ),
  '1 <= m, n <= 200; 0 <= grid[i][j] <= 100',
  jsonb_build_array(
    jsonb_build_object('input', '3 3\n1 3 1\n1 5 1\n4 2 1', 'output', '7', 'explanation', 'Path: 1→3→1→1→1 = 7')
  ),
  true, 'published', 250, 100, 60
);

-- ----------------------------------------------------------------
-- Challenge 19: Word Break (expert, dynamic_programming)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Word Break',
  'word-break',
  $d$## Word Break

Given a string `s` and a dictionary of strings, return `"true"` if `s` can be segmented into a space-separated sequence of one or more dictionary words.

Dictionary words may be reused.

### Input Format
- Line 1: the string `s`
- Line 2: `n` (dictionary size)
- Lines 3 to n+2: one dictionary word per line

### Output Format
`true` or `false`$d$,
  'expert', 'dynamic_programming', ARRAY['dp','string','backtracking','trie'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const lines = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\n');
const s = lines[0];
const n = parseInt(lines[1]);
const wordDict = lines.slice(2, 2 + n);

/**
 * @param {string} s
 * @param {string[]} wordDict
 * @returns {boolean}
 */
function solve(s, wordDict) {
  // TODO: return true if s can be segmented using words in wordDict
}

console.log(String(solve(s, wordDict)));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const lines: string[] = fs.readFileSync('/dev/stdin', 'utf8').trim().split('\n');
const s: string = lines[0];
const n: number = parseInt(lines[1]);
const wordDict: string[] = lines.slice(2, 2 + n);

function solve(s: string, wordDict: string[]): boolean {
  // TODO: return true if s can be segmented using words in wordDict
  return false;
}

console.log(String(solve(s, wordDict)));
$tsc$,
    'python', $pyc$import sys
lines = sys.stdin.read().strip().split('\n')
s = lines[0]
n = int(lines[1])
word_dict = lines[2:2+n]

def solve(s: str, word_dict: list) -> bool:
    # TODO: return True if s can be segmented using words in word_dict
    pass

print(str(solve(s, word_dict)).lower())
$pyc$,
    'java', $jvc$import java.util.*;

public class Solution {
    public static boolean solve(String s, List<String> wordDict) {
        // TODO: return true if s can be segmented using words in wordDict
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine().trim();
        int n = Integer.parseInt(sc.nextLine().trim());
        List<String> wordDict = new ArrayList<>();
        for (int i = 0; i < n; i++) wordDict.add(sc.nextLine().trim());
        System.out.println(solve(s, wordDict));
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func solve(s string, wordDict []string) bool {
	// TODO: return true if s can be segmented using words in wordDict
	return false
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	sc.Scan(); s := sc.Text()
	sc.Scan(); n, _ := strconv.Atoi(strings.TrimSpace(sc.Text()))
	wordDict := make([]string, n)
	for i := 0; i < n; i++ { sc.Scan(); wordDict[i] = sc.Text() }
	fmt.Println(solve(s, wordDict))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <vector>
#include <string>
using namespace std;

bool solve(const string& s, const vector<string>& wordDict) {
    // TODO: return true if s can be segmented using words in wordDict
    return false;
}

int main() {
    string s; getline(cin, s);
    int n; cin >> n; cin.ignore();
    vector<string> wordDict(n);
    for (int i = 0; i < n; i++) getline(cin, wordDict[i]);
    cout << (solve(s, wordDict) ? "true" : "false") << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', 'leetcode
2
leet
code', 'expected_output', 'true', 'is_hidden', false),
    jsonb_build_object('input', 'applepenapple
2
apple
pen', 'expected_output', 'true', 'is_hidden', false),
    jsonb_build_object('input', 'catsandog
3
cats
dog
sand', 'expected_output', 'false', 'is_hidden', false),
    jsonb_build_object('input', 'cars
2
car
ca', 'expected_output', 'false', 'is_hidden', true),
    jsonb_build_object('input', 'aaaaaaa
2
aaaa
aaa', 'expected_output', 'true', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Use a DP boolean array where dp[i] = true means s[0..i-1] can be segmented.',
    'For each position i, check all j < i: if dp[j] is true and s[j..i-1] is in the dictionary, set dp[i] = true.',
    'Put dictionary words into a set for O(1) lookup.'
  ),
  '1 <= s.length <= 300; 1 <= wordDict.length <= 1000; 1 <= wordDict[i].length <= 20; s and dictionary consist of lowercase English letters only.',
  jsonb_build_array(
    jsonb_build_object('input', 'leetcode\n2\nleet\ncode', 'output', 'true', 'explanation', '"leet" + "code" = "leetcode"')
  ),
  true, 'published', 400, 150, 100
);

-- ----------------------------------------------------------------
-- Challenge 20: Serialize Binary Tree (expert, trees)
-- ----------------------------------------------------------------
INSERT INTO public.challenges (
  title, slug, description, difficulty, category, tags,
  starter_code, test_cases, hints, constraints, examples,
  is_official, status, xp_reward, xp_first_solve_bonus, xp_speed_bonus_max
) VALUES (
  'Serialize Binary Tree',
  'serialize-binary-tree',
  $d$## Serialize Binary Tree

Design an algorithm to **serialize** a binary tree to a string and **deserialize** it back.

The test validates your implementation by checking that `serialize(deserialize(input))` produces the canonical level-order form.

### Input Format
A single line of space-separated integers representing the level-order traversal. Use `-1` for null. No trailing nulls.

### Output Format
The canonical level-order traversal after a serialize→deserialize round-trip. Use `-1` for null. No trailing nulls.$d$,
  'expert', 'trees', ARRAY['tree','bfs','serialization','design'],
  jsonb_build_object(
    'javascript', $jsc$const fs = require('fs');
const input = fs.readFileSync('/dev/stdin', 'utf8').trim();

class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val; this.left = left; this.right = right;
  }
}

/**
 * Encodes a tree to a single string.
 * @param {TreeNode|null} root
 * @returns {string}
 */
function serialize(root) {
  // TODO: implement serialization
  return '';
}

/**
 * Decodes your encoded string to a tree.
 * @param {string} data
 * @returns {TreeNode|null}
 */
function deserialize(data) {
  // TODO: implement deserialization
  return null;
}

function toCanonical(root) {
  if (!root) return '-1';
  const result = [];
  const queue = [root];
  while (queue.length) {
    const node = queue.shift();
    if (node === null) { result.push('-1'); continue; }
    result.push(String(node.val));
    queue.push(node.left);
    queue.push(node.right);
  }
  while (result[result.length - 1] === '-1') result.pop();
  return result.join(' ');
}

const decoded = deserialize(serialize(deserialize(input)));
console.log(toCanonical(decoded));
$jsc$,
    'typescript', $tsc$const fs = require('fs');
const input: string = fs.readFileSync('/dev/stdin', 'utf8').trim();

class TreeNode {
  val: number; left: TreeNode | null; right: TreeNode | null;
  constructor(val: number) { this.val = val; this.left = null; this.right = null; }
}

function serialize(root: TreeNode | null): string {
  // TODO: implement serialization
  return '';
}

function deserialize(data: string): TreeNode | null {
  // TODO: implement deserialization
  return null;
}

function toCanonical(root: TreeNode | null): string {
  if (!root) return '-1';
  const result: string[] = [];
  const queue: (TreeNode | null)[] = [root];
  while (queue.length) {
    const node = queue.shift()!;
    if (node === null) { result.push('-1'); continue; }
    result.push(String(node.val));
    queue.push(node.left);
    queue.push(node.right);
  }
  while (result[result.length - 1] === '-1') result.pop();
  return result.join(' ');
}

console.log(toCanonical(deserialize(serialize(deserialize(input)))));
$tsc$,
    'python', $pyc$import sys
from collections import deque

data = sys.stdin.read().strip()

class TreeNode:
    def __init__(self, val=0):
        self.val = val
        self.left = None
        self.right = None

def serialize(root) -> str:
    # TODO: implement serialization
    return ''

def deserialize(data: str):
    # TODO: implement deserialization
    return None

def to_canonical(root) -> str:
    if root is None:
        return '-1'
    result = []
    queue = deque([root])
    while queue:
        node = queue.popleft()
        if node is None:
            result.append('-1')
            continue
        result.append(str(node.val))
        queue.append(node.left)
        queue.append(node.right)
    while result and result[-1] == '-1':
        result.pop()
    return ' '.join(result)

print(to_canonical(deserialize(serialize(deserialize(data)))))
$pyc$,
    'java', $jvc$import java.util.*;

class TreeNode {
    int val; TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}

public class Solution {
    public static String serialize(TreeNode root) {
        // TODO: implement serialization
        return "";
    }

    public static TreeNode deserialize(String data) {
        // TODO: implement deserialization
        return null;
    }

    private static String toCanonical(TreeNode root) {
        if (root == null) return "-1";
        List<String> result = new ArrayList<>();
        Queue<TreeNode> q = new LinkedList<>();
        q.offer(root);
        while (!q.isEmpty()) {
            TreeNode node = q.poll();
            if (node == null) { result.add("-1"); continue; }
            result.add(String.valueOf(node.val));
            q.offer(node.left);
            q.offer(node.right);
        }
        while (!result.isEmpty() && result.get(result.size()-1).equals("-1"))
            result.remove(result.size()-1);
        return String.join(" ", result);
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String input = sc.hasNextLine() ? sc.nextLine().trim() : "";
        System.out.println(toCanonical(deserialize(serialize(deserialize(input)))));
    }
}
$jvc$,
    'go', $goc$package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

type TreeNode struct {
	Val   int
	Left  *TreeNode
	Right *TreeNode
}

func serialize(root *TreeNode) string {
	// TODO: implement serialization
	return ""
}

func deserialize(data string) *TreeNode {
	// TODO: implement deserialization
	return nil
}

func toCanonical(root *TreeNode) string {
	if root == nil { return "-1" }
	result := []string{}
	queue := []*TreeNode{root}
	for len(queue) > 0 {
		node := queue[0]; queue = queue[1:]
		if node == nil { result = append(result, "-1"); continue }
		result = append(result, fmt.Sprintf("%d", node.Val))
		queue = append(queue, node.Left, node.Right)
	}
	for len(result) > 0 && result[len(result)-1] == "-1" {
		result = result[:len(result)-1]
	}
	return strings.Join(result, " ")
}

func main() {
	sc := bufio.NewScanner(os.Stdin)
	sc.Buffer(make([]byte, 1<<20), 1<<20)
	sc.Scan()
	input := sc.Text()
	fmt.Println(toCanonical(deserialize(serialize(deserialize(input)))))
}
$goc$,
    'cpp', $cppc$#include <iostream>
#include <vector>
#include <queue>
#include <string>
#include <sstream>
using namespace std;

struct TreeNode {
    int val; TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

string serialize(TreeNode* root) {
    // TODO: implement serialization
    return "";
}

TreeNode* deserialize(const string& data) {
    // TODO: implement deserialization
    return nullptr;
}

string toCanonical(TreeNode* root) {
    if (!root) return "-1";
    vector<string> result;
    queue<TreeNode*> q; q.push(root);
    while (!q.empty()) {
        TreeNode* node = q.front(); q.pop();
        if (!node) { result.push_back("-1"); continue; }
        result.push_back(to_string(node->val));
        q.push(node->left); q.push(node->right);
    }
    while (!result.empty() && result.back() == "-1") result.pop_back();
    string out;
    for (int i = 0; i < (int)result.size(); i++) { if (i) out += ' '; out += result[i]; }
    return out;
}

int main() {
    string input; getline(cin, input);
    cout << toCanonical(deserialize(serialize(deserialize(input)))) << "\n";
    return 0;
}
$cppc$
  ),
  jsonb_build_array(
    jsonb_build_object('input', '1 2 3 -1 -1 4 5', 'expected_output', '1 2 3 -1 -1 4 5', 'is_hidden', false),
    jsonb_build_object('input', '1 -1 2 3', 'expected_output', '1 -1 2 3', 'is_hidden', false),
    jsonb_build_object('input', '-1', 'expected_output', '-1', 'is_hidden', false),
    jsonb_build_object('input', '1 2 -1 3', 'expected_output', '1 2 -1 3', 'is_hidden', true)
  ),
  jsonb_build_array(
    'Use BFS (level-order) for both serialize and deserialize for simplicity.',
    'In serialize: queue nodes, emit value or "-1" for null. In deserialize: split by space, queue non-null nodes and attach children.',
    'Your chosen format must be self-consistent — serialize and deserialize must be inverse operations.'
  ),
  '0 <= number of nodes <= 10^4; -1000 <= node.val <= 1000; node.val != -1 (reserve -1 for null)',
  jsonb_build_array(
    jsonb_build_object('input', '1 2 3 -1 -1 4 5', 'output', '1 2 3 -1 -1 4 5', 'explanation', 'serialize then deserialize produces the original tree in canonical form')
  ),
  true, 'published', 400, 150, 100
);

END;
$$;

-- ============================================================
-- 20. SEED DAILY CHALLENGES (last 7 days)
-- ============================================================

INSERT INTO public.daily_challenges (challenge_id, date)
SELECT id, CURRENT_DATE - (ROW_NUMBER() OVER (ORDER BY created_at) - 1)::int
FROM public.challenges
WHERE status = 'published' AND is_official = true
ORDER BY created_at
LIMIT 7
ON CONFLICT (date) DO NOTHING;
