import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/layout/back-button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageThread } from "@/components/messages/message-thread";
import { MessageInput } from "@/components/messages/message-input";
import { getThread } from "@/lib/actions/messages";
import { Link } from "@/i18n/navigation";
import { Mail } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string; username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  return { title: `Chat with @${username}` };
}

export default async function MessageThreadPage({ params }: PageProps) {
  const { locale, username } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("messages");

  const { data: messages, otherUser, currentUserId, error } =
    await getThread(username);

  if (!otherUser || error === "User not found") notFound();

  const displayName = otherUser.display_name || otherUser.username;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>
      {/* Thread header */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <BackButton />
        <Link
          href={`/profile/${otherUser.username}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-accent to-purple-accent text-xs font-bold text-white">
            {otherUser.avatar_url ? (
              <img
                src={otherUser.avatar_url}
                alt={otherUser.username}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">{displayName}</p>
            <p className="text-[11px] text-muted-foreground">
              @{otherUser.username}
            </p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-1">
        {messages.length > 0 && currentUserId ? (
          <MessageThread messages={messages} currentUserId={currentUserId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <Mail className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">{t("noMessages")}</p>
          </div>
        )}
      </div>

      {/* Input */}
      <MessageInput receiverUsername={otherUser.username} />
    </div>
  );
}
