import { cn } from "@/lib/utils";
import { AIMarkdown } from "@/components/ai/ai-markdown";
import { Bot, User } from "lucide-react";
import type { AIChatMessage } from "@/hooks/use-ai-chat";

interface AIMessageProps {
  message: AIChatMessage;
  isLast?: boolean;
  isStreaming?: boolean;
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AIMessage({ message, isLast, isStreaming }: AIMessageProps) {
  const isUser = message.role === "user";
  const isError =
    !isUser &&
    (message.content.startsWith("Sorry, I couldn't") ||
      message.content.includes("⚠️"));

  return (
    <div
      className={cn(
        "group flex items-start gap-2.5 px-1",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-br from-violet-500 to-cyan-500 text-white"
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : isError
                ? "rounded-tl-sm border border-destructive/40 bg-destructive/10 text-destructive"
                : "rounded-tl-sm border border-border/60 bg-muted/60"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <AIMarkdown content={message.content} />
          )}

          {/* Streaming cursor */}
          {isStreaming && isLast && !isUser && message.content.length > 0 && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current opacity-70" />
          )}
        </div>

        {/* Timestamp */}
        <span
          className="text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          title={message.createdAt.toLocaleString()}
        >
          {timeAgo(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

/** Animated dots while AI is thinking (before first token arrives) */
export function AIThinkingIndicator() {
  return (
    <div className="flex items-start gap-2.5 px-1">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-border/60 bg-muted/60 px-4 py-3">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
