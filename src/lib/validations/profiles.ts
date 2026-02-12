import { z } from "zod/v4";

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-z0-9_-]+$/,
      "Username can only contain lowercase letters, numbers, hyphens, and underscores"
    ),
  display_name: z
    .string()
    .max(50, "Display name must be at most 50 characters")
    .optional()
    .transform((v) => v || null),
  bio: z
    .string()
    .max(300, "Bio must be at most 300 characters")
    .optional()
    .transform((v) => v || null),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
