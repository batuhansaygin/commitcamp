import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChallengeBySlug, getSubmissions, getChallengeLeaderboard } from "@/lib/actions/challenges";
import { SolveClient } from "./solve-client";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const challenge = await getChallengeBySlug(slug);
  if (!challenge) return { title: "Challenge Not Found — CommitCamp" };
  return {
    title: `${challenge.title} — CommitCamp Challenges`,
    description: `${challenge.difficulty.toUpperCase()} coding challenge: ${challenge.title}`,
  };
}

export default async function ChallengeSolvePage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const challenge = await getChallengeBySlug(slug);
  if (!challenge) notFound();

  const [submissions, leaderboard] = await Promise.all([
    getSubmissions(challenge.id, user.id),
    getChallengeLeaderboard(challenge.id, 20),
  ]);

  return (
    <SolveClient
      challenge={challenge}
      initialSubmissions={submissions}
      leaderboard={leaderboard}
      userId={user.id}
    />
  );
}
