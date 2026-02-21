import { z } from "zod/v4";
import { POST_TYPES } from "@/lib/types/posts";

export const createPostSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(150, "Title must be at most 150 characters"),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(10_000, "Content must be at most 10,000 characters"),
  type: z.enum(POST_TYPES, {
    error: "Please select a post type",
  }),
  tags: z
    .string()
    .max(200, "Tags must be at most 200 characters")
    .optional()
    .transform((v) =>
      v
        ? v
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 5)
        : []
    ),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2_000, "Comment must be at most 2,000 characters"),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = createCommentSchema;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
