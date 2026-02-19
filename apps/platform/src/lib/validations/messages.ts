import { z } from "zod/v4";

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2_000, "Message must be at most 2,000 characters"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
