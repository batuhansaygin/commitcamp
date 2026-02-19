import { getTranslations, setRequestLocale } from "@/lib/i18n-server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { NotificationsPageClient } from "@/components/notifications/notifications-page-client";
import { getCurrentProfile } from "@/lib/actions/profiles";
import { getNotifications } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import type { Metadata } from "next";
import type { NotificationType } from "@/lib/types/notifications";

export const metadata: Metadata = { title: "Notifications" };

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
}

const FILTERS: { value: NotificationType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "like", label: "Likes" },
  { value: "comment", label: "Comments" },
  { value: "follow", label: "Follows" },
];

export default async function NotificationsPage({
  params,
  searchParams,
}: PageProps) {
  const { filter: rawFilter } = await searchParams;
  const t = await getTranslations("notifications");

  const { data: profile, error } = await getCurrentProfile();

  if (error === "Not authenticated") {
    redirect(`/login?redirect=/notifications`);
  }

  if (!profile) return null;

  const validFilters: (NotificationType | "all")[] = [
    "all",
    "like",
    "comment",
    "follow",
  ];
  const activeFilter: NotificationType | "all" = validFilters.includes(
    rawFilter as NotificationType | "all"
  )
    ? (rawFilter as NotificationType | "all")
    : "all";

  const { data: initialNotifications } = await getNotifications(
    profile.id,
    30,
    0
  );

  return (
    <div className="mx-auto max-w-2xl w-full space-y-4">
      {/* Header — left-aligned, no back button */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6 text-primary" />
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("description")}</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={
              f.value === "all"
                ? "/notifications"
                : `/notifications?filter=${f.value}`
            }
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium transition-colors",
              activeFilter === f.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.value === "all"
              ? t("filters.all")
              : f.value === "like"
              ? t("filters.likes")
              : f.value === "comment"
              ? t("filters.comments")
              : t("filters.follows")}
          </Link>
        ))}
      </div>

      <NotificationsPageClient
        userId={profile.id}
        initialNotifications={initialNotifications}
        typeFilter={activeFilter === "all" ? undefined : activeFilter}
      />
    </div>
  );
}
