import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — CommitCamp",
  description:
    "CommitCamp Privacy Policy — how we collect, use, and protect your data.",
};

const LAST_UPDATED = "February 19, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      {/* Header */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {LAST_UPDATED}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed pt-1">
          At CommitCamp, we take your privacy seriously. This policy explains
          what information we collect, how we use it, and your rights regarding
          your data.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-8 text-sm leading-relaxed">

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              1. Information We Collect
            </h2>
            <p className="text-muted-foreground">
              We collect information you provide directly to us when you create
              an account, update your profile, or use our services:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>
                <strong className="text-foreground">Account information:</strong>{" "}
                email address, username, display name, and profile picture.
              </li>
              <li>
                <strong className="text-foreground">OAuth data:</strong> if you
                sign in via GitHub, Google, or Discord, we receive your public
                profile information from those providers.
              </li>
              <li>
                <strong className="text-foreground">Content you create:</strong>{" "}
                forum posts, code snippets, comments, and messages.
              </li>
              <li>
                <strong className="text-foreground">Usage data:</strong>{" "}
                pages visited, features used, and interactions within the platform.
              </li>
              <li>
                <strong className="text-foreground">Technical data:</strong>{" "}
                IP address, browser type, device information, and cookies (session cookies only).
              </li>
              <li>
                <strong className="text-foreground">Discord data:</strong>{" "}
                if you connect Discord, we store your Discord user ID and username
                to link your profile and enable Linked Roles verification.
              </li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              2. How We Use Your Information
            </h2>
            <p className="text-muted-foreground">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>Provide, maintain, and improve the CommitCamp platform.</li>
              <li>Authenticate your identity and manage your account session.</li>
              <li>Personalize your experience (feed, recommendations, achievements).</li>
              <li>Enable community features such as following other users, reactions, and leaderboards.</li>
              <li>Send you important service notifications (password resets, security alerts).</li>
              <li>Calculate XP, levels, streaks, and badges for the gamification system.</li>
              <li>Enable Discord Linked Roles verification for Discord servers.</li>
              <li>Analyze platform usage in aggregate to improve the product.</li>
            </ul>
            <p className="text-muted-foreground">
              We do <strong className="text-foreground">not</strong> sell your
              personal information to third parties.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              3. Discord Integration
            </h2>
            <p className="text-muted-foreground">
              CommitCamp uses Discord OAuth2 for authentication and the Discord
              Linked Roles feature. When you connect your Discord account:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>We receive your Discord user ID, username, and global display name.</li>
              <li>We store your Discord user ID and username in your CommitCamp profile.</li>
              <li>
                This data is used to link your CommitCamp identity with Discord servers
                that use our Linked Roles integration.
              </li>
              <li>
                The Linked Roles verification endpoint (<code className="text-xs bg-muted rounded px-1">commitcamp.com/verify-user</code>)
                shares your CommitCamp role metadata (e.g., verified member status)
                with Discord servers that require it.
              </li>
            </ul>
            <p className="text-muted-foreground">
              You may disconnect Discord at any time from your{" "}
              <a href="/settings" className="text-primary hover:underline">Settings</a> page.
              Disconnecting will remove your Discord data from your CommitCamp profile.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              4. Third-Party Services
            </h2>
            <p className="text-muted-foreground">
              CommitCamp integrates the following third-party services:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>
                <strong className="text-foreground">Supabase</strong> — database,
                authentication, and file storage. Your data is stored on Supabase&apos;s
                infrastructure (EU region).
              </li>
              <li>
                <strong className="text-foreground">GitHub OAuth</strong> — for
                sign-in. We receive your public GitHub profile (username, email, avatar).
              </li>
              <li>
                <strong className="text-foreground">Google OAuth</strong> — for
                sign-in. We receive your public Google profile (name, email, avatar).
              </li>
              <li>
                <strong className="text-foreground">Discord OAuth</strong> — for
                sign-in and Linked Roles verification. We receive your Discord username
                and user ID.
              </li>
              <li>
                <strong className="text-foreground">Resend</strong> — for
                transactional emails (authentication, notifications). Your email
                address is shared with Resend solely for delivery purposes.
              </li>
              <li>
                <strong className="text-foreground">Google Gemini / Groq</strong> — for
                the AI Assistant feature. Messages sent to the AI assistant may be
                processed by these providers. We do not store AI chat history.
              </li>
            </ul>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              5. Data Retention
            </h2>
            <p className="text-muted-foreground">
              We retain your account data for as long as your account is active.
              If you delete your account, we will delete your personal information
              within 30 days, except where we are required to retain it for legal
              or security reasons. Content you have posted (forum posts, snippets,
              comments) may be anonymized rather than deleted to preserve the integrity
              of community discussions.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              6. Cookies
            </h2>
            <p className="text-muted-foreground">
              We use only essential session cookies required for authentication
              (managed by Supabase). We do not use advertising cookies or third-party
              tracking cookies. You may disable cookies in your browser, but this
              will prevent you from logging in.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              7. Security
            </h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures to protect your data,
              including encrypted connections (HTTPS/TLS), Row Level Security (RLS)
              on all database tables, and hashed passwords. We never store your OAuth
              provider passwords. However, no method of transmission over the internet
              is 100% secure.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              8. Your Rights
            </h2>
            <p className="text-muted-foreground">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>
                <strong className="text-foreground">Access:</strong> request a
                copy of the data we hold about you.
              </li>
              <li>
                <strong className="text-foreground">Correction:</strong> update
                inaccurate data via your profile settings.
              </li>
              <li>
                <strong className="text-foreground">Deletion:</strong> request
                deletion of your account and associated data.
              </li>
              <li>
                <strong className="text-foreground">Portability:</strong> request
                an export of your data in a structured format.
              </li>
              <li>
                <strong className="text-foreground">Objection:</strong> object to
                certain processing activities.
              </li>
            </ul>
            <p className="text-muted-foreground">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:privacy@commitcamp.com" className="text-primary hover:underline">
                privacy@commitcamp.com
              </a>
              .
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              9. Children&apos;s Privacy
            </h2>
            <p className="text-muted-foreground">
              CommitCamp is not directed to children under the age of 13. We do not
              knowingly collect personal information from children. If you believe a
              child has provided us with their information, please contact us and we
              will delete it promptly.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              10. Changes to This Policy
            </h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify
              you of significant changes by posting the new policy on this page and
              updating the &quot;Last updated&quot; date. Continued use of CommitCamp after
              changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              11. Contact Us
            </h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>
                Privacy inquiries:{" "}
                <a href="mailto:privacy@commitcamp.com" className="text-primary hover:underline">
                  privacy@commitcamp.com
                </a>
              </li>
              <li>
                General support:{" "}
                <a href="mailto:support@commitcamp.com" className="text-primary hover:underline">
                  support@commitcamp.com
                </a>
              </li>
              <li>
                Website:{" "}
                <a href="https://commitcamp.com" className="text-primary hover:underline">
                  commitcamp.com
                </a>
              </li>
            </ul>
          </section>

        </CardContent>
      </Card>
    </div>
  );
}
