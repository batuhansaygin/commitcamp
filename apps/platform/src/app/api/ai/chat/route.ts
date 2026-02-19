import { streamText } from "ai";
import { getModel } from "@/lib/ai/provider";
import { SYSTEM_PROMPT, AI_MODELS, type AIModelKey } from "@/lib/ai/config";
import { checkRateLimit } from "@/lib/ai/rate-limiter";
import { createClient } from "@/lib/supabase/server";

type SimpleMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Wrap a text stream so any error is forwarded as a final error chunk. */
function textStreamWithErrorFallback(
  textStream: AsyncIterable<string>
): ReadableStream<string> {
  return new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of textStream) {
          controller.enqueue(chunk);
        }
        controller.close();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Unknown error from AI model.";
        console.error("[AI stream error]", msg);
        controller.enqueue(
          `\n\n⚠️ The AI model returned an error: ${msg}. Please try again or switch models.`
        );
        controller.close();
      }
    },
  });
}

export async function POST(req: Request) {
  // Authenticate
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Rate limit
  const rateCheck = checkRateLimit(user.id);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: rateCheck.reason }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse body
  const { messages, modelKey = "gemini" } = (await req.json()) as {
    messages: SimpleMessage[];
    modelKey?: AIModelKey;
  };

  const safeModelKey: AIModelKey =
    modelKey in AI_MODELS ? modelKey : "gemini";

  async function tryStream(key: AIModelKey): Promise<Response> {
    const model = getModel(key);
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages,
      maxOutputTokens: AI_MODELS[key].maxTokens,
      temperature: 0.7,
    });

    const safeStream = textStreamWithErrorFallback(result.textStream);
    return new Response(safeStream as unknown as BodyInit, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  try {
    return await tryStream(safeModelKey);
  } catch {
    const fallback: AIModelKey = safeModelKey === "gemini" ? "groq" : "gemini";
    try {
      return await tryStream(fallback);
    } catch (err) {
      console.error("Both AI models failed at init:", err);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
  }
}
