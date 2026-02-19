"use server";

import { createClient } from "@/lib/supabase/server";
import { awardXP } from "@/lib/actions/xp";
import { checkAndAwardAchievements } from "@/lib/actions/achievements";
import { createNotification } from "@/lib/actions/notifications";
import { runAllTestCases, sanitizeResultsForClient } from "@/lib/challenges/executor";
import { calculateSolveXP } from "@/lib/challenges/rewards";
import type {
  Challenge,
  Submission,
  ChallengeSolve,
  Duel,
  Contest,
  ContestParticipant,
  ChallengeUserStats,
  ChallengeLeaderboardEntry,
  ChallengeDifficulty,
  ChallengeCategory,
} from "@/lib/types/challenges";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// ── Challenge CRUD ────────────────────────────────────────────────────────────

export interface GetChallengesFilters {
  difficulty?: ChallengeDifficulty;
  category?: ChallengeCategory;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/** Paginated, filterable challenge list. Only returns published challenges publicly. */
export async function getChallenges(
  filters: GetChallengesFilters = {}
): Promise<{ challenges: Challenge[]; total: number; page: number }> {
  const { supabase, user } = await getAuthUser();
  const { difficulty, category, status = "published", search, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("challenges")
    .select("*, author:profiles(username,display_name,avatar_url,level)", {
      count: "exact",
    })
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (difficulty) query = query.eq("difficulty", difficulty);
  if (category) query = query.eq("category", category);
  if (search) query = query.ilike("title", `%${search}%`);

  const { data, count } = await query;
  const challenges = (data ?? []) as Challenge[];

  // If user is logged in, check which they've solved
  if (user && challenges.length > 0) {
    const ids = challenges.map((c) => c.id);
    const { data: solves } = await supabase
      .from("challenge_solves")
      .select("challenge_id")
      .eq("user_id", user.id)
      .in("challenge_id", ids);
    const solvedSet = new Set((solves ?? []).map((s) => s.challenge_id));

    const { data: likes } = await supabase
      .from("challenge_likes")
      .select("challenge_id")
      .eq("user_id", user.id)
      .in("challenge_id", ids);
    const likedSet = new Set((likes ?? []).map((l) => l.challenge_id));

    challenges.forEach((c) => {
      c.user_solved = solvedSet.has(c.id);
      c.user_liked = likedSet.has(c.id);
    });
  }

  // Strip hidden test cases before returning
  challenges.forEach((c) => {
    c.test_cases = (c.test_cases ?? []).filter((tc) => !tc.is_hidden);
  });

  return { challenges, total: count ?? 0, page };
}

/** Single challenge by slug. Strips hidden test cases for the client. */
export async function getChallengeBySlug(
  slug: string
): Promise<Challenge | null> {
  const { supabase, user } = await getAuthUser();

  const { data } = await supabase
    .from("challenges")
    .select("*, author:profiles(username,display_name,avatar_url,level)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!data) return null;
  const challenge = data as Challenge;

  // Never send hidden test cases to the client
  challenge.test_cases = (challenge.test_cases ?? []).filter(
    (tc) => !tc.is_hidden
  );

  if (user) {
    const { data: solve } = await supabase
      .from("challenge_solves")
      .select("id")
      .eq("challenge_id", challenge.id)
      .eq("user_id", user.id)
      .maybeSingle();
    challenge.user_solved = !!solve;

    const { data: like } = await supabase
      .from("challenge_likes")
      .select("id")
      .eq("challenge_id", challenge.id)
      .eq("user_id", user.id)
      .maybeSingle();
    challenge.user_liked = !!like;
  }

  return challenge;
}

/** Create a challenge as a draft. Author = current user. */
export async function createChallenge(
  data: Partial<Challenge>
): Promise<{ challenge: Challenge | null; error: string | null }> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { challenge: null, error: "Not authenticated" };

  const { data: challenge, error } = await supabase
    .from("challenges")
    .insert({ ...data, author_id: user.id, status: "draft" })
    .select()
    .single();

  if (error) return { challenge: null, error: error.message };
  return { challenge: challenge as Challenge, error: null };
}

/** Update a challenge (only author can update their drafts). */
export async function updateChallenge(
  id: string,
  data: Partial<Challenge>
): Promise<{ error: string | null }> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("challenges")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("author_id", user.id);

  return { error: error?.message ?? null };
}

/** Submit a challenge for admin review. */
export async function submitForReview(
  id: string
): Promise<{ error: string | null }> {
  return updateChallenge(id, { status: "pending_review" } as Partial<Challenge>);
}

// ── Submissions ───────────────────────────────────────────────────────────────

export interface SubmitSolutionResult {
  submission: Submission | null;
  xpEarned: number;
  isFirstSolve: boolean;
  newAchievements: string[];
  error: string | null;
}

/**
 * Submit a solution for a challenge.
 * 1. Creates a pending submission record
 * 2. Fetches all test cases (including hidden) and runs code via Piston
 * 3. Updates the submission with results
 * 4. If all passed: awards XP, records solve, updates profile rank
 */
export async function submitSolution(
  challengeId: string,
  code: string,
  language: string
): Promise<SubmitSolutionResult> {
  const { supabase, user } = await getAuthUser();
  if (!user) {
    return { submission: null, xpEarned: 0, isFirstSolve: false, newAchievements: [], error: "Not authenticated" };
  }

  // Fetch the full challenge with ALL test cases (including hidden)
  const { data: challengeRow } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .eq("status", "published")
    .single();

  if (!challengeRow) {
    return { submission: null, xpEarned: 0, isFirstSolve: false, newAchievements: [], error: "Challenge not found" };
  }

  const challenge = challengeRow as Challenge;
  const testCases = (challenge.test_cases ?? []) as Array<{
    input: string;
    expected_output: string;
    is_hidden: boolean;
  }>;

  // Create initial submission record
  const { data: submissionRow, error: insertErr } = await supabase
    .from("submissions")
    .insert({
      challenge_id: challengeId,
      user_id: user.id,
      code,
      language,
      status: "running",
      tests_total: testCases.length,
    })
    .select()
    .single();

  if (insertErr || !submissionRow) {
    return { submission: null, xpEarned: 0, isFirstSolve: false, newAchievements: [], error: insertErr?.message ?? "Failed to create submission" };
  }

  // Run code against all test cases
  let execResult;
  try {
    execResult = await runAllTestCases(code, language, testCases, challenge.time_limit_ms ?? 5000);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Execution error";
    await supabase
      .from("submissions")
      .update({ status: "error", error_message: message.slice(0, 1000) })
      .eq("id", submissionRow.id);
    return { submission: null, xpEarned: 0, isFirstSolve: false, newAchievements: [], error: message };
  }

  const { results, allPassed, totalTime, passedCount } = execResult;
  const score = testCases.length > 0 ? Math.round((passedCount / testCases.length) * 100) : 0;

  // Determine if this is first-ever solve
  const { count: priorSolves } = await supabase
    .from("challenge_solves")
    .select("id", { count: "exact", head: true })
    .eq("challenge_id", challengeId);
  const isFirstSolveGlobal = (priorSolves ?? 0) === 0;

  const { data: myPriorSolve } = await supabase
    .from("challenge_solves")
    .select("id, best_time_ms, attempts_count")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isNewSolve = allPassed && !myPriorSolve;

  // Calculate XP
  let xpEarned = 0;
  if (allPassed) {
    xpEarned = calculateSolveXP(
      challenge.difficulty,
      challenge.xp_reward,
      challenge.xp_first_solve_bonus,
      challenge.xp_speed_bonus_max,
      isFirstSolveGlobal,
      totalTime,
      challenge.avg_solve_time_ms ?? 0
    );
  }

  // Sanitize results for client (hide hidden test case I/O)
  const clientResults = sanitizeResultsForClient(results, testCases);

  // Update submission record
  const submissionStatus: string = allPassed ? "passed" : results.some((r) => r.error) ? "error" : "failed";
  await supabase
    .from("submissions")
    .update({
      status: submissionStatus,
      test_results: clientResults,
      tests_passed: passedCount,
      tests_total: testCases.length,
      execution_time_ms: totalTime,
      score,
      xp_earned: xpEarned,
      is_first_solve: isFirstSolveGlobal && allPassed,
    })
    .eq("id", submissionRow.id);

  // Fetch updated submission
  const { data: finalSubmission } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", submissionRow.id)
    .single();

  // Post-pass actions (non-blocking)
  let newAchievements: string[] = [];
  if (allPassed) {
    await Promise.allSettled([
      // Record or update solve
      isNewSolve
        ? supabase.from("challenge_solves").insert({
            challenge_id: challengeId,
            user_id: user.id,
            best_submission_id: submissionRow.id,
            best_time_ms: totalTime,
            best_language: language,
            attempts_count: 1,
          })
        : supabase
            .from("challenge_solves")
            .update({
              attempts_count: (myPriorSolve?.attempts_count ?? 1) + 1,
              ...(totalTime < (myPriorSolve?.best_time_ms ?? Infinity)
                ? { best_submission_id: submissionRow.id, best_time_ms: totalTime, best_language: language }
                : {}),
            })
            .eq("challenge_id", challengeId)
            .eq("user_id", user.id),

      // Award XP
      awardXP(user.id, xpEarned, "challenge_solved"),

      // Update avg_solve_time on challenge
      supabase.rpc("calculate_challenge_rank", { p_user_id: user.id }),

      // Notification
      createNotification({
        user_id: user.id,
        actor_id: null,
        type: "achievement" as never,
        message: `You solved "${challenge.title}" and earned ${xpEarned} XP!`,
      }),
    ]);

    // Check achievements
    const unlocked = await checkAndAwardAchievements(user.id);
    newAchievements = unlocked.map((a) => a.name);
  } else if (myPriorSolve) {
    // Update attempt count even on failure
    await supabase
      .from("challenge_solves")
      .update({ attempts_count: (myPriorSolve.attempts_count ?? 1) + 1 })
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id);
  }

