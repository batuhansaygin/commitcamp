export interface SearchUserResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  level: number;
  tech_stack: string[];
  followers_count: number;
}

export interface SearchPostResult {
  id: string;
  title: string;
  type: "discussion" | "showcase" | "question" | "snippet";
  tags: string[];
  created_at: string;
  author_username: string;
  author_display_name: string | null;
  author_avatar_url: string | null;
}

export interface SearchTagResult {
  tag: string;
  post_count: number;
}

export interface SearchResults {
  users: SearchUserResult[];
  posts: SearchPostResult[];
  tags: SearchTagResult[];
}

export type SearchCategory = "all" | "users" | "posts" | "tags";
