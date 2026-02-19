"use client";

import {
  useRef,
  useEffect,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Send, Code, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PROGRAMMING_LANGUAGES = [
  "typescript", "javascript", "python", "rust", "go", "java", "c", "cpp",
  "csharp", "php", "ruby", "swift", "kotlin", "sql", "bash", "html", "css",
  "json", "yaml", "markdown", "text",
];

interface AttachCodeModalProps {
  onAdd: (code: string, language: string) => void;
  onClose: () => void;
}

function AttachCodeModal({ onAdd, onClose }: AttachCodeModalProps) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");

  const handleAdd = () => {
    if (!code.trim()) return;
    onAdd(code.trim(), language);
    onClose();
  };

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-semibold">Attach Code</span>
        <button onClick={onClose} className="rounded p-0.5 hover:bg-muted">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-3 space-y-2">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {PROGRAMMING_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your code here..."
          className="h-40 w-full resize-none rounded-lg border border-border bg-zinc-950 p-2.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
        />
        <button
          onClick={handleAdd}
          disabled={!code.trim()}
          className="w-full rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          Add to Message
        </button>
      </div>
    </div>
  );
}

interface AIChatInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onStop?: () => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function AIChatInput({
  input,
  onInputChange,
  onSubmit,
  onStop,
  isLoading,
  placeholder = "Ask me anything about code...",
  disabled = false,
}: AIChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const MAX_CHARS = 4000;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        formRef.current?.requestSubmit();
      }
    }
  };

  const handleAttachCode = (code: string, language: string) => {
    const codeBlock = `\n\`\`\`${language}\n${code}\n\`\`\`\n`;
    // Synthesize a change event to append to existing input
    const fakeEvent = {
      target: {
        value: input + codeBlock,
      },
    } as React.ChangeEvent<HTMLTextAreaElement>;
    onInputChange(fakeEvent);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const isNearLimit = input.length > MAX_CHARS * 0.8;
  const isAtLimit = input.length >= MAX_CHARS;

  return (
    <form ref={formRef} onSubmit={onSubmit} className="relative">
      {showCodeModal && (
        <AttachCodeModal
          onAdd={handleAttachCode}
          onClose={() => setShowCodeModal(false)}
        />
      )}

      <div
        className={cn(
          "flex flex-col gap-2 rounded-2xl border border-border/80 bg-background/80 backdrop-blur-sm px-3 py-2.5 transition-all",
          "focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
        )}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={MAX_CHARS}
          disabled={disabled}
          rows={1}
          className="max-h-[200px] min-h-[24px] w-full resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />

        {/* Action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowCodeModal((v) => !v)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all",
                showCodeModal
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Code className="h-3 w-3" />
              <span className="hidden sm:inline">Attach Code</span>
            </button>

            {isNearLimit && (
              <span
                className={cn(
                  "text-[10px] tabular-nums",
                  isAtLimit ? "text-red-500" : "text-orange-500"
                )}
              >
                {input.length}/{MAX_CHARS}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="hidden text-[10px] text-muted-foreground/50 sm:inline">
              Shift+Enter for newline
            </span>
            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-500 transition-colors hover:bg-red-500/20"
              >
                <span className="h-2.5 w-2.5 rounded-sm bg-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || disabled}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                  input.trim() && !disabled
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                    : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                )}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
