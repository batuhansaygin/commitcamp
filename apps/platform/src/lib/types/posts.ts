/** Post types available in the forum. */
export const POST_TYPES = ["discussion", "question", "showcase"] as const;
export type PostType = (typeof POST_TYPES)[number];

/** Post row as stored in the database. */
export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: PostType;
  tags: string[];
  is_solved: boolean;
  created_at: string;
  updated_at: string;
}

/** Post joined with the author's profile data. */
export interface PostWithAuthor extends Post {
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    level: number;
  } | null;
}

/** Comment row as stored in the database. */
export interface Comment {
  id: string;
  user_id: string;
  target_type: "snippet" | "post";
  target_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
}

/** Comment joined with the author's profile data. */
export interface CommentWithAuthor extends Comment {
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    level: number;
  } | null;
}
