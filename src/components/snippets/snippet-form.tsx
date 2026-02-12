"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createSnippet } from "@/lib/actions/snippets";
import { SNIPPET_LANGUAGES } from "@/lib/types/snippets";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";

export function SnippetForm() {
  const t = useTranslations("snippets");
  const [state, action, pending] = useActionState(createSnippet, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("newSnippet")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {/* Error message */}
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

          {/* Visibility */}
          <div className="flex items-center gap-2">
            <input
              type="hidden"
              name="is_public"
              value="true"
            />
            <Badge variant="info" className="text-xs">
              {t("publicSnippet")}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {t("publicNote")}
            </span>
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
