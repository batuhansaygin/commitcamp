"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Code2, MessageSquareText, Users, Star } from "lucide-react";
import type { ProfileWithStats } from "@/lib/types/profiles";
import { LevelBadge } from "@/components/profile/level-badge";
import { XpProgressBar } from "@/components/profile/xp-progress-bar";
import { createClient } from "@/lib/supabase/client";

interface ProfileHeaderProps {
  profile: ProfileWithStats;
  followButton?: React.ReactNode;
  messageButton?: React.ReactNode;
  editButton?: React.ReactNode;
}

export function ProfileHeader({ profile, followButton, messageButton, editButton }: ProfileHeaderProps) {
  const initial = (profile.display_name || profile.username).charAt(0).toUpperCase();
  const joinDate = new Date(profile.created_at).toLocaleDateString("en", {
    year: "numeric",
    month: "short",
  });

  // Live-updating counters — updated via Supabase Realtime when someone follows/unfollows
  const [followersCount, setFollowersCount] = useState(profile.followers_count);
  const [followingCount, setFollowingCount] = useState(profile.following_count);
  const [xpPoints, setXpPoints] = useState(profile.xp_points ?? 0);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    if (channelRef.current) supabase.removeChannel(channelRef.current);

    channelRef.current = supabase
      .channel(`profile-stats:${profile.id}`)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${profile.id}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const updated = payload.new as Partial<ProfileWithStats>;
          if (updated.followers_count !== undefined) setFollowersCount(updated.followers_count);
          if (updated.following_count !== undefined) setFollowingCount(updated.following_count);
          if (updated.xp_points !== undefined) setXpPoints(updated.xp_points ?? 0);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [profile.id]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-accent to-purple-accent text-2xl font-bold text-white">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              initial
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold">
                    {profile.display_name || profile.username}
                  </h1>
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
                <p className="text-sm text-muted-foreground">
                  @{profile.username}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {editButton}
                {messageButton}
                {followButton}
              </div>
            </div>

            {profile.bio && (
              <p className="text-sm leading-relaxed">{profile.bio}</p>
            )}

            {/* XP progress */}
            <XpProgressBar xp={xpPoints} className="max-w-xs" />

            {/* Stats — follower/following counts update in real-time */}
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5" />
                <strong className="text-foreground">
                  {xpPoints.toLocaleString()}
                </strong>{" "}
                XP
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <strong className="text-foreground">{followersCount}</strong>{" "}
                followers
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <strong className="text-foreground">{followingCount}</strong>{" "}
                following
              </div>
              <div className="flex items-center gap-1">
                <Code2 className="h-3.5 w-3.5" />
                <strong className="text-foreground">
                  {profile.snippets_count}
                </strong>{" "}
                snippets
              </div>
              <div className="flex items-center gap-1">
                <MessageSquareText className="h-3.5 w-3.5" />
                <strong className="text-foreground">
                  {profile.posts_count}
                </strong>{" "}
                posts
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Joined {joinDate}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
