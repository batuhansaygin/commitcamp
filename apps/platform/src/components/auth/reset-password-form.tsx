"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { Loader2, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let resolved = false;

    const resolve = (ok: boolean) => {
      if (resolved) return;
      resolved = true;
      if (ok) {
        setSessionReady(true);
        window.history.replaceState({}, "", "/reset-password");
      } else {
        setSessionError(true);
      }
    };

    // Listen for PASSWORD_RECOVERY event (handles hash-based implicit flow)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent) => {
        if (event === "PASSWORD_RECOVERY") {
          resolve(true);
        }
      }
    );

    const init = async () => {
      // PKCE flow: URL has ?code=...
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        resolve(!error);
        return;
      }

      // Check if there's already a valid session (user navigated back)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        resolve(true);
        return;
      }

      // Wait for onAuthStateChange to handle hash-based tokens (up to 4s)
      setTimeout(() => resolve(false), 4000);
    };

    init();

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);

    setTimeout(() => {
      router.push("/feed");
    }, 2500);
  };

  if (sessionError) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Link expired or invalid</h2>
            <p className="text-sm text-muted-foreground">
              This password reset link is no longer valid. Please request a new one.
            </p>
          </div>
          <Link href="/forgot-password">
            <Button variant="outline" size="sm">
              Request new link
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-7 w-7 text-green-500" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Password updated!</h2>
            <p className="text-sm text-muted-foreground">
              Your password has been changed. Redirecting you to your feed…
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent to-purple-accent">
          <Lock className="h-5 w-5 text-white" />
        </div>
        <CardTitle className="text-xl">Set new password</CardTitle>
        <CardDescription>Choose a strong password for your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!sessionReady ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                New password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Min. 8 characters"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-input py-2 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Repeat password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
