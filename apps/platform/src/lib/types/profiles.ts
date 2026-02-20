/** Profile row as stored in the database. */
export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  website: string | null;
  location: string | null;
  github_username: string | null;
  twitter_username: string | null;
  tech_stack: string[];
  role: "user" | "moderator" | "admin";
  is_verified: boolean;
  allow_private_messages: boolean;
  discord_user_id: string | null;
  discord_username: string | null;
  xp_points: number;
  level: number;
  followers_count: number;
  following_count: number;
  posts_count: number;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
  notification_preferences: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
    level_up: boolean;
  };
  email_notification_preferences: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
    level_up: boolean;
  };
  created_at: string;
  updated_at: string;
}

/** Profile with extra computed stats (snippets_count is not stored in DB). */
export interface ProfileWithStats extends Profile {
  snippets_count: number;
}
