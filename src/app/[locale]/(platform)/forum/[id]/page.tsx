import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/layout/back-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PostActions } from "@/components/forum/post-actions";
import { CommentSection } from "@/components/forum/comment-section";
import { getPostById } from "@/lib/actions/posts";
import { getComments } from "@/lib/actions/comments";
import { createClient } from "@/lib/supabase/server";
import { User, Calendar, CheckCircle2 } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const { data } = await getPostById(id);
  if (!data) return { title: "Post Not Found" };
  return { title: data.title };
}

const TYPE_VARIANTS: Record<string, "default" | "info" | "warning"> = {
  discussion: "default",
  question: "info",
  showcase: "warning",
};

export default async function PostDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("forum");

  const [{ data: post }, { data: comments }] = await Promise.all([
    getPostById(id),
    getComments("post", id),
  ]);

  if (!post) notFound();

  // Check current user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthor = user?.id === post.user_id;
  const isAuthenticated = !!user;

  const authorName =
    post.profiles?.display_name || post.profiles?.username || "Anonymous";

  const createdDate = new Date(post.created_at).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <BackButton />

      {/* Post header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge
            variant={TYPE_VARIANTS[post.type] ?? "default"}
            className="text-[10px]"
          >
            {t(`types.${post.type}`)}
          </Badge>
          {post.type === "question" && post.is_solved && (
            <Badge variant="success" className="text-[10px]">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {t("solved")}
            </Badge>
          )}
        </div>

        <h1 className="text-2xl font-bold leading-tight">{post.title}</h1>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>
              {t("by")}{" "}
              <strong className="font-medium text-foreground">
                {authorName}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{createdDate}</span>
          </div>
        </div>
      </div>

      {/* Post content */}
      <Card>
        <CardContent className="prose prose-sm max-w-none p-6">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {post.content}
          </div>
        </CardContent>
      </Card>

      {/* Author actions */}
      {isAuthor && (
        <PostActions
          postId={post.id}
          isQuestion={post.type === "question"}
          isSolved={post.is_solved}
        />
      )}

      {/* Comments */}
      <CommentSection
        targetType="post"
        targetId={post.id}
        comments={comments}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
