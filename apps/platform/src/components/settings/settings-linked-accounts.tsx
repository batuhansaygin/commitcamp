"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearProviderProfileFields } from "@/lib/actions/linked-accounts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Link2, Link2Off, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

export interface SerializedIdentity {
  identity_id: string;
  provider: string;
  identity_data: Record<string, string | boolean | number | null>;
  created_at: string;
}

interface ProviderConfig {
  id: "github" | "google" | "discord";
  label: string;
  description: string;
  icon: React.ReactNode;
  getDisplayName: (data: Record<string, string | boolean | number | null>) => string | null;
}

// ── Provider metadata ────────────────────────────────────────────────────────

const PROVIDERS: ProviderConfig[] = [
  {
    id: "github",
    label: "GitHub",
    description: "Sign in and auto-fill your GitHub username on your profile.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
    getDisplayName: (d) =>
      (d.user_name as string) ||
      (d.preferred_username as string) ||
      (d.login as string) ||
      (d.name as string) ||
      null,
  },
  {
    id: "google",
    label: "Google",
    description: "Sign in with your Google account.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
    getDisplayName: (d) =>
      (d.full_name as string) ||
      (d.name as string) ||
      (d.email as string) ||
      null,
  },
  {
    id: "discord",
    label: "Discord",
    description: "Sign in and enable direct messages from other users.",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#5865F2">
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
    getDisplayName: (d) =>
      (d.full_name as string) ||
      (d.global_name as string) ||
      (d.username as string) ||
      null,
  },
];

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialIdentities: SerializedIdentity[];
  hasPassword: boolean;
}

export function SettingsLinkedAccounts({ initialIdentities, hasPassword }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [identities, setIdentities] = useState<SerializedIdentity[]>(initialIdentities);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<SerializedIdentity | null>(null);
  const [unlinking, startUnlink] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const linkedProviders = new Set(identities.map((i) => i.provider));
  const canUnlink = hasPassword || identities.length > 1;

  // ── Link ──────────────────────────────────────────────────────────────────

  async function handleLink(provider: ProviderConfig["id"]) {
    setError(null);
    setLinkingProvider(provider);
    const { error: linkError } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/callback?next=/settings&linked=${provider}`,
        scopes: provider === "github" ? "read:user user:email" : undefined,
      },
    });
    if (linkError) {
      setError(linkError.message);
      setLinkingProvider(null);
    }
    // On success, browser redirects to OAuth provider
  }

  // ── Unlink ────────────────────────────────────────────────────────────────

  async function handleUnlinkConfirm() {
    if (!unlinkTarget) return;
    setError(null);

    startUnlink(async () => {
      // 1. Unlink via Supabase client SDK
      const { error: unlinkError } = await supabase.auth.unlinkIdentity(
        unlinkTarget as Parameters<typeof supabase.auth.unlinkIdentity>[0]
      );

      if (unlinkError) {
        setError(unlinkError.message);
        setUnlinkTarget(null);
        return;
      }

      // 2. Clear related profile fields server-side
      await clearProviderProfileFields(unlinkTarget.provider);

      // 3. Update local state optimistically
      setIdentities((prev) =>
        prev.filter((i) => i.identity_id !== unlinkTarget.identity_id)
      );

      setSuccessMsg(`${unlinkTarget.provider.charAt(0).toUpperCase() + unlinkTarget.provider.slice(1)} account disconnected.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setUnlinkTarget(null);

      // 4. Refresh server component so page reload also shows correct state
      router.refresh();
    });
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4 text-primary" />
            Linked Accounts
          </CardTitle>
          <CardDescription>
            Connect external accounts for quick sign-in and profile enrichment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Feedback banners */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {successMsg}
            </div>
          )}

          {/* Provider rows */}
          <div className="divide-y divide-border rounded-xl border border-border">
            {PROVIDERS.map((provider) => {
              const identity = identities.find((i) => i.provider === provider.id);
              const isLinked = Boolean(identity);
              const displayName = identity
                ? provider.getDisplayName(identity.identity_data)
                : null;
              const isLinking = linkingProvider === provider.id;
              const isThisUnlinking =
                unlinking && unlinkTarget?.provider === provider.id;

              return (
                <div
                  key={provider.id}
                  className="flex items-center gap-4 px-4 py-3.5 first:rounded-t-xl last:rounded-b-xl"
                >
                  {/* Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                    {provider.icon}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{provider.label}</span>
                      {isLinked && (
                        <span className="inline-flex items-center rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {isLinked && displayName
                        ? displayName
                        : provider.description}
                    </p>
                  </div>

                  {/* Action */}
                  {isLinked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isThisUnlinking || !canUnlink}
                      onClick={() => {
                        if (!canUnlink) {
                          setError(
                            "You need at least one login method. Set a password first to disconnect."
                          );
                          return;
                        }
                        setUnlinkTarget(identity!);
                      }}
                      className="shrink-0 gap-1.5 text-xs text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                    >
                      {isThisUnlinking ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Link2Off className="h-3.5 w-3.5" />
                      )}
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLinking || linkedProviders.has(provider.id)}
                      onClick={() => handleLink(provider.id)}
                      className="shrink-0 gap-1.5 text-xs hover:border-primary/50 hover:text-primary"
                    >
                      {isLinking ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5" />
                      )}
                      Connect
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {!canUnlink && (
            <p className="text-xs text-muted-foreground">
              To disconnect your only linked account, first set a password in{" "}
              <span className="font-medium">Account Settings</span>.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Confirm unlink dialog */}
      <Dialog
        open={Boolean(unlinkTarget)}
        onOpenChange={(open) => !open && setUnlinkTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Disconnect{" "}
              <span className="capitalize">{unlinkTarget?.provider}</span>?
            </DialogTitle>
            <DialogDescription>
              You will no longer be able to sign in with{" "}
              <span className="font-medium capitalize">{unlinkTarget?.provider}</span>.
              {unlinkTarget?.provider === "github" && (
                <span className="mt-2 block text-amber-600 dark:text-amber-400">
                  Your GitHub username on your profile will also be cleared.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              disabled={unlinking}
              onClick={() => setUnlinkTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={unlinking}
              onClick={handleUnlinkConfirm}
            >
              {unlinking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
