"use server";

import { z } from "zod";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { checkLimit, trackUsage } from "@/lib/actions/billing/usage";

const schema = z.object({
  changes: z.string().min(10).max(50000),
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

function parseOptions(raw: string): CommitCandidate[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => item as Record<string, unknown>)
      .filter((item) => typeof item.commit === "string" && typeof item.prTitle === "string" && typeof item.prBody === "string")
      .slice(0, 3)
      .map((item) => ({
        commit: item.commit as string,
        prTitle: item.prTitle as string,
        prBody: item.prBody as string,
      }));
  } catch {
    return [];
  }
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

    const result = await generateText({
      model: getModel("gemini"),
      system:
        "Generate 3 alternatives in strict JSON array format. Each item must have keys: commit, prTitle, prBody. Commit must follow conventional commits (feat/fix/refactor/chore/docs/test).",
      prompt: `Changes / diff summary:\n${validated.changes}\n\nReturn JSON only.`,
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
