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
    .max(500, "Bio must be at most 500 characters")
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
    .transform((v) => v || null),
  github_username: z
    .string()
    .max(39, "GitHub username must be at most 39 characters")
    .optional()
    .transform((v) => v || null),
  twitter_username: z
    .string()
    .max(50, "Twitter username must be at most 50 characters")
    .optional()
    .transform((v) => v || null),
  tech_stack: z
    .array(z.string().max(50))
    .max(20, "You can add at most 20 technologies")
    .optional()
    .transform((v) => v ?? []),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
