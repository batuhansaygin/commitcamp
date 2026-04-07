"use server";

import { z } from "zod";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getModel } from "@/lib/ai/provider";
import { checkLimit, trackUsage } from "@/lib/actions/billing/usage";

const schema = z.object({
  projectName: z.string().min(2).max(120),
  language: z.string().min(1).max(40).default("TypeScript"),
  input: z.string().min(10).max(50000),
  includeInstallation: z.boolean().default(true),
  includeUsageExamples: z.boolean().default(true),
  includeApiDocs: z.boolean().default(false),
});

export interface ReadmeResult {
  success: boolean;
  markdown?: string;
  error?: string;
  upgradeRequired?: boolean;
}

export interface ReadmeHistoryItem {
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

export async function generateReadme(input: z.infer<typeof schema>): Promise<ReadmeResult> {
  try {
    const validated = schema.parse(input);
    if (!(await isAiToolsEnabled())) return { success: false, error: "AI tools are currently disabled." };

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const limit = await checkLimit(user.id, "readme_gen");
    if (!limit.allowed) return { success: false, error: "Daily limit exceeded", upgradeRequired: true };

    const sections: string[] = [
      "Badges (shields.io style where appropriate)",
      "Title & description",
      "Features",
    ];
    if (validated.includeInstallation) sections.push("Installation");
    if (validated.includeUsageExamples) sections.push("Usage (with code blocks)");
    if (validated.includeApiDocs) sections.push("API documentation");
    sections.push("Contributing", "License (MIT unless context suggests otherwise)");

    const result = await generateText({
      model: getModel("gemini"),
      system:
        "You are an expert technical writer. Output clean, professional GitHub-flavored markdown only. No preamble or closing chit-chat.",
      prompt: `Project name: ${validated.projectName}\nPrimary language/stack: ${validated.language}\n\nInclude these sections (use ## headings): ${sections.join("; ")}.\n\nProject context / code / notes:\n${validated.input}`,
      maxOutputTokens: 2000,
      temperature: 0.3,
    });

    await trackUsage(user.id, "readme_gen", getUsedTokens(result.usage));

    await supabase.from("tool_history").insert({
      user_id: user.id,
      tool_slug: "readme-generator",
      summary: `README generated - ${validated.projectName}`,
    });

    return { success: true, markdown: result.text };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "README generation failed" };
  }
}

export async function getReadmeHistory(limit = 20): Promise<ReadmeHistoryItem[]> {
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
    .eq("tool_slug", "readme-generator")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as ReadmeHistoryItem[];
}
