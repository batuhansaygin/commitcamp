"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-white/10 bg-zinc-950">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-zinc-900 px-3 py-1.5">
        <span className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-all",
            copied
              ? "text-green-400"
              : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          {copied ? (
            <><Check className="h-3 w-3" />Copied!</>
          ) : (
            <><Copy className="h-3 w-3" />Copy</>
          )}
        </button>
      </div>
      {/* Code */}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono text-zinc-100">{code}</code>
      </pre>
    </div>
  );
}

interface AIMarkdownProps {
  content: string;
  className?: string;
}

export function AIMarkdown({ content, className }: AIMarkdownProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code({ className: cls, children, ...props }: any) {
            const match = /language-(\w+)/.exec(cls ?? "");
            const codeStr = String(children).replace(/\n$/, "");

            // Block code: has language class OR is multi-line
            if (match) {
              return <CodeBlock language={match[1]} code={codeStr} />;
            }

            // Multi-line without language tag
            if (codeStr.includes("\n")) {
              return <CodeBlock language="text" code={codeStr} />;
            }

            // Inline code
            return (
              <code
                className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre({ children }) {
            // react-markdown wraps code blocks in <pre> — return children directly
            // since CodeBlock already handles the wrapper
            return <>{children}</>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-80"
              >
                {children}
              </a>
            );
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">{children}</table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border-b border-border bg-muted/50 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border-b border-border/50 px-3 py-2 text-sm">
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
