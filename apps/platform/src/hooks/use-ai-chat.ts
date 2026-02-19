"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { AIModelKey } from "@/lib/ai/config";
import { RATE_LIMIT } from "@/lib/ai/config";

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export function useAIChat() {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modelKey, setModelKey] = useState<AIModelKey>("gemini");
  const [dailyUsage, setDailyUsage] = useState(0);
  const [usageLoaded, setUsageLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/chat/usage");
      if (res.ok) {
        const data = (await res.json()) as { used: number };
        setDailyUsage(data.used);
      }
    } catch {
      // Non-critical
    } finally {
      setUsageLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;
      setError(null);

      const userMsg: AIChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        createdAt: new Date(),
      };

      const aiMsg: AIChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsLoading(true);

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            modelKey,
          }),
          signal: abortController.signal,
        });

        if (response.status === 429) {
          const data = (await response.json()) as { error: string };
          throw new Error(data.error ?? "Rate limit exceeded.");
        }

        if (!response.ok) {
          throw new Error(`AI request failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body.");

        const decoder = new TextDecoder();
        let done = false;
        let receivedContent = false;

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            if (chunk.trim()) receivedContent = true;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: last.content + chunk },
                ];
              }
              return prev;
            });
          }
        }

        if (!receivedContent) {
          // Stream completed with no content — AI model likely failed silently
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && !last.content.trim()) {
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  content:
                    "Sorry, I couldn't generate a response. The AI model may be temporarily unavailable. Please try again or switch models.",
                },
              ];
            }
            return prev;
          });
          setError(new Error("No response received."));
        } else {
          setDailyUsage((prev) => prev + 1);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const errMsg = err instanceof Error ? err : new Error("Unknown error");
          setError(errMsg);
          // Remove empty AI message on error
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.content === "") {
              return prev.slice(0, -1);
            }
            return prev;
          });
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [messages, modelKey, isLoading]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const content = input.trim();
      if (!content) return;
      setInput("");
      await sendMessage(content);
    },
    [input, sendMessage]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    error,
    setMessages,
    setInput,
    modelKey,
    setModelKey,
    dailyUsage,
    maxDailyUsage: RATE_LIMIT.maxRequestsPerUser,
    usageLoaded,
    fetchUsage,
  };
}
