/** Profile row as stored in the database. */
export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: "user" | "moderator" | "admin";
  created_at: string;
  updated_at: string;
}

/** Profile with follower/following counts and user's content stats. */
export interface ProfileWithStats extends Profile {
  followers_count: number;
  following_count: number;
  snippets_count: number;
  posts_count: number;
}
