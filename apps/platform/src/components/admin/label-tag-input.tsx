"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { listAllLabels } from "@/lib/actions/admin/tasks";
import { cn } from "@/lib/utils";

interface LabelTagInputProps {
  value: string[];
  onChange: (labels: string[]) => void;
  className?: string;
}

export function LabelTagInput({ value, onChange, className }: LabelTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allLabels, setAllLabels] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch all existing labels once on mount
  useEffect(() => {
    listAllLabels().then(setAllLabels);
  }, []);

  // Update suggestions whenever input changes
  useEffect(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const filtered = allLabels.filter(
      (l) => l.toLowerCase().includes(q) && !value.includes(l)
    );
    setSuggestions(filtered);
    setOpen(filtered.length > 0);
    setHighlightedIndex(-1);
  }, [inputValue, allLabels, value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addLabel = (label: string) => {
    const trimmed = label.trim().toLowerCase();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInputValue("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeLabel = (label: string) => {
    onChange(value.filter((l) => l !== label));
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        addLabel(suggestions[highlightedIndex]);
      } else if (inputValue.trim()) {
        addLabel(inputValue);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlightedIndex(-1);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeLabel(value[value.length - 1]);
    }
  };

  // Color mapping for labels (consistent hash-based color)
  const getLabelColor = (label: string) => {
    const colors = [
      "bg-blue-500/15 text-blue-400 border-blue-500/30",
      "bg-purple-500/15 text-purple-400 border-purple-500/30",
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      "bg-amber-500/15 text-amber-400 border-amber-500/30",
      "bg-rose-500/15 text-rose-400 border-rose-500/30",
      "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
      "bg-orange-500/15 text-orange-400 border-orange-500/30",
      "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    ];
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
      hash = (hash * 31 + label.charCodeAt(i)) % colors.length;
    }
    return colors[Math.abs(hash)];
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Tag input container */}
      <div
        className="flex min-h-[38px] flex-wrap gap-1.5 rounded-lg border border-border bg-input px-2 py-1.5 focus-within:ring-2 focus-within:ring-ring cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Existing tags */}
        {value.map((label) => (
          <span
            key={label}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none",
              getLabelColor(label)
            )}
          >
            {label}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeLabel(label); }}
              className="rounded-full opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}

        {/* Text input */}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          placeholder={value.length === 0 ? "Type a label, press Enter or , to add…" : "Add more…"}
          className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
          <div className="p-1">
            {suggestions.map((suggestion, idx) => (
              <button
                key={suggestion}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addLabel(suggestion); }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors text-left",
                  idx === highlightedIndex
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent/60"
                )}
              >
                <span
                  className={cn(
                    "rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                    getLabelColor(suggestion)
                  )}
                >
                  {suggestion}
                </span>
              </button>
            ))}
          </div>
          <div className="border-t border-border px-3 py-1.5">
            <p className="text-[10px] text-muted-foreground">
              ↑↓ navigate · Enter to select · Backspace to remove last
            </p>
          </div>
        </div>
      )}

      {/* Helper text */}
      {value.length === 0 && !inputValue && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          Press <kbd className="rounded border border-border px-1 font-mono text-[9px]">Enter</kbd> or{" "}
          <kbd className="rounded border border-border px-1 font-mono text-[9px]">,</kbd> to add a label
        </p>
      )}
    </div>
  );
}
