"use client";

import { useActionState } from "react";
import { useTranslations } from "@/lib/i18n";
import { updatePost } from "@/lib/actions/posts";
import { POST_TYPES } from "@/lib/types/posts";
import type { PostWithAuthor } from "@/lib/types/posts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";

interface PostEditFormProps {
  post: PostWithAuthor;}

export function PostEditForm({ post }: PostEditFormProps) {
  const t = useTranslations("forum");
  const [state, action, pending] = useActionState(updatePost, {});
  const tagsValue = post.tags?.length ? post.tags.join(", ") : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editPost")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <input type="hidden" name="postId" value={post.id} />          {state.error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          )}

          <div>
            <label
              htmlFor="edit-title"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              {t("title")} *
            </label>
            <input
              id="edit-title"
              name="title"
              required
              minLength={5}
              maxLength={150}
              defaultValue={post.title}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t("titlePlaceholder")}
            />
          </div>

          <div>
            <label
              htmlFor="edit-type"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              {t("type")} *
            </label>
            <select
              id="edit-type"
              name="type"
              required
              defaultValue={post.type}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {POST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`types.${type}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="edit-content"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              {t("content")} *
            </label>
            <textarea
              id="edit-content"
              name="content"
              required
              minLength={10}
              maxLength={10000}
              rows={10}
              defaultValue={post.content}
              className="w-full rounded-lg border border-border bg-input p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t("contentPlaceholder")}
            />
          </div>

          <div>
            <label
              htmlFor="edit-tags"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              {t("tags")}
            </label>
            <input
              id="edit-tags"
              name="tags"
              maxLength={200}
              defaultValue={tagsValue}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t("tagsPlaceholder")}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("tagsHint")}
            </p>
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              t("saveChanges")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
