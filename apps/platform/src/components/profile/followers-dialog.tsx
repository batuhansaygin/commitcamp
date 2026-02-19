"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { Link } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { LevelBadge } from "@/components/profile/level-badge";
import { getFollowers, getFollowing } from "@/lib/actions/profile";
import { Users } from "lucide-react";
import type { FollowerEntry } from "@/lib/types/profile-page";

type TabType = "followers" | "following";

interface FollowersDialogProps {
  username: string;
  followersCount: number;
  followingCount: number;
  trigger: React.ReactNode;
  initialTab?: TabType;
}

export function FollowersDialog({
  username,
  followersCount,
  followingCount,
  trigger,
  initialTab = "followers",
}: FollowersDialogProps) {
  const t = useTranslations("profile");
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [followers, setFollowers] = useState<FollowerEntry[]>([]);
  const [following, setFollowing] = useState<FollowerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState<Set<TabType>>(new Set());

  async function loadTab(tab: TabType) {
    if (loaded.has(tab)) return;
    setLoading(true);
    if (tab === "followers") {
      const { data } = await getFollowers(username);
      setFollowers(data);
    } else {
      const { data } = await getFollowing(username);
      setFollowing(data);
    }
    setLoaded((prev) => new Set([...prev, tab]));
    setLoading(false);
  }

  async function handleOpen(value: boolean) {
    setOpen(value);
    if (value) {
      await loadTab(initialTab);
      setActiveTab(initialTab);
    }
  }

  async function handleTabChange(tab: TabType) {
    setActiveTab(tab);
    await loadTab(tab);
  }

  const items = activeTab === "followers" ? followers : following;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex gap-4">
            <button
              onClick={() => handleTabChange("followers")}
              className={`text-base font-semibold transition-colors ${
                activeTab === "followers" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("followers")} <span className="ml-1 text-sm font-normal">({followersCount})</span>
            </button>
            <button
              onClick={() => handleTabChange("following")}
              className={`text-base font-semibold transition-colors ${
                activeTab === "following" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("following")} <span className="ml-1 text-sm font-normal">({followingCount})</span>
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 pt-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {activeTab === "followers"
                  ? t("empty.followers")
                  : t("empty.following")}
              </p>
            </div>
          ) : (
            items.map((person) => {
              const initial = (person.display_name || person.username)
                .charAt(0)
                .toUpperCase();
              return (
                <Link
                  key={person.id}
                  href={`/profile/${person.username}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors"
                >
                  <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-cyan-accent to-purple-accent flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                    {person.avatar_url ? (
                      <img src={person.avatar_url} alt={person.username} className="h-full w-full object-cover" />
                    ) : (
                      initial
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">
                        {person.display_name || person.username}
                      </span>
                      <LevelBadge level={person.level ?? 1} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      @{person.username}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
