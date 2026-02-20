"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Trophy,
  Settings2,
  ScrollText,
  KanbanSquare,
  BarChart3,
  Shield,
  ShieldCheck,
} from "lucide-react";

interface PageMeta {
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
}

const PAGE_META: { href: string; exact?: boolean; meta: PageMeta }[] = [
  {
    href: "/admin",
    exact: true,
    meta: {
      label: "Dashboard",
      description: "Live platform overview and key metrics",
      icon: LayoutDashboard,
      accent: "text-cyan-400",
    },
  },
  {
    href: "/admin/tasks",
    meta: {
      label: "Task Board",
      description: "Manage and track admin tasks across projects",
      icon: KanbanSquare,
      accent: "text-violet-400",
    },
  },
  {
    href: "/admin/users",
    meta: {
      label: "User Management",
      description: "Browse, search and manage platform members",
      icon: Users,
      accent: "text-blue-400",
    },
  },
  {
    href: "/admin/content",
    meta: {
      label: "Content Moderation",
      description: "Review and moderate posts, snippets and comments",
      icon: FileText,
      accent: "text-emerald-400",
    },
  },
  {
    href: "/admin/achievements",
    meta: {
      label: "Achievements",
      description: "Configure badges and achievement milestones",
      icon: Trophy,
      accent: "text-yellow-400",
    },
  },
  {
    href: "/admin/reports",
    meta: {
      label: "Reports",
      description: "Platform analytics and usage statistics",
      icon: BarChart3,
      accent: "text-orange-400",
    },
  },
  {
    href: "/admin/audit",
    meta: {
      label: "Audit Logs",
      description: "Full history of all admin actions on the platform",
      icon: ScrollText,
      accent: "text-slate-400",
    },
  },
  {
    href: "/admin/roles",
    meta: {
      label: "Role Matrix",
      description: "Permission hierarchy for all platform roles",
      icon: ShieldCheck,
      accent: "text-cyan-400",
    },
  },
  {
    href: "/admin/settings",
    meta: {
      label: "Platform Settings",
      description: "System-wide configuration and advanced controls",
      icon: Settings2,
      accent: "text-red-400",
    },
  },
];

function getCurrentPage(pathname: string): PageMeta {
  // Check exact matches first, then prefix matches
  const exact = PAGE_META.find((p) => p.exact && pathname === p.href);
  if (exact) return exact.meta;

  const prefix = PAGE_META.filter((p) => !p.exact)
    .sort((a, b) => b.href.length - a.href.length) // longest match wins
    .find((p) => pathname.startsWith(p.href));

  return (
    prefix?.meta ?? {
      label: "Admin Panel",
      description: "CommitCamp administration",
      icon: Shield,
      accent: "text-primary",
    }
  );
}

interface Props {
  displayName: string;
  avatarUrl: string | null;
}

export function AdminHeader({ displayName, avatarUrl }: Props) {
  const pathname = usePathname();
  const page = getCurrentPage(pathname);
  const Icon = page.icon;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-border bg-card/30 px-6 py-3">
      {/* Left — current page context */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
          <Icon className={`h-4 w-4 ${page.accent}`} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">{page.label}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {page.description}
          </p>
        </div>
      </div>

      {/* Right — identity */}
      <div className="flex items-center gap-3">
        <span className="hidden text-xs font-medium text-foreground sm:inline">
          {displayName}
        </span>
        <div className="relative h-7 w-7 overflow-hidden rounded-full bg-gradient-to-br from-cyan-500 to-purple-600">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
              {initial}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
