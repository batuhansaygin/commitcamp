"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Zap, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { AI_MODELS, type AIModelKey } from "@/lib/ai/config";

interface AIModelSelectorProps {
  modelKey: AIModelKey;
  onChange: (key: AIModelKey) => void;
  compact?: boolean;
}

const MODEL_ICONS: Record<AIModelKey, typeof Zap> = {
  gemini: Zap,
  groq: Cpu,
};

export function AIModelSelector({
  modelKey,
  onChange,
  compact = false,
}: AIModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = AI_MODELS[modelKey];
  const Icon = MODEL_ICONS[modelKey];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/40 text-xs font-medium text-muted-foreground transition-all hover:border-border hover:text-foreground",
          compact ? "px-2 py-1" : "px-3 py-1.5"
        )}
      >
        <Icon className="h-3 w-3 shrink-0" />
        {!compact && (
          <span className="whitespace-nowrap">{current.name}</span>
        )}
        {compact && (
          <span className="hidden whitespace-nowrap sm:inline">
            {current.name}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
          {(Object.entries(AI_MODELS) as [AIModelKey, typeof AI_MODELS.gemini][]).map(
            ([key, model]) => {
              const ModelIcon = MODEL_ICONS[key];
              const isSelected = key === modelKey;
              return (
                <button
                  key={key}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                    isSelected && "bg-primary/5"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <ModelIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-xs font-semibold",
                        isSelected ? "text-primary" : "text-foreground"
                      )}
                    >
                      {model.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-snug">
                      {model.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary mt-2" />
                  )}
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
