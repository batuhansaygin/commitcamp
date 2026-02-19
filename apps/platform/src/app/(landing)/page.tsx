import { setRequestLocale } from "@/lib/i18n-server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLandingStats } from "@/lib/actions/landing";
import { HeroSection } from "@/components/landing/hero-section";
import { StatsBar } from "@/components/landing/stats-bar";
import { FeaturesSection } from "@/components/landing/features-section";
import { CodePreviewSection } from "@/components/landing/code-preview-section";
import { LeaderboardPreviewSection } from "@/components/landing/leaderboard-preview-section";
import { CommunitySection } from "@/components/landing/community-section";
import { CTASection } from "@/components/landing/cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CommitCamp — The Social Platform Built for Developers",
  description:
    "Share code, showcase projects, earn XP, and connect with developers worldwide. Join CommitCamp — free forever.",
  keywords: ["developer", "social media", "coding", "programming", "portfolio", "code sharing"],
  openGraph: {
    title: "CommitCamp — The Social Platform Built for Developers",
    description:
      "Share code, showcase projects, earn XP, and connect with developers worldwide.",
    type: "website",
  },
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LandingPage({ params }: PageProps) {

  // Redirect authenticated users to feed
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(`/feed`);

  const stats = await getLandingStats();

  return (
    <>
      <HeroSection />
      <StatsBar stats={stats} />
      <FeaturesSection />
      <CodePreviewSection />
      <LeaderboardPreviewSection />
      <CommunitySection />
      <CTASection />
      <LandingFooter />
    </>
  );
}
