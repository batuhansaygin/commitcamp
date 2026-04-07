import { z } from "zod";

/**
 * Pulls the first JSON object from model output (handles ```json fences and trailing text).
 */
export function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced?.[1] ?? trimmed).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error("No JSON object found in model output");
  }
  return JSON.parse(body.slice(start, end + 1)) as unknown;
}

/**
 * Pulls the first JSON array from model output (handles ```json fences).
 */
export function extractJsonArray(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced?.[1] ?? trimmed).trim();
  const start = body.indexOf("[");
  const end = body.lastIndexOf("]");
  if (start === -1 || end <= start) {
    throw new Error("No JSON array found in model output");
  }
  return JSON.parse(body.slice(start, end + 1)) as unknown;
}

export function parseWithSchema<T extends z.ZodType>(
  raw: string,
  schema: T
): { ok: true; data: z.infer<T> } | { ok: false; error: string } {
  try {
    const json = extractJsonObject(raw);
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid JSON shape" };
    }
    return { ok: true, data: parsed.data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to parse JSON",
    };
  }
}
