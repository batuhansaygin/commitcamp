import { getProfileByUsername } from "@/lib/actions/profiles";
import { redirect, notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string; username: string }>;
}

/** Redirect to Discord user profile for DMs, or 404 if user hasn't connected Discord. */
export default async function MessageThreadPage({ params }: PageProps) {
  const { username } = await params;
  const { data: profile } = await getProfileByUsername(username);
  if (!profile) notFound();
  if (profile.discord_user_id) {
    redirect(`https://discord.com/users/${profile.discord_user_id}`);
  }
  notFound();
}
