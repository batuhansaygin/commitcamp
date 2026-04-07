"use server";

import { z } from "zod";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { checkLimit, trackUsage } from "@/lib/actions/billing/usage";
import { extractJsonArray, extractJsonObject } from "@/lib/ai/extract-json";

const schema = z.object({
  changes: z.string().min(10).max(50000),
  context: z.string().max(4000).optional(),
  style: z.enum(["conventional", "simple", "both"]).default("both"),
});

export interface CommitCandidate {
  commit: string;
  prTitle: string;
  prBody: string;
}

export interface CommitGenResult {
  success: boolean;
  options?: CommitCandidate[];
  error?: string;
  upgradeRequired?: boolean;
}

export interface CommitHistoryItem {
  id: string;
  created_at: string;
  summary: string | null;
}

function getUsedTokens(usage: unknown): number {
  if (!usage || typeof usage !== "object") return 0;
  const obj = usage as Record<string, unknown>;
  const total = obj.totalTokens;
  const input = obj.inputTokens;
  const output = obj.outputTokens;
  if (typeof total === "number") return total;
  return (typeof input === "number" ? input : 0) + (typeof output === "number" ? output : 0);
}

async function isAiToolsEnabled() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "ai_tools_enabled")
    .maybeSingle();
  return data?.value !== false;
}

function normalizeCandidates(arr: unknown): CommitCandidate[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => item as Record<string, unknown>)
    .filter(
      (item) =>
        typeof item.commit === "string" &&
        typeof item.prTitle === "string" &&
        typeof item.prBody === "string"
    )
    .slice(0, 3)
    .map((item) => ({
      commit: item.commit as string,
      prTitle: item.prTitle as string,
      prBody: item.prBody as string,
    }));
}

function parseOptions(raw: string): CommitCandidate[] {
  try {
    const fromArray = normalizeCandidates(extractJsonArray(raw));
    if (fromArray.length > 0) return fromArray;
  } catch {
    /* try object wrapper */
  }

  try {
    const obj = extractJsonObject(raw) as Record<string, unknown>;
    for (const key of ["options", "alternatives", "commits", "results", "suggestions"] as const) {
      const fromKey = normalizeCandidates(obj[key]);
      if (fromKey.length > 0) return fromKey;
    }
  } catch {
    /* fall through */
  }

  try {
    const parsed = JSON.parse(raw.trim()) as unknown;
    if (Array.isArray(parsed)) return normalizeCandidates(parsed);
  } catch {
    /* last resort: substring array */
  }

  try {
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start !== -1 && end > start) {
      const parsed = JSON.parse(raw.slice(start, end + 1)) as unknown;
      return normalizeCandidates(parsed);
    }
  } catch {
    /* ignore */
  }

  return [];
}

export async function generateCommitAndPr(input: z.infer<typeof schema>): Promise<CommitGenResult> {
  try {
    const validated = schema.parse(input);
    if (!(await isAiToolsEnabled())) return { success: false, error: "AI tools are currently disabled." };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const limit = await checkLimit(user.id, "commit_gen");
    if (!limit.allowed) return { success: false, error: "Daily limit exceeded", upgradeRequired: true };

    const styleHint =
      validated.style === "conventional"
        ? "Each `commit` must be conventional (type(scope): subject). Keep prTitle/prBody aligned."
        : validated.style === "simple"
          ? "Each `commit` must be a short imperative sentence (no conventional prefix). prTitle/prBody still professional."
          : "Each item: `commit` conventional, and include a second line in prBody starting with 'Simple: ' giving a one-line non-conventional summary.";

    const ctx = validated.context?.trim()
      ? `\n\nExtra context (PR/issue notes):\n${validated.context.trim()}`
      : "";

    const result = await generateText({
      model: getModel("gemini"),
      system: `Generate 3 alternatives in strict JSON array format. Each item must have keys: commit, prTitle, prBody. ${styleHint}`,
      prompt: `Changes / diff summary:\n${validated.changes}${ctx}\n\nReturn JSON only.`,
      maxOutputTokens: 1200,
      temperature: 0.4,
    });

    const options = parseOptions(result.text);
    if (options.length === 0) {
      return { success: false, error: "Failed to parse AI response." };
    }

    await trackUsage(user.id, "commit_gen", getUsedTokens(result.usage));
    await supabase.from("tool_history").insert({
      user_id: user.id,
      tool_slug: "commit-generator",
      summary: `Generated ${options.length} commit/PR options`,
    });

    return { success: true, options };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Generation failed" };
  }
}

export async function getCommitGenHistory(limit = 20): Promise<CommitHistoryItem[]> {
  if (!(await isAiToolsEnabled())) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("tool_history")
    .select("id, created_at, summary")
    .eq("user_id", user.id)
    .eq("tool_slug", "commit-generator")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as CommitHistoryItem[];
}
