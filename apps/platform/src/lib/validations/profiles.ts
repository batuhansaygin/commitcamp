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
  location: z
    .string()
    .max(100, "Location must be at most 100 characters")
    .optional()
    .transform((v) => v || null),
  website: z
    .string()
    .max(200, "Website URL must be at most 200 characters")
    .optional()
    .transform((v) => {
      if (!v) return null;
      if (v && !v.startsWith("http://") && !v.startsWith("https://")) {
        return `https://${v}`;
      }
      return v;
    }),
  github_username: z
    .string()
    .max(39, "GitHub username must be at most 39 characters")
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$|^$/,
      "Invalid GitHub username format"
    )
    .optional()
    .transform((v) => v || null),
  twitter_username: z
    .string()
    .max(15, "Twitter username must be at most 15 characters")
    .regex(
      /^[a-zA-Z0-9_]*$/,
      "Twitter username can only contain letters, numbers, and underscores"
    )
    .optional()
    .transform((v) => v || null),
  avatar_url: z
    .string()
    .max(500, "Avatar URL must be at most 500 characters")
    .optional()
    .transform((v) => v || null),
  cover_url: z
    .string()
    .max(500, "Cover URL must be at most 500 characters")
    .optional()
    .transform((v) => v || null),
  tech_stack: z
    .array(z.string().max(30))
    .max(20, "You can add at most 20 technologies")
    .optional()
    .transform((v) => v ?? []),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
