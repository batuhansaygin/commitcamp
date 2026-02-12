import { z } from "zod/v4";
import { SNIPPET_LANGUAGES } from "@/lib/types/snippets";

export const createSnippetSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be at most 100 characters"),
  language: z.enum(SNIPPET_LANGUAGES, {
    error: "Please select a language",
  }),
  code: z
    .string()
    .min(1, "Code is required")
    .max(50_000, "Code must be at most 50,000 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .transform((v) => v || null),
  is_public: z.boolean().default(true),
});

export type CreateSnippetInput = z.infer<typeof createSnippetSchema>;
