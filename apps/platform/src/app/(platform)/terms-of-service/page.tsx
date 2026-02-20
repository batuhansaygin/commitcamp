import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — CommitCamp",
  description:
    "CommitCamp Terms of Service — the rules and guidelines for using our platform.",
};

const LAST_UPDATED = "February 19, 2026";

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      {/* Header */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">
              Last updated: {LAST_UPDATED}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed pt-1">
          Please read these Terms of Service carefully before using CommitCamp.
          By accessing or using the platform, you agree to be bound by these
          terms.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-8 text-sm leading-relaxed">

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground">
              By creating an account or using CommitCamp (&quot;the Service&quot;,
              &quot;Platform&quot;), you agree to these Terms of Service and our{" "}
              <a href="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </a>
              . If you do not agree to these terms, you may not use CommitCamp.
              These terms apply to all users, including visitors, registered
              members, and contributors.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              2. Description of Service
            </h2>
            <p className="text-muted-foreground">
              CommitCamp is a developer community platform that provides:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>Community forum for technical discussions, questions, and showcases.</li>
              <li>Code snippet sharing and collaboration tools.</li>
              <li>Coding challenges, duels, and contests with a ranking system.</li>
              <li>Developer tools (JSON formatter, regex tester, UUID generator, etc.).</li>
              <li>Gamification features including XP, levels, achievements, and leaderboards.</li>
              <li>AI-powered coding assistant.</li>
              <li>User profiles, following, and activity feeds.</li>
              <li>Discord integration for community messaging.</li>
            </ul>
            <p className="text-muted-foreground">
              We reserve the right to modify, suspend, or discontinue any part of the
              Service at any time with reasonable notice.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              3. Account Registration
            </h2>
            <p className="text-muted-foreground">
              To use most features of CommitCamp, you must create an account.
              You agree to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>Provide accurate and complete registration information.</li>
              <li>
                Choose a username that is not offensive, misleading, or
                impersonates another person or entity.
              </li>
              <li>Keep your account credentials secure and not share them with others.</li>
              <li>
                Notify us immediately at{" "}
                <a href="mailto:support@commitcamp.com" className="text-primary hover:underline">
                  support@commitcamp.com
                </a>{" "}
                if you suspect unauthorized access to your account.
              </li>
              <li>Be responsible for all activity that occurs under your account.</li>
            </ul>
            <p className="text-muted-foreground">
              You must be at least 13 years old to create an account.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              4. Acceptable Use
            </h2>
            <p className="text-muted-foreground">
              You agree to use CommitCamp only for lawful purposes. You must not:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>Post content that is illegal, harassing, hateful, threatening, defamatory, or discriminatory.</li>
              <li>Share malicious code, malware, or content designed to harm systems or users.</li>
              <li>Spam, flood, or repeatedly post the same or similar content.</li>
              <li>Impersonate other users, employees, or public figures.</li>
              <li>Attempt to gain unauthorized access to any part of the platform or other users&apos; accounts.</li>
              <li>Scrape, crawl, or extract platform data in bulk without written permission.</li>
              <li>Artificially manipulate XP, rankings, or achievement systems.</li>
              <li>Violate any applicable local, national, or international laws or regulations.</li>
            </ul>
            <p className="text-muted-foreground">
              Violation of these rules may result in content removal, account
              suspension, or permanent ban without notice.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              5. User-Generated Content
            </h2>
            <p className="text-muted-foreground">
              You retain ownership of the content you create and post on CommitCamp
              (forum posts, snippets, comments). By posting content, you grant
              CommitCamp a non-exclusive, royalty-free, worldwide license to display,
              store, and distribute that content as part of the Service.
            </p>
            <p className="text-muted-foreground">
              You are solely responsible for the content you post. You represent that
              your content:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>Does not infringe any third-party intellectual property rights.</li>
              <li>Does not contain personal data of others without their consent.</li>
              <li>Complies with these Terms of Service.</li>
            </ul>
            <p className="text-muted-foreground">
              We reserve the right to remove any content that violates these terms
              or that we determine, at our sole discretion, is harmful to the community.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              6. Discord Integration
            </h2>
            <p className="text-muted-foreground">
              CommitCamp offers optional Discord OAuth integration that allows you to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>Sign in to CommitCamp using your Discord account.</li>
              <li>Link your Discord identity to your CommitCamp profile.</li>
              <li>Use Discord Linked Roles to verify your CommitCamp membership in Discord servers.</li>
            </ul>
            <p className="text-muted-foreground">
              When you connect Discord, we receive your public Discord profile data
              (username, user ID). You may disconnect Discord at any time from your
              Settings page. Your use of Discord is also governed by{" "}
              <a
                href="https://discord.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Discord&apos;s Terms of Service
              </a>
              .
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              7. Intellectual Property
            </h2>
            <p className="text-muted-foreground">
              The CommitCamp name, logo, design, and all platform-specific content
              (developer tools, UI, challenge content created by our team) are the
              intellectual property of CommitCamp and are protected by applicable
              copyright and trademark laws. You may not reproduce, distribute, or
              create derivative works without our express written permission.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              8. Third-Party Integrations
            </h2>
            <p className="text-muted-foreground">
              CommitCamp integrates with third-party services including GitHub, Google,
              Discord, and AI providers. Your use of these integrations is subject to
              the respective providers&apos; terms of service. We are not responsible for
              the availability or actions of third-party services.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              9. Disclaimer of Warranties
            </h2>
            <p className="text-muted-foreground">
              CommitCamp is provided &quot;as is&quot; and &quot;as available&quot; without
              warranties of any kind, either express or implied. We do not warrant that
              the Service will be uninterrupted, error-free, or free of harmful
              components. We make no guarantee regarding the accuracy of AI-generated
              content from the AI Assistant feature.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              10. Limitation of Liability
            </h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, CommitCamp and its operators
              shall not be liable for any indirect, incidental, special, consequential,
              or punitive damages arising from your use of or inability to use the
              Service, including but not limited to loss of data, loss of profits, or
              damage to reputation.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              11. Account Termination
            </h2>
            <p className="text-muted-foreground">
              You may delete your account at any time from the Settings page. We
              reserve the right to suspend or terminate your account at our discretion
              for violations of these Terms. Upon termination, your right to access
              the Service ceases immediately. Some content you have contributed to the
              community may be retained in anonymized form.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              12. Changes to These Terms
            </h2>
            <p className="text-muted-foreground">
              We may update these Terms of Service at any time. We will notify users
              of material changes by posting a notice on the platform or sending an
              email. Continued use of CommitCamp after changes take effect constitutes
              your acceptance of the revised terms.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              13. Governing Law
            </h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with
              applicable laws. Any disputes arising from these Terms or your use of
              CommitCamp shall be resolved through good-faith negotiation. If a
              resolution cannot be reached, disputes shall be subject to binding
              arbitration.
            </p>
          </section>

          <Separator />

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">
              14. Contact Us
            </h2>
            <p className="text-muted-foreground">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
              <li>
                Email:{" "}
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
