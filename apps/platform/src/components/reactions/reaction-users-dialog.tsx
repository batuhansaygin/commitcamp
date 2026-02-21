"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { getReactionUsers, type ReactionTargetType } from "@/lib/actions/reactions";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ReactionUser {
  user_id: string;
  kind: "like" | "fire" | "rocket" | "heart";
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ReactionUsersDialogProps {
  targetType: ReactionTargetType;
  targetId: string;
  count: number;
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function ReactionUsersDialog({
  targetType,
  targetId,
  count,
}: ReactionUsersDialogProps) {
  const t = useTranslations("reactions");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<ReactionUser[]>([]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) return;
    setLoading(true);
    getReactionUsers(targetType, targetId)
      .then((data) => {
        setUsers(data as ReactionUser[]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {count}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("likedBy")}</DialogTitle>
          <DialogDescription>
            {count} {count === 1 ? "person has" : "people have"} reacted to this content.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        ) : users.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {users.map((reaction) => {
              const name =
                reaction.profiles?.display_name ||
                reaction.profiles?.username ||
                "Unknown user";
              return (
                <div
                  key={`${reaction.user_id}-${reaction.created_at}`}
                  className="flex items-center justify-between rounded-md border border-border p-2"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={reaction.profiles?.avatar_url ?? undefined}
                        alt={name}
                      />
                      <AvatarFallback>{getInitial(name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      {reaction.profiles?.username ? (
                        <p className="text-xs text-muted-foreground">
                          @{reaction.profiles.username}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <Heart className="h-4 w-4 text-red-500" />
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
