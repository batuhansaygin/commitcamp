import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "@/lib/types/messages";

interface MessageThreadProps {
  messages: Message[];
  currentUserId: string;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MessageThread({ messages, currentUserId }: MessageThreadProps) {
  let lastDate = "";

  return (
    <div className="space-y-1 py-4">
      {messages.map((msg) => {
        const isOwn = msg.sender_id === currentUserId;
        const dateKey = new Date(msg.created_at).toDateString();
        const showDateSeparator = dateKey !== lastDate;
        lastDate = dateKey;

        return (
          <div key={msg.id}>
            {/* Date separator */}
            {showDateSeparator && (
              <div className="flex items-center justify-center py-3">
                <span className="rounded-full bg-muted px-3 py-1 text-[10px] text-muted-foreground">
                  {formatDateSeparator(msg.created_at)}
                </span>
              </div>
            )}

            {/* Message bubble */}
            <div
              className={cn(
                "flex",
                isOwn ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <div
                  className={cn(
                    "mt-1 flex items-center justify-end gap-1 text-[10px]",
                    isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}
                >
                  <span>{formatTime(msg.created_at)}</span>
                  {isOwn && (
                    msg.read_at ? (
                      <CheckCheck className="h-3 w-3" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
