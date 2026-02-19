"use client";

import { useRef, useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { Bot, X, Minimize2, Sparkles, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAIChat } from "@/hooks/use-ai-chat";
import { AIMessage, AIThinkingIndicator } from "@/components/ai/ai-message";
import { AIChatInput } from "@/components/ai/ai-chat-input";
import { AIModelSelector } from "@/components/ai/ai-model-selector";
import { AIUsageIndicator } from "@/components/ai/ai-usage-indicator";
import { AISuggestionChips } from "@/components/ai/ai-suggestion-chips";

export function AIChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    setInput,
    setMessages,
    modelKey,
    setModelKey,
    dailyUsage,
    maxDailyUsage,
  } = useAIChat();

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Don't render on the AI assistant page (after all hooks)
  if (pathname === "/ai-assistant") return null;

  const hasMessages = messages.length > 0;
  const isLimitReached = dailyUsage >= maxDailyUsage;

  return (
    <>
      {/* Floating button */}
      {(!isOpen || isMinimized) && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className={cn(
            "fixed bottom-20 right-4 z-50 md:bottom-6",
            "flex h-14 w-14 items-center justify-center rounded-full",
            "bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg",
            "transition-all hover:scale-110 active:scale-95",
            !hasMessages && "animate-pulse"
          )}
          aria-label="Open AI Assistant"
        >
          <Bot className="h-6 w-6" />
          {hasMessages && (
            <div className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {messages.length}
            </div>
          )}
        </button>
      )}

      {/* Chat panel */}
      {isOpen && !isMinimized && (
        <div
          className={cn(
            "fixed bottom-20 right-4 z-50 md:bottom-6",
            "flex h-[60vh] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl",
            "md:h-[520px] md:w-[400px]",
            "animate-in slide-in-from-bottom-4 fade-in duration-200"
          )}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold">CommitCamp AI</span>
            </div>
            <div className="flex items-center gap-1">
              <AIModelSelector
                modelKey={modelKey}
                onChange={setModelKey}
                compact
              />
              <button
                onClick={() => setIsMinimized(true)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Minimize"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth">
            {!hasMessages ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
                  <Bot className="h-7 w-7 text-violet-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">How can I help you code today?</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Write code, debug errors, review code, or explain concepts.
                  </p>
                </div>
                <AISuggestionChips
                  onSelect={(prompt) => {
                    setInput(prompt);
                  }}
                />
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <AIMessage
                    key={msg.id}
                    message={msg}
                    isLast={i === messages.length - 1}
                    isStreaming={isLoading && i === messages.length - 1}
                  />
                ))}
                {isLoading &&
                  messages[messages.length - 1]?.role === "user" && (
                    <AIThinkingIndicator />
                  )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-border/60 bg-muted/20 p-2.5 space-y-2">
            <AIUsageIndicator
              used={dailyUsage}
              total={maxDailyUsage}
              modelKey={modelKey}
              compact
            />
            <AIChatInput
              input={input}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onStop={stop}
              isLoading={isLoading}
              disabled={isLimitReached}
            />
            {hasMessages && (
              <button
                onClick={() => setMessages([])}
                className="w-full text-center text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <MessageSquare className="inline h-2.5 w-2.5 mr-1" />
                Clear chat
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
