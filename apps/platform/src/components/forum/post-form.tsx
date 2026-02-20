"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { createPost } from "@/lib/actions/posts";
import { POST_TYPES } from "@/lib/types/posts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Loader2, AlertCircle } from "lucide-react";

type ActionState = { error?: string };

export function PostForm() {
  const t = useTranslations("forum");
  const [content, setContent] = useState("");
  const [state, setState] = useState<ActionState>({});
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setState({});
    const formData = new FormData(e.currentTarget);
    formData.set("content", content);
    const result = await createPost({}, formData);
    setState(result ?? {});
    setPending(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("newPost")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {state.error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          )}

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              {t("title")} *
            </label>
            <input
              id="title"
              name="title"
              required
              minLength={5}
              maxLength={150}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t("titlePlaceholder")}
            />
          </div>

          {/* Type */}
          <div>
            <label
              htmlFor="type"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              {t("type")} *
            </label>
            <select
              id="type"
              name="type"
              required
              defaultValue="discussion"
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {POST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`types.${type}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {t("content")} *
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder={t("contentPlaceholder")}
              minHeight="200px"
            />
          </div>

          {/* Tags */}
          <div>
            <label
              htmlFor="tags"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              {t("tags")}
            </label>
            <input
              id="tags"
              name="tags"
              maxLength={200}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t("tagsPlaceholder")}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("tagsHint")}
            </p>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("publishing")}
              </>
            ) : (
              t("publishPost")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
