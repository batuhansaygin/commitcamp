"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useTranslations } from "@/lib/i18n";
import { createSnippet } from "@/lib/actions/snippets";
import { SNIPPET_LANGUAGES } from "@/lib/types/snippets";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, AlertCircle, Globe, Lock } from "lucide-react";

interface SnippetFormProps {}

export function SnippetForm(_: SnippetFormProps) {
  const t = useTranslations("snippets");
  const [state, action, pending] = useActionState(createSnippet, {});
  const [isPublic, setIsPublic] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("newSnippet")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">          {/* Error message */}
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
              minLength={3}
              maxLength={100}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t("titlePlaceholder")}
            />
          </div>

          {/* Language */}
          <div>
            <label
              htmlFor="language"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              {t("language")} *
            </label>
            <select
              id="language"
              name="language"
              required
              defaultValue=""
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="" disabled>
                {t("selectLanguage")}
              </option>
              {SNIPPET_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Code */}
          <div>
            <label
              htmlFor="code"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              {t("code")} *
            </label>
            <textarea
              id="code"
              name="code"
              required
              minLength={1}
              maxLength={50000}
              rows={12}
              className="w-full rounded-lg border border-border bg-input p-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t("codePlaceholder")}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              {t("description")}
            </label>
            <textarea
              id="description"
              name="description"
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-border bg-input p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t("descriptionPlaceholder")}
            />
          </div>

          {/* Visibility: same pill style as forum grid/flow */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              {t("visibility")}
            </span>
            <input type="hidden" name="is_public" value={isPublic ? "true" : "false"} />
            <div
              className="flex rounded-lg border border-border bg-muted/30 p-0.5"
              role="group"
              aria-label={t("visibility")}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors",
                  isPublic
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setIsPublic(true)}
                aria-pressed={isPublic}
              >
                <Globe className="h-3.5 w-3.5" />
                {t("everyone")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 gap-1.5 px-2.5 text-xs font-medium transition-colors",
                  !isPublic
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setIsPublic(false)}
                aria-pressed={!isPublic}
              >
                <Lock className="h-3.5 w-3.5" />
                {t("onlyMe")}
              </Button>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("creating")}
              </>
            ) : (
              t("createSnippet")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
