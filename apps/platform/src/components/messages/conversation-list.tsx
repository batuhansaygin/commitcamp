import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import type { Conversation } from "@/lib/types/messages";

interface ConversationListProps {
  conversations: Conversation[];
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

export function ConversationList({ conversations }: ConversationListProps) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {conversations.map((conv) => {
        const name =
          conv.user.display_name || conv.user.username;
        const initial = name.charAt(0).toUpperCase();
        const hasUnread = conv.unread_count > 0;

        return (
          <Link
            key={conv.user.id}
            href={`/messages/${conv.user.username}`}
            className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50"
          >
            {/* Avatar */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-accent to-purple-accent text-sm font-bold text-white">
              {conv.user.avatar_url ? (
                <img
                  src={conv.user.avatar_url}
                  alt={conv.user.username}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                initial
              )}
              {hasUnread && (
                <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-blue-accent border-2 border-background" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-sm truncate ${hasUnread ? "font-semibold" : "font-medium"}`}
                >
                  {name}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {timeAgo(conv.last_message.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`text-xs truncate ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}
                >
                  {conv.last_message.is_own && (
                    <span className="text-muted-foreground">You: </span>
                  )}
                  {conv.last_message.content}
                </p>
                {hasUnread && (
                  <Badge variant="info" className="h-5 min-w-5 justify-center text-[10px] px-1.5">
                    {conv.unread_count}
                  </Badge>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
