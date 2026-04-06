"use server";

import { z } from "zod";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { checkLimit, trackUsage } from "@/lib/actions/billing/usage";
import { CODE_CONVERTER_LANGUAGES } from "@/lib/ai/config";

const schema = z.object({
  sourceLanguage: z.string().min(1).max(50),
  targetLanguage: z.string().min(1).max(50),
  code: z.string().min(10).max(50000),
});

export interface ConvertResult {
  success: boolean;
  output?: string;
  error?: string;
  upgradeRequired?: boolean;
}

export interface ConvertHistoryItem {
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

export async function convertCode(input: z.infer<typeof schema>): Promise<ConvertResult> {
  try {
    const validated = schema.parse(input);
    if (!(await isAiToolsEnabled())) return { success: false, error: "AI tools are currently disabled." };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const limit = await checkLimit(user.id, "code_convert");
    if (!limit.allowed) return { success: false, error: "Daily limit exceeded", upgradeRequired: true };

    const result = await generateText({
      model: getModel("gemini"),
      system:
        "You are an expert polyglot developer. Convert code idiomatically, keep behavior equivalent, and return code only without markdown fences.",
      prompt: `Convert this ${validated.sourceLanguage} code to ${validated.targetLanguage}:\n\n${validated.code}`,
      maxOutputTokens: 2200,
      temperature: 0.2,
    });

    await trackUsage(user.id, "code_convert", getUsedTokens(result.usage));
    await supabase.from("tool_history").insert({
      user_id: user.id,
      tool_slug: "code-converter",
      summary: `${validated.sourceLanguage} -> ${validated.targetLanguage}`,
    });

    return { success: true, output: result.text };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Code conversion failed" };
  }
}

export async function getSupportedLanguages() {
  return CODE_CONVERTER_LANGUAGES;
}

export async function getCodeConvertHistory(limit = 20): Promise<ConvertHistoryItem[]> {
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
    .eq("tool_slug", "code-converter")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as ConvertHistoryItem[];
}
