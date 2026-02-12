/** Message row as stored in the database. */
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

/** A conversation summary for the inbox view. */
export interface Conversation {
  /** The other user's profile. */
  user: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  /** The latest message in this conversation. */
  last_message: {
    content: string;
    created_at: string;
    is_own: boolean;
  };
  /** Number of unread messages from the other user. */
  unread_count: number;
}
