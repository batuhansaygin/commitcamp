import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/layout/back-button";
import { Home, Terminal } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-4 text-center">
      {/* Code terminal illustration */}
      <div className="w-full max-w-sm rounded-xl border border-border bg-zinc-950 dark:bg-black/60 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-border/60 bg-zinc-900 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
          <div className="flex items-center gap-1.5 ml-3 text-[10px] text-zinc-500">
            <Terminal className="h-3 w-3" />
            bash
          </div>
        </div>
        <div className="px-5 py-4 font-mono text-sm text-left space-y-1">
          <p>
            <span className="text-emerald-400">→</span>{" "}
            <span className="text-zinc-400">GET</span>{" "}
            <span className="text-red-400 line-through opacity-70">/unknown-path</span>
          </p>
          <p>
            <span className="text-red-400">✗</span>{" "}
            <span className="text-red-300 font-semibold">404 Not Found</span>
          </p>
          <p className="text-zinc-600 text-xs">
            Error: The requested resource does not exist.
          </p>
          <div className="mt-3 flex items-center gap-1">
            <span className="text-emerald-400">→</span>
            <span className="text-zinc-300 animate-pulse">_</span>
          </div>
        </div>
      </div>

      {/* 404 headline */}
      <div>
        <p className="text-7xl font-black tracking-tighter gradient-text md:text-8xl">
          404
        </p>
        <h1 className="mt-2 text-xl font-bold text-foreground md:text-2xl">
          Page not found
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xs mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/feed">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Go to Feed
          </Button>
        </Link>
        <BackButton />
      </div>
    </div>
  );
}
