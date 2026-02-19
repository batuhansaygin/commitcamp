import { streamText } from "ai";
import { getModel } from "@/lib/ai/provider";
import { SYSTEM_PROMPT, AI_MODELS, type AIModelKey } from "@/lib/ai/config";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { createClient } from "@/lib/supabase/server";

type SimpleMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Error response helper */
function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function tryStream(
  key: AIModelKey,
  messages: SimpleMessage[]
): Promise<Response> {
  const model = getModel(key);

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages,
    maxOutputTokens: AI_MODELS[key].maxTokens,
    temperature: 0.7,
    // Log stream-level errors server-side only
    onError: ({ error }) => {
      console.error(`[AI stream error — ${key}]`, error);
    },
  });

  // toTextStreamResponse() correctly pipes through TextEncoderStream
  // so the client receives valid Uint8Array chunks (not raw strings)
  return result.toTextStreamResponse();
}

export async function POST(req: Request) {
  // Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorResponse("Unauthorized", 401);

  // Rate limit
  const rateCheck = checkRateLimit(user.id);
  if (!rateCheck.allowed) {
    return errorResponse(rateCheck.reason ?? "Rate limit exceeded.", 429);
  }

  // Parse body
  let messages: SimpleMessage[];
  let modelKey: AIModelKey;

  try {
    const body = (await req.json()) as {
      messages: SimpleMessage[];
      modelKey?: AIModelKey;
    };
    messages = body.messages ?? [];
    modelKey = body.modelKey && body.modelKey in AI_MODELS ? body.modelKey : "gemini";
  } catch {
    return errorResponse("Invalid request body.", 400);
  }

  if (!messages.length) {
    return errorResponse("No messages provided.", 400);
  }

  // Try primary model, fall back to secondary
  try {
    return await tryStream(modelKey, messages);
  } catch (primaryErr) {
    console.error(`[AI init error — ${modelKey}]`, primaryErr);

    const fallback: AIModelKey = modelKey === "gemini" ? "groq" : "gemini";
    try {
      return await tryStream(fallback, messages);
    } catch (fallbackErr) {
      console.error(`[AI init error — ${fallback}]`, fallbackErr);
      return errorResponse(
        "Both AI models are currently unavailable. Please try again later.",
        503
      );
    }
  }
}
