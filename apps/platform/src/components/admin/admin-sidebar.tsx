"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Trophy,
  Settings2,
  ScrollText,
  Shield,
  ChevronRight,
  KanbanSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/tasks",
    label: "Task Board",
    icon: KanbanSquare,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
  },
  {
    href: "/admin/content",
    label: "Content",
    icon: FileText,
  },
  {
    href: "/admin/achievements",
    label: "Achievements",
    icon: Trophy,
  },
  {
    href: "/admin/settings",
    label: "Platform Settings",
    icon: Settings2,
    systemAdminOnly: true,
  },
  {
    href: "/admin/audit",
    label: "Audit Logs",
    icon: ScrollText,
  },
];

interface Props {
  userRole: string;
}

export function AdminSidebar({ userRole }: Props) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href || pathname === href + "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/30 md:flex md:flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-accent to-purple-accent">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold">Admin Panel</p>
          <p className="text-[10px] capitalize text-muted-foreground">
            {userRole.replace("_", " ")}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV_ITEMS.filter(
          (item) => !item.systemAdminOnly || userRole === "system_admin"
        ).map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-3">
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.label}
              </span>
              {active && <ChevronRight className="h-3 w-3 text-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Back to platform */}
      <div className="border-t border-border p-3">
        <Link
          href="/feed"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          ← Back to CommitCamp
        </Link>
      </div>
    </aside>
  );
}
