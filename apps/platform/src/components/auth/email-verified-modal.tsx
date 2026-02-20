"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const REDIRECT_DELAY_MS = 4000;

export function EmailVerifiedModal() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(
    Math.ceil(REDIRECT_DELAY_MS / 1000)
  );
  const [visible, setVisible] = useState(false);

  // Fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Countdown + auto-redirect
  useEffect(() => {
    if (countdown <= 0) {
      router.push("/feed");
      router.refresh();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  const handleEnter = () => {
    router.push("/feed");
    router.refresh();
  };

  // Progress bar width (fills as countdown decreases)
  const progressPct = ((REDIRECT_DELAY_MS / 1000 - countdown) / (REDIRECT_DELAY_MS / 1000)) * 100;

  return (
    <div
      className={cn(
        "relative w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl",
        "transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
    >
      {/* Animated progress bar at the very top */}
      <div className="h-1 w-full bg-muted/40">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex flex-col items-center gap-6 px-8 py-10 text-center">
        {/* Animated success icon */}
        <div className="relative">
          <div className="absolute -inset-3 rounded-full bg-green-500/10 animate-ping" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400/20 to-emerald-500/20 border border-green-500/30">
            <CheckCircle2 className="h-10 w-10 text-green-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <h1 className="text-2xl font-bold tracking-tight">
              Account Activated!
            </h1>
            <Sparkles className="h-4 w-4 text-yellow-400" />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your email has been verified and your CommitCamp account is ready.
            Welcome to the community!
          </p>
        </div>

        {/* Feature highlights */}
        <ul className="w-full space-y-2 text-left">
          {[
            "Share code snippets with the community",
            "Join forum discussions & help others",
            "Earn XP, levels and achievements",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button
          onClick={handleEnter}
          className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white border-0"
          size="lg"
        >
          Enter CommitCamp
          <ArrowRight className="h-4 w-4" />
        </Button>

        {/* Countdown hint */}
        <p className="text-xs text-muted-foreground/70">
          Redirecting automatically in{" "}
          <span className="font-semibold text-foreground">{countdown}s</span>
          …
        </p>
      </div>
    </div>
  );
}
