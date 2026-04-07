import { Link } from "@/i18n/navigation";
import { getTodayAiUsageSummary } from "@/lib/actions/billing/usage";
import { getTranslations } from "@/lib/i18n-server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export async function UsageStatsWidget() {
  const summary = await getTodayAiUsageSummary();
  const t = await getTranslations("settings.aiUsage");

  if (!summary) {
    return null;
  }

  const { plan, items } = summary;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("title")}</CardTitle>
          <Badge variant={plan === "free" ? "secondary" : "default"}>
            {plan === "free" ? t("planFree") : plan === "team" ? t("planTeam") : t("planPro")}
          </Badge>
        </div>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2 text-sm">
          {items.map((row) => (
            <li
              key={row.tool}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <span className="font-medium">{t(`tools.${row.tool}`)}</span>
              <span className="text-muted-foreground">
                {row.unlimited ? (
                  t("unlimited")
                ) : (
                  <>
                    {row.used} / {row.limit} {t("today")}
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
        {plan === "free" ? (
          <p className="text-xs text-muted-foreground">
            {t("upgradeHint")}{" "}
            <Link href="/pricing" className="font-medium text-primary underline-offset-4 hover:underline">
              {t("pricingLink")}
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
