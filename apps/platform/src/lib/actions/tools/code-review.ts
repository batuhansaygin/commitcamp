"use server";

import { z } from "zod";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { checkLimit, trackUsage } from "@/lib/actions/billing/usage";

const focusAreaSchema = z.enum(["bugs", "performance", "security", "style"]);

const codeReviewSchema = z.object({
  code: z.string().min(10).max(50000),
  language: z.string().min(1).max(50).optional(),
  focusAreas: z.array(focusAreaSchema).min(1).max(4).default(["bugs", "performance", "security", "style"]),
});

export interface AnalyzeCodeResult {
  success: boolean;
  grade?: "A" | "B" | "C" | "D" | "F";
  report?: string;
  error?: string;
  upgradeRequired?: boolean;
}

export interface ReviewHistoryItem {
  id: string;
  created_at: string;
  summary: string | null;
}

function parseGrade(report: string): "A" | "B" | "C" | "D" | "F" {
  const hit = report.match(/\bgrade\s*[:\-]?\s*([ABCDF])\b/i);
  const letter = hit?.[1]?.toUpperCase();
  if (letter === "A" || letter === "B" || letter === "C" || letter === "D" || letter === "F") {
    return letter;
  }
  return "C";
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

export async function analyzeCode(input: z.infer<typeof codeReviewSchema>): Promise<AnalyzeCodeResult> {
  try {
    const validated = codeReviewSchema.parse(input);
    if (!(await isAiToolsEnabled())) {
      return { success: false, error: "AI tools are currently disabled." };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const limit = await checkLimit(user.id, "code_review");
    if (!limit.allowed) {
      return {
        success: false,
        error: "Daily limit exceeded",
        upgradeRequired: true,
      };
    }

    const focus = validated.focusAreas;
    const focusLine = `Prioritize these areas: ${focus.join(", ")}. Still mention other serious issues if you find them.`;

    const prompt = [
      `Review the following ${validated.language ?? "source"} code.`,
      focusLine,
      "Return markdown with these sections:",
      "1) Grade: one letter A/B/C/D/F",
      "2) Bugs",
      "3) Security",
      "4) Performance",
      "5) Style & best practices",
      "6) Suggested improvements",
      "",
      validated.code,
    ].join("\n");

    const result = await generateText({
      model: getModel("gemini"),
      system:
        "You are an expert senior code reviewer. Be specific and actionable. Prefer concise bullet points.",
      prompt,
      maxOutputTokens: 1800,
      temperature: 0.2,
    });

    const report = result.text;
    const grade = parseGrade(report);
    const tokensUsed = getUsedTokens(result.usage);

    await trackUsage(user.id, "code_review", tokensUsed);

    const summary = `Grade ${grade} - ${(validated.language ?? "unknown").toLowerCase()} - ${report.slice(0, 180)}`;
    await supabase.from("tool_history").insert({
      user_id: user.id,
      tool_slug: "code-review",
      summary,
    });

    return { success: true, grade, report };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Code review failed";
    return { success: false, error: message };
  }
}

export async function getReviewHistory(limit = 20): Promise<ReviewHistoryItem[]> {
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
    .eq("tool_slug", "code-review")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as ReviewHistoryItem[];
}
