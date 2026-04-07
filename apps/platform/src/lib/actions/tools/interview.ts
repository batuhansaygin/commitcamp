"use server";

import { z } from "zod";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { checkLimit, trackUsage } from "@/lib/actions/billing/usage";
import { parseWithSchema } from "@/lib/ai/extract-json";
import {
  CATEGORY_PROMPT,
  interviewCategories,
  type InterviewCategory,
} from "@/lib/config/interview-categories";

export type { InterviewCategory };

const askSchema = z.object({
  category: z.enum(interviewCategories),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

const evalSchema = z.object({
  category: z.enum(interviewCategories),
  difficulty: z.enum(["easy", "medium", "hard"]),
  question: z.string().min(5).max(5000),
  answer: z.string().min(3).max(10000),
});

const questionJsonSchema = z.object({
  question: z.string().min(10),
  hints: z.array(z.string()).max(6).optional().default([]),
});

const evalJsonSchema = z.object({
  score: z.coerce.number().min(0).max(100),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  detailedAnalysis: z.string().min(1),
  timeComplexity: z.string().optional(),
  spaceComplexity: z.string().optional(),
  alternativeApproaches: z.array(z.string()).optional(),
});

export interface InterviewQuestionResult {
  success: boolean;
  question?: string;
  hints?: string[];
  error?: string;
  upgradeRequired?: boolean;
}

export interface InterviewEvalStructured {
  strengths: string[];
  improvements: string[];
  detailedAnalysis: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  alternativeApproaches?: string[];
}

export interface InterviewEvalResult {
  success: boolean;
  feedback?: string;
  score?: number;
  structured?: InterviewEvalStructured;
  error?: string;
  upgradeRequired?: boolean;
}

export interface InterviewHistoryItem {
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

function clampScore(v: number) {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function formatEvalFeedback(data: z.infer<typeof evalJsonSchema>): string {
  const lines: string[] = [`Score: ${clampScore(data.score)}`, ""];
  if (data.strengths.length) {
    lines.push("Strengths:", ...data.strengths.map((s) => `• ${s}`), "");
  }
  if (data.improvements.length) {
    lines.push("Improvements:", ...data.improvements.map((s) => `• ${s}`), "");
  }
  lines.push("Analysis:", data.detailedAnalysis);
  if (data.timeComplexity) lines.push("", `Time: ${data.timeComplexity}`);
  if (data.spaceComplexity) lines.push(`Space: ${data.spaceComplexity}`);
  if (data.alternativeApproaches?.length) {
    lines.push("", "Alternatives:", ...data.alternativeApproaches.map((s) => `• ${s}`));
  }
  return lines.join("\n");
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

export async function getQuestion(input: z.infer<typeof askSchema>): Promise<InterviewQuestionResult> {
  try {
    const validated = askSchema.parse(input);
    if (!(await isAiToolsEnabled())) return { success: false, error: "AI tools are currently disabled." };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const limit = await checkLimit(user.id, "interview");
    if (!limit.allowed) return { success: false, error: "Daily limit exceeded", upgradeRequired: true };

    const topicLine = CATEGORY_PROMPT[validated.category];

    const result = await generateText({
      model: getModel("gemini"),
      system: `You are a senior technical interviewer. Return ONLY valid JSON (no markdown fences) with:
{"question": string, "hints": string[]}
The question must be realistic for the category and difficulty. Provide 2–4 progressive hints.`,
      prompt: `Category: ${topicLine}\nDifficulty: ${validated.difficulty}\n\nJSON only.`,
      maxOutputTokens: 500,
      temperature: 0.45,
    });

    await trackUsage(user.id, "interview", getUsedTokens(result.usage));

    const parsed = parseWithSchema(result.text, questionJsonSchema);
    if (parsed.ok) {
      return {
        success: true,
        question: parsed.data.question.trim(),
        hints: parsed.data.hints.length ? parsed.data.hints : undefined,
      };
    }

    const fallback = result.text.replace(/^```[\w]*\n?/i, "").replace(/\n?```$/i, "").trim();
    return { success: true, question: fallback || "Could not parse question; try again.", hints: undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to get question" };
  }
}

export async function evaluateAnswer(input: z.infer<typeof evalSchema>): Promise<InterviewEvalResult> {
  try {
    const validated = evalSchema.parse(input);
    if (!(await isAiToolsEnabled())) return { success: false, error: "AI tools are currently disabled." };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const limit = await checkLimit(user.id, "interview");
    if (!limit.allowed) return { success: false, error: "Daily limit exceeded", upgradeRequired: true };

    const topicLine = CATEGORY_PROMPT[validated.category];
    const algoExtra =
      validated.category === "algorithms"
        ? "Include timeComplexity and spaceComplexity when relevant."
        : "Omit time/space unless the answer discusses complexity.";

    const result = await generateText({
      model: getModel("gemini"),
      system: `You are a strict interviewer. Return ONLY valid JSON (no markdown) with keys:
score (0-100 number), strengths (string[]), improvements (string[]), detailedAnalysis (string),
timeComplexity (string, optional), spaceComplexity (string, optional), alternativeApproaches (string[], optional).
${algoExtra}`,
      prompt: [
        `Category: ${topicLine}`,
        `Difficulty: ${validated.difficulty}`,
        `Question: ${validated.question}`,
        `Answer: ${validated.answer}`,
        "",
        "JSON only.",
      ].join("\n"),
      maxOutputTokens: 900,
      temperature: 0.25,
    });

    await trackUsage(user.id, "interview", getUsedTokens(result.usage));

    const parsed = parseWithSchema(result.text, evalJsonSchema);
    if (parsed.ok) {
      const score = clampScore(parsed.data.score);
      const structured: InterviewEvalStructured = {
        strengths: parsed.data.strengths,
        improvements: parsed.data.improvements,
        detailedAnalysis: parsed.data.detailedAnalysis,
        timeComplexity: parsed.data.timeComplexity,
        spaceComplexity: parsed.data.spaceComplexity,
        alternativeApproaches: parsed.data.alternativeApproaches,
      };
      return {
        success: true,
        score,
        structured,
        feedback: formatEvalFeedback({ ...parsed.data, score }),
      };
    }

    const fallbackText = result.text.trim();
    const hit = fallbackText.match(/\bscore\s*[:\-]?\s*(\d{1,3})\b/i);
    const score = hit ? clampScore(Number(hit[1])) : 70;
    return {
      success: true,
      feedback: fallbackText,
      score,
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to evaluate answer" };
  }
}

export async function saveInterviewSession(summary: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase.from("tool_history").insert({
    user_id: user.id,
    tool_slug: "interview-prep",
    summary,
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function getInterviewHistory(limit = 20): Promise<InterviewHistoryItem[]> {
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
    .eq("tool_slug", "interview-prep")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as InterviewHistoryItem[];
}
