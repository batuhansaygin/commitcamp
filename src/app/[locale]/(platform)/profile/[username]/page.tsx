import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileHeader } from "@/components/profile/profile-header";
import { FollowButton } from "@/components/profile/follow-button";
import { getProfileByUsername, getUserSnippets, getUserPosts } from "@/lib/actions/profiles";
import { isFollowing } from "@/lib/actions/follows";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Code2, MessageSquareText, CheckCircle2, Pencil } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string; username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const { data } = await getProfileByUsername(username);
  if (!data) return { title: "User Not Found" };
  return { title: `${data.display_name || data.username} — CommitCamp` };
}

export default async function ProfilePage({ params }: PageProps) {
  const { locale, username } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("profile");

  const { data: profile } = await getProfileByUsername(username);
  if (!profile) notFound();

  // Get current user to determine if we show follow button
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwnProfile = user?.id === profile.id;
  const following = user && !isOwnProfile ? await isFollowing(profile.id) : false;

  // Fetch user's content
  const [{ data: snippets }, { data: posts }] = await Promise.all([
    getUserSnippets(profile.id),
    getUserPosts(profile.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Profile header with follow and message buttons */}
      <ProfileHeader
        profile={profile}
        editButton={
          isOwnProfile ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings">
                <Pencil className="mr-2 h-4 w-4" />
                {t("editProfile")}
              </Link>
            </Button>
          ) : undefined
        }
        messageButton={
          user && !isOwnProfile && profile.discord_user_id ? (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://discord.com/users/${profile.discord_user_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquareText className="mr-2 h-4 w-4" />
                {t("sendMessage")}
              </a>
            </Button>
          ) : undefined
        }
        followButton={
          user && !isOwnProfile ? (
            <FollowButton
              targetUserId={profile.id}
              targetUsername={profile.username}
              initialFollowing={following}
            />
          ) : undefined
        }
      />

      {/* Snippets */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Code2 className="h-4 w-4" />
          {t("snippets")} ({snippets.length})
        </h2>
        {snippets.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {snippets.map((s) => (
              <Link key={s.id} href={`/snippets/${s.id}`}>
                <Card className="transition-colors hover:border-primary/30 hover:bg-muted/30">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium line-clamp-1">
                        {s.title}
                      </span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {s.language}
                      </Badge>
                    </div>
                    {s.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {s.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("noSnippets")}</p>
        )}
      </section>

      {/* Posts */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquareText className="h-4 w-4" />
          {t("posts")} ({posts.length})
        </h2>
        {posts.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {posts.map((p) => (
              <Link key={p.id} href={`/forum/${p.id}`}>
                <Card className="transition-colors hover:border-primary/30 hover:bg-muted/30">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          p.type === "question"
                            ? "info"
                            : p.type === "showcase"
                              ? "warning"
                              : "default"
                        }
                        className="text-[10px]"
                      >
                        {p.type}
                      </Badge>
                      {p.type === "question" && p.is_solved && (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                    <span className="text-sm font-medium line-clamp-1">
                      {p.title}
                    </span>
                    {p.tags.length > 0 && (
                      <div className="flex gap-1">
                        {p.tags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("noPosts")}</p>
        )}
      </section>
    </div>
  );
}
