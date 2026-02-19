import { useTranslations } from "@/lib/i18n";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row md:px-6">
        <p className="text-xs text-muted-foreground">
          &copy; {year} CommitCamp. {t("allRightsReserved")}
        </p>
        <p className="text-xs text-muted-foreground">{t("builtWith")}</p>
        <Link
          href="/admin"
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          {t("adminLogin")}
        </Link>
      </div>
    </footer>
  );
}
