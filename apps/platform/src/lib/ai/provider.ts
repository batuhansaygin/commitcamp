import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { AI_MODELS, type AIModelKey } from "./config";

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export function getModel(modelKey: AIModelKey) {
  const model = AI_MODELS[modelKey];

  switch (model.provider) {
    case "google":
      return google(model.id);
    case "groq":
      return groqClient(model.id);
    default:
      return google(AI_MODELS.gemini.id);
  }
}
