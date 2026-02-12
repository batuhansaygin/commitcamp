/** Snippet row as stored in the database. */
export interface Snippet {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  language: string;
  code: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/** Snippet joined with the author's profile data. */
export interface SnippetWithAuthor extends Snippet {
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

/** Supported programming languages for the snippet language selector. */
export const SNIPPET_LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "rust",
  "go",
  "java",
  "csharp",
  "cpp",
  "c",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "dart",
  "sql",
  "html",
  "css",
  "bash",
  "json",
  "yaml",
  "markdown",
  "other",
] as const;

export type SnippetLanguage = (typeof SNIPPET_LANGUAGES)[number];
