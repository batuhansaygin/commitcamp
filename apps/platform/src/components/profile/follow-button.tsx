"use client";

/**
 * FollowButton — optimistic follow/unfollow with loading state.
 *
 * Rule 8 — Pattern 1: own actions update instantly, revert on error.
 * The follower count on profile pages is handled by revalidatePath in the action.
 */

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { followUser, unfollowUser } from "@/lib/actions/follows";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  targetUsername: string;
  initialFollowing: boolean;
  /** Optional: allow parent to sync follower count display */
  onFollowChange?: (following: boolean) => void;
}

export function FollowButton({
  targetUserId,
  targetUsername,
  initialFollowing,
  onFollowChange,
}: FollowButtonProps) {
  const t = useTranslations("profile");
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    // Optimistic update — instant feedback, no loading spinner
    const next = !following;
    setFollowing(next);
    onFollowChange?.(next);

    setIsPending(true);
    try {
      const result = next
        ? await followUser(targetUserId, targetUsername)
        : await unfollowUser(targetUserId, targetUsername);

      if (result.error) {
        // Revert on error
        setFollowing(!next);
        onFollowChange?.(!next);
      }
    } catch {
      setFollowing(!next);
      onFollowChange?.(!next);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      variant={following ? "outline" : "default"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="gap-1.5"
    >
      {isPending ? (
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
