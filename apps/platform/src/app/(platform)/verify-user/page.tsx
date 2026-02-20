import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ExternalLink, GitCommit, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Linked Roles Verification — CommitCamp",
  description:
    "Verify your CommitCamp membership to access Discord Linked Roles in supported servers.",
};

export default async function VerifyUserPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string; display_name: string | null; role: string; is_verified: boolean } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, role, is_verified")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-16 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent to-purple-accent">
          <GitCommit className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">CommitCamp</h1>
          <p className="text-sm text-muted-foreground">Discord Linked Roles Verification</p>
        </div>
      </div>

      {/* What this is */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">What is this page?</p>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                This page is used by Discord&apos;s{" "}
                <strong className="text-foreground">Linked Roles</strong> feature.
                Discord servers can require members to verify their CommitCamp
                membership before gaining access to special roles and channels.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-sm">
            <p className="font-medium text-foreground">How it works:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground pl-1">
              <li>A Discord server admin sets up CommitCamp as a Linked Role requirement.</li>
              <li>Server members click the role and are redirected here to authenticate.</li>
              <li>CommitCamp confirms your account exists and shares your role metadata with Discord.</li>
              <li>Discord grants the linked role automatically.</li>
            </ol>
          </div>

          {/* Verification status */}
          {user && profile ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">
                  Account Verified
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                You are signed in as{" "}
                <span className="font-medium text-foreground">
                  {profile.display_name ?? profile.username}
                </span>{" "}
                (<span className="font-mono text-xs">@{profile.username}</span>).
                Your CommitCamp membership is confirmed.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium capitalize">
                  Role: {profile.role.replace("_", " ")}
                </span>
                {profile.is_verified && (
                  <span className="inline-flex items-center rounded border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                    Verified Member
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                You are not signed in. To complete Discord Linked Roles verification,
                please{" "}
                <a href="/login" className="text-primary hover:underline font-medium">
                  sign in to CommitCamp
                </a>{" "}
                first.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Links */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <a
          href="https://discord.com/developers/docs/tutorials/configuring-app-metadata-for-linked-roles"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Discord Linked Roles docs
        </a>
        <a href="/privacy-policy" className="hover:text-foreground transition-colors">
          Privacy Policy
        </a>
        <a href="/terms-of-service" className="hover:text-foreground transition-colors">
          Terms of Service
        </a>
      </div>
    </div>
  );
}
