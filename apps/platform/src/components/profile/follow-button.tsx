"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { followUser, unfollowUser } from "@/lib/actions/follows";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  targetUsername: string;
  initialFollowing: boolean;
}

export function FollowButton({
  targetUserId,
  targetUsername,
  initialFollowing,
}: FollowButtonProps) {
  const t = useTranslations("profile");
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    if (following) {
      const result = await unfollowUser(targetUserId, targetUsername);
      if (!result.error) setFollowing(false);
    } else {
      const result = await followUser(targetUserId, targetUsername);
      if (!result.error) setFollowing(true);
    }
    setLoading(false);
  };

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-1.5"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : following ? (
        <UserMinus className="h-3.5 w-3.5" />
      ) : (
        <UserPlus className="h-3.5 w-3.5" />
      )}
      {following ? t("unfollow") : t("follow")}
    </Button>
  );
}
