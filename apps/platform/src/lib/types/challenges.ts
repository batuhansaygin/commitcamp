export type ChallengeDifficulty = "easy" | "medium" | "hard" | "expert";
export type ChallengeStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "archived";
export type SubmissionStatus =
  | "pending"
  | "running"
  | "passed"
  | "failed"
  | "error"
  | "timeout";
export type ChallengeCategory =
  | "algorithms"
  | "data_structures"
  | "strings"
  | "arrays"
  | "math"
  | "sorting"
  | "searching"
  | "dynamic_programming"
  | "graphs"
  | "trees"
  | "recursion"
  | "regex"
  | "sql_challenge"
  | "web"
  | "api"
  | "system_design"
  | "debugging"
  | "optimization"
  | "fun";
export type DuelStatus =
  | "pending"
  | "active"
  | "completed"
  | "expired"
  | "declined";
export type ContestStatus = "upcoming" | "active" | "ended";
export type ChallengeRank =
  | "unranked"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond"
  | "grandmaster";

export interface TestCase {
  input: string;
  expected_output: string;
  is_hidden: boolean;
}

export interface ChallengeExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ChallengeHint {
  text: string;
  xp_cost: number;
}

export interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: ChallengeDifficulty;
  category: ChallengeCategory;
  tags: string[];
  supported_languages: string[];
  starter_code: Record<string, string>;
  /** Full test cases — hidden ones are stripped before sending to client */
  test_cases: TestCase[];
  time_limit_ms: number;
  memory_limit_mb: number;
  examples: ChallengeExample[];
  constraints: string | null;
  hints: ChallengeHint[];
  author_id: string | null;
  is_official: boolean;
  status: ChallengeStatus;
  submissions_count: number;
  solved_count: number;
  solve_rate: number;
  avg_solve_time_ms: number;
  likes_count: number;
  xp_reward: number;
  xp_first_solve_bonus: number;
  xp_speed_bonus_max: number;
  created_at: string;
  updated_at: string;
  // Joined / computed client-side
  author?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    level: number;
  };
  user_solved?: boolean;
  user_liked?: boolean;
}

export interface Submission {
  id: string;
  challenge_id: string;
  user_id: string;
  code: string;
  language: string;
  status: SubmissionStatus;
  test_results: TestResult[];
  tests_passed: number;
  tests_total: number;
  execution_time_ms: number;
  memory_used_mb: number;
  error_message: string | null;
  score: number;
  xp_earned: number;
  is_first_solve: boolean;
  created_at: string;
}

export interface TestResult {
  test_case_index: number;
  passed: boolean;
  output: string;
  expected: string;
  time_ms: number;
  memory_mb: number;
  error?: string;
}

export interface ChallengeSolve {
  id: string;
  challenge_id: string;
  user_id: string;
  best_submission_id: string | null;
  best_time_ms: number | null;
  best_language: string | null;
  solved_at: string;
  attempts_count: number;
  hints_used: number;
}

export interface Duel {
  id: string;
  challenge_id: string;
  challenger_id: string;
  opponent_id: string | null;
  status: DuelStatus;
  winner_id: string | null;
  challenger_time_ms: number | null;
  opponent_time_ms: number | null;
  xp_stake: number;
  time_limit_minutes: number;
  started_at: string | null;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  // Joined
  challenge?: Pick<
    Challenge,
    "title" | "slug" | "difficulty" | "category" | "xp_reward"
  >;
  challenger?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    level: number;
  };
  opponent?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    level: number;
  };
}

export interface Contest {
  id: string;
  title: string;
  description: string | null;
  status: ContestStatus;
  challenge_ids: string[];
  starts_at: string;
  ends_at: string;
  xp_participation: number;
  xp_first_place: number;
  xp_second_place: number;
  xp_third_place: number;
  xp_top_10: number;
  participants_count: number;
  created_at: string;
}

export interface ContestParticipant {
  id: string;
  contest_id: string;
  user_id: string;
  score: number;
  challenges_solved: number;
  total_time_ms: number;
  rank: number | null;
  xp_earned: number;
  joined_at: string;
  profile?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    level: number;
  };
}

export interface ChallengeUserStats {
  total_solved: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  expert_solved: number;
  current_streak: number;
  challenge_rank: ChallengeRank;
  duel_wins: number;
  duel_losses: number;
  global_rank: number;
}

export interface ChallengeLeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  best_time_ms: number | null;
  best_language: string;
  solved_at: string;
}

// ── Display config ────────────────────────────────────────────────────────────

export const DIFFICULTY_CONFIG: Record<
  ChallengeDifficulty,
  { label: string; color: string; bgClass: string }
> = {
  easy: {
    label: "Easy",
    color: "#10b981",
    bgClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  medium: {
    label: "Medium",
    color: "#f59e0b",
    bgClass: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  hard: {
    label: "Hard",
    color: "#ef4444",
    bgClass: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  expert: {
    label: "Expert",
    color: "#a855f7",
    bgClass: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
};

export const RANK_CONFIG: Record<
  ChallengeRank,
  { label: string; color: string; icon: string; minSolved: number }
> = {
  unranked:    { label: "Unranked",    color: "#71717a", icon: "—",  minSolved: 0 },
  bronze:      { label: "Bronze",      color: "#cd7f32", icon: "🥉", minSolved: 1 },
  silver:      { label: "Silver",      color: "#94a3b8", icon: "🥈", minSolved: 11 },
  gold:        { label: "Gold",        color: "#fbbf24", icon: "🥇", minSolved: 31 },
  platinum:    { label: "Platinum",    color: "#67e8f9", icon: "💎", minSolved: 61 },
  diamond:     { label: "Diamond",     color: "#818cf8", icon: "💠", minSolved: 101 },
  grandmaster: { label: "Grandmaster", color: "#f97316", icon: "👑", minSolved: 201 },
};

export const CATEGORY_CONFIG: Record<
  ChallengeCategory,
  { label: string; icon: string }
> = {
  algorithms: { label: "Algorithms", icon: "⚙️" },
  data_structures: { label: "Data Structures", icon: "🏗️" },
  strings: { label: "Strings", icon: "📝" },
  arrays: { label: "Arrays", icon: "📊" },
  math: { label: "Math", icon: "🔢" },
  sorting: { label: "Sorting", icon: "📈" },
  searching: { label: "Searching", icon: "🔍" },
  dynamic_programming: { label: "Dynamic Programming", icon: "🧩" },
  graphs: { label: "Graphs", icon: "🕸️" },
  trees: { label: "Trees", icon: "🌳" },
  recursion: { label: "Recursion", icon: "🔄" },
  regex: { label: "Regex", icon: "🔤" },
  sql_challenge: { label: "SQL", icon: "🗃️" },
  web: { label: "Web", icon: "🌐" },
  api: { label: "API", icon: "🔌" },
  system_design: { label: "System Design", icon: "🏛️" },
  debugging: { label: "Debugging", icon: "🐛" },
  optimization: { label: "Optimization", icon: "⚡" },
  fun: { label: "Fun", icon: "🎮" },
};

export const SUPPORTED_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "go",
  "java",
  "csharp",
  "cpp",
  "rust",
  "ruby",
  "php",
  "kotlin",
  "swift",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  go: "Go",
  java: "Java",
  csharp: "C#",
  cpp: "C++",
  rust: "Rust",
  ruby: "Ruby",
  php: "PHP",
  kotlin: "Kotlin",
  swift: "Swift",
};
