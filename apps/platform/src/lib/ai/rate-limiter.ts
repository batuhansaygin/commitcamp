import { RATE_LIMIT } from "./config";

interface UserUsage {
  dailyCount: number;
  lastResetDate: string; // YYYY-MM-DD UTC
  minuteTimestamps: number[];
}

const userUsageMap = new Map<string, UserUsage>();
const globalMinuteTimestamps: number[] = [];

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export function checkRateLimit(userId: string): {
  allowed: boolean;
  reason?: string;
  remaining?: number;
} {
  const now = Date.now();
  const today = getTodayUTC();

  // Get or create user record
  let usage = userUsageMap.get(userId);
  if (!usage || usage.lastResetDate !== today) {
    usage = { dailyCount: 0, lastResetDate: today, minuteTimestamps: [] };
    userUsageMap.set(userId, usage);
  }

  // Clean stale per-user minute timestamps
  const oneMinuteAgo = now - 60_000;
  usage.minuteTimestamps = usage.minuteTimestamps.filter((t) => t > oneMinuteAgo);

  // Clean stale global minute timestamps
  const freshGlobal = globalMinuteTimestamps.filter((t) => t > oneMinuteAgo);
  globalMinuteTimestamps.length = 0;
  freshGlobal.forEach((t) => globalMinuteTimestamps.push(t));

  // Per-user daily limit
  if (usage.dailyCount >= RATE_LIMIT.maxRequestsPerUser) {
    return {
      allowed: false,
      reason: "Daily request limit reached. Resets at midnight UTC.",
      remaining: 0,
    };
  }

  // Global per-minute limit (protects free tier quota)
  if (globalMinuteTimestamps.length >= RATE_LIMIT.maxRequestsPerMinute) {
    return {
      allowed: false,
      reason: "Too many requests right now. Wait a moment and try again.",
      remaining: RATE_LIMIT.maxRequestsPerUser - usage.dailyCount,
    };
  }

  // Allow — record the request
  usage.dailyCount++;
  usage.minuteTimestamps.push(now);
  globalMinuteTimestamps.push(now);

  return {
    allowed: true,
    remaining: RATE_LIMIT.maxRequestsPerUser - usage.dailyCount,
  };
}

export function getUserDailyUsage(userId: string): {
  used: number;
  remaining: number;
} {
  const today = getTodayUTC();
  const usage = userUsageMap.get(userId);
  if (!usage || usage.lastResetDate !== today) {
    return { used: 0, remaining: RATE_LIMIT.maxRequestsPerUser };
  }
  return {
    used: usage.dailyCount,
    remaining: Math.max(0, RATE_LIMIT.maxRequestsPerUser - usage.dailyCount),
  };
}
