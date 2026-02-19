import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Code2, MessageSquareText, Users, Star } from "lucide-react";
import type { ProfileWithStats } from "@/lib/types/profiles";
import { LevelBadge } from "@/components/profile/level-badge";
import { XpProgressBar } from "@/components/profile/xp-progress-bar";

interface ProfileHeaderProps {
  profile: ProfileWithStats;
  followButton?: React.ReactNode;
  messageButton?: React.ReactNode;
  editButton?: React.ReactNode;
}

export function ProfileHeader({ profile, followButton, messageButton, editButton }: ProfileHeaderProps) {
  const initial = (
    profile.display_name || profile.username
  )
    .charAt(0)
    .toUpperCase();

  const joinDate = new Date(profile.created_at).toLocaleDateString("en", {
    year: "numeric",
    month: "short",
  });

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
            <XpProgressBar xp={profile.xp_points ?? 0} className="max-w-xs" />

            {/* Stats */}
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5" />
                <strong className="text-foreground">
                  {(profile.xp_points ?? 0).toLocaleString()}
                </strong>{" "}
                XP
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <strong className="text-foreground">
                  {profile.followers_count}
                </strong>{" "}
                followers
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <strong className="text-foreground">
                  {profile.following_count}
                </strong>{" "}
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