  return {
    submission: finalSubmission as Submission,
    xpEarned,
    isFirstSolve: isFirstSolveGlobal && allPassed,
    newAchievements,
    error: null,
  };
}

/**
 * Run code against VISIBLE test cases only — no DB record created.
 * Used for the "Run Tests" button (quick feedback before submitting).
 */
export async function testSolution(
  challengeId: string,
  code: string,
  language: string
): Promise<{
  results: Array<{ test_case_index: number; passed: boolean; output: string; expected: string; time_ms: number; memory_mb: number; error?: string }>;
  passedCount: number;
  totalTime: number;
  error: string | null;
}> {
  const { user } = await getAuthUser();
  if (!user) return { results: [], passedCount: 0, totalTime: 0, error: "Not authenticated" };

  const { supabase } = await getAuthUser();
  const { data: challengeRow } = await supabase
    .from("challenges")
    .select("test_cases, time_limit_ms")
    .eq("id", challengeId)
    .single();

  if (!challengeRow) return { results: [], passedCount: 0, totalTime: 0, error: "Challenge not found" };

  const visibleTests = ((challengeRow.test_cases ?? []) as Array<{ input: string; expected_output: string; is_hidden: boolean }>)
    .filter((tc) => !tc.is_hidden);

  try {
    const execResult = await runAllTestCases(code, language, visibleTests, challengeRow.time_limit_ms ?? 5000);
    return {
      results: execResult.results,
      passedCount: execResult.passedCount,
      totalTime: execResult.totalTime,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Execution error";
    return { results: [], passedCount: 0, totalTime: 0, error: message };
  }
}

/** Get all of a user's submissions for a specific challenge. */
export async function getSubmissions(
  challengeId: string,
  userId?: string
): Promise<Submission[]> {
  const { supabase, user } = await getAuthUser();
  const targetUserId = userId ?? user?.id;
  if (!targetUserId) return [];

  const { data } = await supabase
    .from("submissions")
    .select("*")
    .eq("challenge_id", challengeId)
    .eq("user_id", targetUserId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []) as Submission[];
}

/** Top solvers for a challenge. */
export async function getChallengeLeaderboard(
  challengeId: string,
  limit = 20
): Promise<ChallengeLeaderboardEntry[]> {
  const supabase = await createClient().then((c) => c);

  // Use the RPC
  const { supabase: sb } = await getAuthUser();
  const { data } = await sb.rpc("get_challenge_leaderboard", {
    p_challenge_id: challengeId,
    p_limit: limit,
  });

  return (data ?? []) as ChallengeLeaderboardEntry[];
}

// ── Daily Challenge ───────────────────────────────────────────────────────────

/** Returns today's daily challenge. */
export async function getDailyChallenge(): Promise<Challenge | null> {
  const { supabase } = await getAuthUser();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("daily_challenges")
    .select("challenge:challenges(*, author:profiles(username,display_name,avatar_url,level))")
    .eq("date", today)
    .single();

  if (!data?.challenge) return null;
  const challenge = data.challenge as unknown as Challenge;
  // Strip hidden test cases
  challenge.test_cases = (challenge.test_cases ?? []).filter((tc) => !tc.is_hidden);
  return challenge;
}

// ── Duels ─────────────────────────────────────────────────────────────────────

/** Create a 1v1 duel. If opponentId is null, creates an open challenge. */
export async function createDuel(
  challengeId: string,
  opponentId?: string,
  xpStake = 50
): Promise<{ duel: Duel | null; error: string | null }> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { duel: null, error: "Not authenticated" };

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("duels")
    .insert({
      challenge_id: challengeId,
      challenger_id: user.id,
      opponent_id: opponentId ?? null,
      xp_stake: xpStake,
      expires_at: expiresAt,
      status: "pending",
    })
    .select("*, challenge:challenges(title,slug,difficulty,category,xp_reward), challenger:profiles!duels_challenger_id_fkey(username,display_name,avatar_url,level)")
    .single();

  if (error) return { duel: null, error: error.message };
  return { duel: data as unknown as Duel, error: null };
}

