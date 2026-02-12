"use client";

import { useClipboard } from "@/hooks/use-clipboard";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language: string;
  className?: string;
  maxHeight?: string;
}

export function CodeBlock({
  code,
  language,
  className,
  maxHeight = "max-h-[500px]",
}: CodeBlockProps) {
  const { copy, copied } = useClipboard();

  return (
    <div
      className={cn(
        "group relative rounded-lg border border-border bg-muted/50",
        className
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {language}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copy(code)}
          className="h-7 gap-1.5 text-xs text-muted-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </Button>
      </div>

      {/* Code content */}
      <pre
        className={cn(
          "overflow-auto p-4 font-mono text-sm leading-relaxed",
          maxHeight
        )}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
