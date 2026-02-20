import { getTranslations, setRequestLocale } from "@/lib/i18n-server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Plus, Code2 } from "lucide-react";
import { getSnippets } from "@/lib/actions/snippets";
import { SnippetCard } from "@/components/snippets/snippet-card";
import { SnippetsLiveUpdater } from "@/components/snippets/snippets-live-updater";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Snippets" };

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SnippetsPage({ params }: PageProps) {
  const t = await getTranslations("snippets");

  const { data: snippets } = await getSnippets();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/snippets/new">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" /> {t("createSnippet")}
          </Button>
        </Link>
      </div>

      {/* Real-time banner: new snippets notification */}
      <SnippetsLiveUpdater />

      {/* Snippet grid */}
      {snippets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {snippets.map((snippet) => (
            <SnippetCard key={snippet.id} snippet={snippet} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Code2 className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t("noSnippets")}</p>
            <Link href="/snippets/new">
              <Button variant="outline" size="sm">
                <Plus className="mr-1 h-4 w-4" /> {t("createSnippet")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
