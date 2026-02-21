import { getTranslations, setRequestLocale } from "@/lib/i18n-server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUsername, getProfileStats, isFollowingUser } from "@/lib/actions/profile";
import { getProfilePosts } from "@/lib/actions/profile";
import { FollowButton } from "@/components/profile/follow-button";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import { ProfilePostsTabs } from "@/components/profile/profile-posts-tabs";
import { FollowersDialog } from "@/components/profile/followers-dialog";
import { TechStackBadge } from "@/components/profile/tech-stack-badge";
import { LevelBadge } from "@/components/profile/level-badge";
import { XpProgressBar } from "@/components/profile/xp-progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  Shield,
  MapPin,
  Globe,
  Github,
  Twitter,
  CheckCircle2,
  MessageSquareText,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { AchievementBadge } from "@/components/achievements/achievement-badge";
import { StreakCounter } from "@/components/achievements/streak-counter";
import { getUserAchievements } from "@/lib/actions/achievements";
import { Link as LocaleLink } from "@/i18n/navigation";

interface PageProps {
  params: Promise<{ locale: string; username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const { data: profile } = await getProfileByUsername(username);
  if (!profile) return { title: "User Not Found — CommitCamp" };
  return {
    title: `${profile.display_name || profile.username} (@${profile.username}) — CommitCamp`,
    description:
      profile.bio ||
      `${profile.display_name || profile.username}'s developer profile on CommitCamp`,
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const t = await getTranslations("profile");

  const { data: profile } = await getProfileByUsername(username);
  if (!profile) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwnProfile = user?.id === profile.id;
  const [following, { data: stats }, { data: initialPosts }, recentAchievements] =
    await Promise.all([
      user && !isOwnProfile ? isFollowingUser(profile.id) : Promise.resolve(false),
      getProfileStats(username),
      getProfilePosts(username, "all"),
      getUserAchievements(profile.id),
    ]);

  const displayName = profile.display_name || profile.username;
  const initial = displayName.charAt(0).toUpperCase();

  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-0">
      {/* ── Cover + Avatar ────────────────────────────────── */}
      <div className="relative">
        {/* Cover banner */}
        <div className="h-44 w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/30 via-purple-500/20 to-cyan-500/20 sm:h-52">
          {profile.cover_url && (
            <img
              src={profile.cover_url}
              alt="cover"
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Avatar overlapping cover */}
        <div className="absolute -bottom-12 left-5 sm:left-6">
          <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-gradient-to-br from-cyan-accent to-purple-accent flex items-center justify-center text-3xl font-bold text-white">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="h-full w-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
        </div>

        {/* Action buttons: top-right corner of cover */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {isOwnProfile ? (
            <EditProfileDialog profile={profile} />
          ) : (
            <>
              {user && profile.discord_user_id && profile.allow_private_messages && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://discord.com/users/${profile.discord_user_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-1.5"
                  >
                    <MessageSquareText className="h-3.5 w-3.5" />
                    {t("message")}
                  </a>
                </Button>
              )}
              {user && (
                <FollowButton
                  targetUserId={profile.id}
                  targetUsername={profile.username}
                  initialFollowing={following}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Profile Info ──────────────────────────────────── */}
      <div className="px-5 pb-0 pt-14 sm:px-6">
        {/* Name row */}
        <div className="flex items-start gap-2 flex-wrap">
          <h1 className="text-xl font-bold sm:text-2xl">{displayName}</h1>
          {profile.is_verified && (
            <CheckCircle2 className="mt-1 h-5 w-5 text-primary shrink-0" />
          )}
          <LevelBadge level={profile.level ?? 1} size="md" />
          {profile.role !== "user" && (
            <Badge
              variant={profile.role === "admin" ? "info" : "secondary"}
              className="text-[10px]"
            >
              <Shield className="mr-1 h-3 w-3" />
              {profile.role}
            </Badge>
          )}
        </div>

        <p className="mt-0.5 text-sm text-muted-foreground">@{profile.username}</p>

        {profile.bio && (
          <p className="mt-3 text-sm leading-relaxed text-foreground/90">
            {profile.bio}
          </p>
        )}

        {/* Info row */}
        {(profile.location || profile.website || profile.github_username || profile.twitter_username) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </span>
            )}
            {profile.website && (
              <a
                href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Globe className="h-3.5 w-3.5" />
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {profile.github_username && (
              <a
                href={`https://github.com/${profile.github_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Github className="h-3.5 w-3.5" />
                {profile.github_username}
              </a>
            )}
            {profile.twitter_username && (
              <a
                href={`https://twitter.com/${profile.twitter_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <Twitter className="h-3.5 w-3.5" />
                {profile.twitter_username}
              </a>
            )}
          </div>
        )}

        {/* Tech stack */}
        {profile.tech_stack.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.tech_stack.map((tech) => (
              <TechStackBadge key={tech} tech={tech} />
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span>
            <strong className="text-foreground">{profile.posts_count}</strong>{" "}
            <span className="text-muted-foreground">{t("posts")}</span>
          </span>

          <FollowersDialog
            username={username}
            followersCount={profile.followers_count}
            followingCount={profile.following_count}
            initialTab="followers"
            trigger={
              <button className="hover:underline">
                <strong className="text-foreground">{profile.followers_count}</strong>{" "}
                <span className="text-muted-foreground">{t("followers")}</span>
              </button>
            }
          />

          <FollowersDialog
            username={username}
            followersCount={profile.followers_count}
            followingCount={profile.following_count}
            initialTab="following"
            trigger={
              <button className="hover:underline">
                <strong className="text-foreground">{profile.following_count}</strong>{" "}
                <span className="text-muted-foreground">{t("following")}</span>
              </button>
            }
          />

          <span>
            <strong className="text-foreground">{stats?.total_likes ?? 0}</strong>{" "}
            <span className="text-muted-foreground">{t("likesReceived")}</span>
          </span>

          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {t("joined", { date: joinDate })}
          </span>
        </div>

        {/* XP progress */}
        <div className="mt-4">
          <XpProgressBar xp={profile.xp_points ?? 0} className="max-w-xs" />
        </div>

        {/* Streak */}
        {(profile.current_streak ?? 0) > 0 && (
          <div className="mt-3">
            <StreakCounter
              streak={profile.current_streak ?? 0}
              longestStreak={profile.longest_streak ?? 0}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* ── Recent Achievements ───────────────────────────── */}
      {recentAchievements.length > 0 && (
        <div className="mt-6 px-5 sm:px-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">{t("achievements")}</h2>
            {isOwnProfile && (
              <LocaleLink
                href="/achievements"
                className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {t("viewAllAchievements", {
                  count: recentAchievements.length,
                })}
                <ChevronRight className="h-3 w-3" />
              </LocaleLink>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {recentAchievements.slice(0, 8).map((ua) => (
              <AchievementBadge
                key={ua.id}
                achievement={ua.achievement}
                isUnlocked
                unlockedAt={ua.unlocked_at}
                size="md"
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Posts Tabs ────────────────────────────────────── */}
      <div className="mt-6 px-5 pb-10 sm:px-6">
        <ProfilePostsTabs
          username={username}
          userId={profile.id}
          isOwnProfile={isOwnProfile}
          initialPosts={
            (initialPosts ?? []) as Parameters<typeof ProfilePostsTabs>[0]["initialPosts"]
          }
        />
      </div>
    </div>
  );
}
