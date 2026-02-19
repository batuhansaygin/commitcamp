export type NotificationType =
  | "like"
  | "comment"
  | "follow"
  | "level_up"
  | "achievement";

/** Notification row as stored in the database, with optional joined fields. */
export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: NotificationType;
  post_id: string | null;
  comment_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  /** Joined: the user who triggered the action */
  actor?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    level: number;
  } | null;
  /** Joined: the post the action was performed on */
  post?: {
    title: string;
    type: string;
  } | null;
}

/** Input shape for creating a notification. */
export interface CreateNotificationInput {
  user_id: string;
  actor_id?: string | null;
  type: NotificationType;
  post_id?: string | null;
  comment_id?: string | null;
  message: string;
}