/** Opponent accepts a duel — sets status to active. */
export async function acceptDuel(
  duelId: string
): Promise<{ error: string | null }> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("duels")
    .update({
      status: "active",
      opponent_id: user.id,
      started_at: new Date().toISOString(),
    })
    .eq("id", duelId)
    .eq("status", "pending");

  return { error: error?.message ?? null };
}

/** Opponent declines a duel. */
export async function declineDuel(
  duelId: string
): Promise<{ error: string | null }> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("duels")
    .update({ status: "declined" })
    .eq("id", duelId)
    .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`);

  return { error: error?.message ?? null };
}

/** Submit a solution as part of an active duel. Determines winner when both submit. */
export async function submitDuelSolution(
  duelId: string,
  code: string,
  language: string
): Promise<{ error: string | null; isWinner: boolean }> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Not authenticated", isWinner: false };

  const { data: duelRow } = await supabase
    .from("duels")
    .select("*")
    .eq("id", duelId)
    .single();

  if (!duelRow || duelRow.status !== "active") {
    return { error: "Duel not active", isWinner: false };
  }

  const duel = duelRow as Duel;
  const isChallenger = duel.challenger_id === user.id;

  // Submit the solution
  const result = await submitSolution(duel.challenge_id, code, language);
  if (result.error || !result.submission) {
    return { error: result.error ?? "Submission failed", isWinner: false };
  }

  const myTime = result.submission.execution_time_ms;
  const myPassed = result.submission.status === "passed";

  // Update duel with this submission
  const updateData: Record<string, unknown> = isChallenger
    ? { challenger_submission_id: result.submission.id, challenger_time_ms: myTime }
    : { opponent_submission_id: result.submission.id, opponent_time_ms: myTime };

  await supabase.from("duels").update(updateData).eq("id", duelId);

  // Reload duel to check if both have submitted
  const { data: updatedDuel } = await supabase
    .from("duels")
    .select("*")
    .eq("id", duelId)
    .single();

  if (!updatedDuel) return { error: null, isWinner: false };

  const bothSubmitted =
    updatedDuel.challenger_submission_id && updatedDuel.opponent_submission_id;

  if (bothSubmitted) {
    // Determine winner: faster solve wins; if neither solved, both lose
    const challengerTime = updatedDuel.challenger_time_ms as number | null;
    const opponentTime = updatedDuel.opponent_time_ms as number | null;

    // Fetch pass status of both submissions
    const { data: subs } = await supabase
      .from("submissions")
      .select("id, status, user_id")
      .in("id", [updatedDuel.challenger_submission_id, updatedDuel.opponent_submission_id]);

    const challengerSub = subs?.find((s) => s.user_id === duel.challenger_id);
    const opponentSub = subs?.find((s) => s.user_id === duel.opponent_id);

    const challengerPassed = challengerSub?.status === "passed";
    const opponentPassed = opponentSub?.status === "passed";

    let winnerId: string | null = null;
    if (challengerPassed && !opponentPassed) winnerId = duel.challenger_id;
    else if (opponentPassed && !challengerPassed) winnerId = duel.opponent_id ?? null;
    else if (challengerPassed && opponentPassed) {
      winnerId =
        (challengerTime ?? Infinity) <= (opponentTime ?? Infinity)
          ? duel.challenger_id
          : (duel.opponent_id ?? null);
    }

    await supabase.from("duels").update({
      status: "completed",
      winner_id: winnerId,
      completed_at: new Date().toISOString(),
    }).eq("id", duelId);

    // Award duel XP
    if (winnerId) {
      const loserId = winnerId === duel.challenger_id ? duel.opponent_id : duel.challenger_id;
      await Promise.allSettled([
        awardXP(winnerId, duel.xp_stake + 50, "duel_won"),
        loserId ? awardXP(loserId, 10, "duel_lost") : Promise.resolve(),
        supabase.from("profiles").update({ duel_wins: supabase.rpc as never }).eq("id", winnerId),
      ]);
      // Simpler: increment counters directly
      await supabase.rpc("calculate_challenge_rank", { p_user_id: winnerId });
    }

    const isWinner = winnerId === user.id;
    return { error: null, isWinner };
  }

  return { error: null, isWinner: false };
}

/** Active/pending duels for a user. */
export async function getActiveDuels(userId?: string): Promise<Duel[]> {
  const { supabase, user } = await getAuthUser();
  const uid = userId ?? user?.id;
  if (!uid) return [];

  const { data } = await supabase
    .from("duels")
    .select("*, challenge:challenges(title,slug,difficulty,category,xp_reward), challenger:profiles!duels_challenger_id_fkey(username,display_name,avatar_url,level), opponent:profiles!duels_opponent_id_fkey(username,display_name,avatar_url,level)")
    .or(`challenger_id.eq.${uid},opponent_id.eq.${uid}`)
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as Duel[];
}

/** Completed duel history for a user. */
export async function getDuelHistory(userId?: string): Promise<Duel[]> {
  const { supabase, user } = await getAuthUser();
  const uid = userId ?? user?.id;
  if (!uid) return [];

  const { data } = await supabase
    .from("duels")
    .select("*, challenge:challenges(title,slug,difficulty,category,xp_reward), challenger:profiles!duels_challenger_id_fkey(username,display_name,avatar_url,level), opponent:profiles!duels_opponent_id_fkey(username,display_name,avatar_url,level)")
    .or(`challenger_id.eq.${uid},opponent_id.eq.${uid}`)
    .in("status", ["completed", "expired", "declined"])
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []) as unknown as Duel[];
}

// ── Contests ──────────────────────────────────────────────────────────────────

/** List contests filtered by status. */
export async function getContests(
  status?: string
): Promise<Contest[]> {
  const { supabase } = await getAuthUser();

  let query = supabase
    .from("contests")
    .select("*")
    .order("starts_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data } = await query;
  return (data ?? []) as Contest[];
}

/** Join a contest. */
export async function joinContest(
  contestId: string
): Promise<{ error: string | null }> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("contest_participants")
    .insert({ contest_id: contestId, user_id: user.id });

  if (!error) {
    await awardXP(user.id, 50, "contest_participation");
  }

  return { error: error?.message ?? null };
}

/** Contest leaderboard. */
export async function getContestLeaderboard(
  contestId: string
): Promise<ContestParticipant[]> {
  const { supabase } = await getAuthUser();

  const { data } = await supabase
    .from("contest_participants")
    .select("*, profile:profiles(username,display_name,avatar_url,level)")
    .eq("contest_id", contestId)
    .order("score", { ascending: false })
    .limit(50);

  return (data ?? []) as unknown as ContestParticipant[];
}

// ── Stats ─────────────────────────────────────────────────────────────────────

/** Full stats object for a user. */
export async function getChallengeUserStats(
  userId?: string
): Promise<ChallengeUserStats | null> {
  const { supabase, user } = await getAuthUser();
  const uid = userId ?? user?.id;
  if (!uid) return null;

  const { data } = await supabase.rpc("get_challenge_stats", {
    p_user_id: uid,
  });

  if (!data) return null;
  return data as unknown as ChallengeUserStats;
}

/** Solved count per category — useful for radar charts. */
export async function getChallengeCategoryBreakdown(
  userId?: string
): Promise<Record<string, number>> {
  const { supabase, user } = await getAuthUser();
  const uid = userId ?? user?.id;
  if (!uid) return {};

  const { data } = await supabase
    .from("challenge_solves")
    .select("challenge:challenges(category)")
    .eq("user_id", uid);

  const breakdown: Record<string, number> = {};
  (data ?? []).forEach((row) => {
    const cat = (row.challenge as unknown as { category: string })?.category;
    if (cat) breakdown[cat] = (breakdown[cat] ?? 0) + 1;
  });

  return breakdown;
}

// ── Likes ─────────────────────────────────────────────────────────────────────

/** Toggle like on a challenge. Returns the new liked state. */
export async function toggleChallengeLike(
  challengeId: string
): Promise<{ liked: boolean; error: string | null }> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { liked: false, error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("challenge_likes")
    .select("id")
    .eq("challenge_id", challengeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("challenge_likes")
      .delete()
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id);
    return { liked: false, error: null };
  }

  const { error } = await supabase
    .from("challenge_likes")
    .insert({ challenge_id: challengeId, user_id: user.id });

  return { liked: !error, error: error?.message ?? null };
}

// ── Comments ──────────────────────────────────────────────────────────────────

export interface ChallengeComment {
  id: string;
  challenge_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_solution: boolean;
  spoiler: boolean;
  likes_count: number;
  created_at: string;
  author?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    level: number;
  };
  replies?: ChallengeComment[];
}

/** Get comments for a challenge, nested with replies. */
export async function getChallengeComments(
  challengeId: string
): Promise<ChallengeComment[]> {
  const { supabase } = await getAuthUser();

  const { data } = await supabase
    .from("challenge_comments")
    .select("*, author:profiles(username,display_name,avatar_url,level)")
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as ChallengeComment[];
  const topLevel = rows.filter((r) => !r.parent_id);
  const replies = rows.filter((r) => !!r.parent_id);

  topLevel.forEach((c) => {
    c.replies = replies.filter((r) => r.parent_id === c.id);
  });

  return topLevel;
}

/** Create a comment on a challenge. */
export async function createChallengeComment(
  challengeId: string,
  content: string,
  parentId?: string,
  isSolution = false,
  spoiler = false
): Promise<{ comment: ChallengeComment | null; error: string | null }> {
  const { supabase, user } = await getAuthUser();
  if (!user) return { comment: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("challenge_comments")
    .insert({
      challenge_id: challengeId,
      user_id: user.id,
      content,
      parent_id: parentId ?? null,
      is_solution: isSolution,
      spoiler,
    })
    .select("*, author:profiles(username,display_name,avatar_url,level)")
    .single();

  if (error) return { comment: null, error: error.message };
  return { comment: data as unknown as ChallengeComment, error: null };
}
