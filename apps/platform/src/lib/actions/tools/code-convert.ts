"use server";

import { z } from "zod";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { checkLimit, trackUsage } from "@/lib/actions/billing/usage";
import { CODE_CONVERTER_LANGUAGES } from "@/lib/ai/config";
import { parseWithSchema } from "@/lib/ai/extract-json";

const schema = z.object({
  sourceLanguage: z.string().min(1).max(50),
  targetLanguage: z.string().min(1).max(50),
  code: z.string().min(10).max(50000),
  preserveComments: z.boolean().default(true),
});

const convertOutputSchema = z.object({
  code: z.string(),
  notes: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).optional(),
});

export interface ConvertResult {
  success: boolean;
  output?: string;
  notes?: string[];
  warnings?: string[];
  dependencies?: string[];
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

    const commentHint = validated.preserveComments
      ? "Preserve meaningful comments (translate if needed)."
      : "Omit comments in the output unless essential for understanding.";

    const result = await generateText({
      model: getModel("gemini"),
      system: `You are an expert polyglot developer. Convert idiomatically with behavior parity.
Return ONLY a single JSON object (no markdown fences) with keys:
- "code": string — the full converted source
- "notes": string[] — short conversion decisions
- "warnings": string[] — behavioral or API caveats
- "dependencies": string[] — optional npm/pip/cargo package names if relevant
${commentHint}`,
      prompt: `Convert this ${validated.sourceLanguage} code to ${validated.targetLanguage}:\n\n${validated.code}`,
      maxOutputTokens: 2800,
      temperature: 0.2,
    });

    await trackUsage(user.id, "code_convert", getUsedTokens(result.usage));

    const parsed = parseWithSchema(result.text, convertOutputSchema);
    let output: string;
    let notes: string[] | undefined;
    let warnings: string[] | undefined;
    let dependencies: string[] | undefined;

    if (parsed.ok) {
      output = parsed.data.code.trim();
      notes = parsed.data.notes.length ? parsed.data.notes : undefined;
      warnings = parsed.data.warnings.length ? parsed.data.warnings : undefined;
      dependencies =
        parsed.data.dependencies && parsed.data.dependencies.length > 0
          ? parsed.data.dependencies
          : undefined;
    } else {
      output = result.text.replace(/^```[\w]*\n?/i, "").replace(/\n?```$/i, "").trim();
      warnings = ["Model did not return valid JSON; showing raw output as code."];
    }

    await supabase.from("tool_history").insert({
      user_id: user.id,
      tool_slug: "code-converter",
      summary: `${validated.sourceLanguage} → ${validated.targetLanguage}`,
    });

    return { success: true, output, notes, warnings, dependencies };
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
