"use server";

import { z } from "zod";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { checkLimit, trackUsage } from "@/lib/actions/billing/usage";

const askSchema = z.object({
  topic: z.string().min(2).max(80),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

const evalSchema = z.object({
  topic: z.string().min(2).max(80),
  difficulty: z.enum(["easy", "medium", "hard"]),
  question: z.string().min(5).max(5000),
  answer: z.string().min(3).max(10000),
});

export interface InterviewQuestionResult {
  success: boolean;
  question?: string;
  error?: string;
  upgradeRequired?: boolean;
}

export interface InterviewEvalResult {
  success: boolean;
  feedback?: string;
  score?: number;
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

function parseScore(feedback: string): number {
  const hit = feedback.match(/\bscore\s*[:\-]?\s*(\d{1,3})\b/i);
  if (!hit) return 70;
  return clampScore(Number(hit[1]));
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

    const result = await generateText({
      model: getModel("gemini"),
      system:
        "You are a technical interviewer. Ask exactly one concise interview question.",
      prompt: `Topic: ${validated.topic}\nDifficulty: ${validated.difficulty}\nAsk one question only.`,
      maxOutputTokens: 220,
      temperature: 0.5,
    });

    await trackUsage(user.id, "interview", getUsedTokens(result.usage));
    return { success: true, question: result.text.trim() };
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

    const result = await generateText({
      model: getModel("gemini"),
      system:
        "You are a strict interviewer. Provide short feedback and include 'Score: X' where X is 0-100.",
      prompt: [
        `Topic: ${validated.topic}`,
        `Difficulty: ${validated.difficulty}`,
        `Question: ${validated.question}`,
        `Candidate answer: ${validated.answer}`,
        "",
        "Return: strengths, weaknesses, and one improvement hint.",
      ].join("\n"),
      maxOutputTokens: 520,
      temperature: 0.3,
    });

    await trackUsage(user.id, "interview", getUsedTokens(result.usage));
    const feedback = result.text;
    const score = parseScore(feedback);
    return { success: true, feedback, score };
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
