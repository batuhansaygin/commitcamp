"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { Link } from "@/i18n/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Code2,
  FileText,
  MessageSquare,
  BookMarked,
  Layers,
  HelpCircle,
} from "lucide-react";
import { getProfilePosts, getProfileSnippets } from "@/lib/actions/profile";

type TabKey = "all" | "discussion" | "question" | "showcase" | "snippets";

interface PostItem {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  is_solved: boolean;
  created_at: string;
}

interface SnippetItem {
  id: string;
  title: string;
  language: string;
  description: string | null;
  created_at: string;
}

interface ProfilePostsTabsProps {
  username: string;
  isOwnProfile: boolean;
  initialPosts?: PostItem[];
}

const TAB_ICONS: Record<TabKey, React.ElementType> = {
  all: Layers,
  discussion: MessageSquare,
  question: HelpCircle,
  showcase: FileText,
  snippets: Code2,
};

const TYPE_BADGE_VARIANTS: Record<string, "default" | "info" | "warning"> = {
  discussion: "default",
  question: "info",
  showcase: "warning",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function ProfilePostsTabs({
  username,
  isOwnProfile,
  initialPosts = [],
}: ProfilePostsTabsProps) {
  const t = useTranslations("profile");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [snippets, setSnippets] = useState<SnippetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [snippetsLoaded, setSnippetsLoaded] = useState(false);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "all", label: t("tabs.all") },
    { key: "discussion", label: t("tabs.discussion") },
    { key: "question", label: t("tabs.question") },
    { key: "showcase", label: t("tabs.showcase") },
    { key: "snippets", label: t("tabs.snippet") },
  ];

  async function handleTabChange(tab: TabKey) {
    setActiveTab(tab);

    if (tab === "snippets" && !snippetsLoaded) {
      setLoading(true);
      const { data } = await getProfileSnippets(username);
      setSnippets(data as SnippetItem[]);
      setSnippetsLoaded(true);
      setLoading(false);
      return;
    }

    if (tab !== "snippets" && tab !== "all") {
      setLoading(true);
      const { data } = await getProfilePosts(username, tab);
      setPosts(data as PostItem[]);
      setLoading(false);
    }

    if (tab === "all") {
      setLoading(true);
      const { data } = await getProfilePosts(username, "all");
      setPosts(data as PostItem[]);
      setLoading(false);
    }
  }

  const displayedPosts =
    activeTab === "all"
      ? posts
      : activeTab === "snippets"
        ? []
        : posts.filter((p) => p.type === activeTab);

  const isEmpty =
    activeTab === "snippets"
      ? snippetsLoaded && snippets.length === 0
      : displayedPosts.length === 0;

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-border pb-0">
        {tabs.map(({ key, label }) => {
          const Icon = TAB_ICONS[key];
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : activeTab === "snippets" ? (
        snippets.length === 0 ? (
          <div className="py-12 text-center">
            <Code2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {t("empty.posts", { name: username })}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {snippets.map((s) => (
              <Link key={s.id} href={`/snippets/${s.id}`}>
                <Card className="group transition-colors hover:border-primary/30 hover:bg-muted/30">
                  <CardContent className="p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        {s.title}
                      </span>
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {s.language}
                      </Badge>
                    </div>
                    {s.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {s.description}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground">{timeAgo(s.created_at)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )
      ) : isEmpty ? (
        <div className="py-12 text-center">
          <BookMarked className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {t("empty.posts", { name: username })}
          </p>
          {isOwnProfile && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("empty.postsDescription", { name: "you" })}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedPosts.map((post) => (
            <Link key={post.id} href={`/forum/${post.id}`}>
              <Card className="group transition-colors hover:border-primary/30 hover:bg-muted/30">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={TYPE_BADGE_VARIANTS[post.type] ?? "default"}
                      className="text-[10px]"
                    >
                      {post.type}
                    </Badge>
                    {post.type === "question" && post.is_solved && (
                      <Badge variant="success" className="text-[10px]">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Solved
                      </Badge>
                    )}
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {timeAgo(post.created_at)}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  {post.content && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {post.content}
                    </p>
                  )}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
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
      )}
    </div>
  );
}
