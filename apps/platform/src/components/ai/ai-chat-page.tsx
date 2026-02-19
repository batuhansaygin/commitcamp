"use client";

import { useRef, useEffect } from "react";
import {
  Bot,
  Sparkles,
  RotateCcw,
  Code2,
  Bug,
  Wand2,
  BookOpen,
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAIChat } from "@/hooks/use-ai-chat";
import { AIMessage, AIThinkingIndicator } from "@/components/ai/ai-message";
import { AIChatInput } from "@/components/ai/ai-chat-input";
import { AIModelSelector } from "@/components/ai/ai-model-selector";
import { AIUsageIndicator } from "@/components/ai/ai-usage-indicator";
import { AISuggestionChips } from "@/components/ai/ai-suggestion-chips";

const QUICK_ACTIONS = [
  {
    icon: Code2,
    label: "Code Review",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    prompt: "Please review this code for best practices, performance, and security issues:\n\n```\n// paste your code here\n```",
  },
  {
    icon: Bug,
    label: "Debug",
    color: "text-red-500",
    bg: "bg-red-500/10",
    prompt: "I'm getting this error. Help me debug it:\n\nError:\n```\n// paste error here\n```\n\nCode:\n```\n// paste relevant code\n```",
  },
  {
    icon: Wand2,
    label: "Generate",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    prompt: "Write a function that:\n\n",
  },
  {
    icon: BookOpen,
    label: "Explain",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    prompt: "Explain this code step by step:\n\n```\n// paste your code here\n```",
  },
  {
    icon: ArrowRightLeft,
    label: "Convert",
    color: "text-green-500",
    bg: "bg-green-500/10",
    prompt: "Convert this code from JavaScript to TypeScript:\n\n```javascript\n// paste your code here\n```",
  },
];

export function AIChatPage() {
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hasMessages = messages.length > 0;
  const isLimitReached = dailyUsage >= maxDailyUsage;

  return (
    <div className="flex h-full gap-6">
      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside className="hidden w-64 shrink-0 flex-col gap-4 lg:flex">
        {/* Model selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Model
          </p>
          <AIModelSelector
            modelKey={modelKey}
            onChange={setModelKey}
          />
        </div>

        {/* Quick actions */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </p>
          <div className="flex flex-col gap-1">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => setInput(action.prompt)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-all hover:bg-muted/60 active:scale-[0.98]"
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                    action.bg
                  )}
                >
                  <action.icon className={cn("h-3.5 w-3.5", action.color)} />
                </div>
                <span className="font-medium text-sm">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Usage */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Daily Usage
          </p>
          <AIUsageIndicator
            used={dailyUsage}
            total={maxDailyUsage}
            modelKey={modelKey}
          />
        </div>
      </aside>

      {/* ── Main chat area ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border/60">
        {/* Chat header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-none">CommitCamp AI</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Expert coding assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile model selector */}
            <div className="lg:hidden">
              <AIModelSelector
                modelKey={modelKey}
                onChange={setModelKey}
                compact
              />
            </div>
            {hasMessages && (
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-border hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                New Chat
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center min-h-full gap-6 text-center px-4 py-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20">
                <Bot className="h-10 w-10 text-violet-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">How can I help you code today?</h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
                  I can write code, explain concepts, debug errors, review code, and convert between languages.
                </p>
              </div>
              <AISuggestionChips
                onSelect={(prompt) => setInput(prompt)}
                className="max-w-lg justify-center"
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
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <AIThinkingIndicator />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-border/60 bg-muted/10 p-4 space-y-3">
          {/* Mobile usage */}
          <div className="flex items-center justify-between lg:hidden">
            <AIUsageIndicator
              used={dailyUsage}
              total={maxDailyUsage}
              modelKey={modelKey}
              compact
            />
          </div>
          <AIChatInput
            input={input}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onStop={stop}
            isLoading={isLoading}
            placeholder="Ask me anything about code..."
            disabled={isLimitReached}
          />
        </div>
      </div>
    </div>
  );
}
