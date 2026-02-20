"use client";

import { useState } from "react";
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
  ShieldCheck,
  ChevronRight,
  KanbanSquare,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin",              label: "Dashboard",        icon: LayoutDashboard, exact: true },
  { href: "/admin/tasks",        label: "Task Board",       icon: KanbanSquare },
  { href: "/admin/users",        label: "Users",            icon: Users },
  { href: "/admin/content",      label: "Content",          icon: FileText },
  { href: "/admin/achievements", label: "Achievements",     icon: Trophy },
  { href: "/admin/roles",        label: "Role Matrix",      icon: ShieldCheck },
  { href: "/admin/settings",     label: "Platform Settings",icon: Settings2, systemAdminOnly: true },
  { href: "/admin/audit",        label: "Audit Logs",       icon: ScrollText },
];

interface Props {
  userRole: string;
}

export function AdminSidebar({ userRole }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href || pathname === href + "/" : pathname.startsWith(href);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.systemAdminOnly || userRole === "system_admin"
  );

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-border bg-card/30 transition-[width] duration-200 ease-in-out md:flex md:flex-col",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center border-b border-border",
        collapsed ? "justify-center px-2 py-4" : "gap-2 px-4 py-4"
      )}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600">
          <Shield className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Admin Panel</p>
            <p className="truncate text-[10px] capitalize text-muted-foreground">
              {userRole.replace("_", " ")}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {visibleItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
                collapsed ? "justify-center" : "justify-between",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span className={cn("flex shrink-0 items-center", collapsed ? "" : "gap-3")}>
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {!collapsed && item.label}
              </span>
              {!collapsed && active && <ChevronRight className="h-3 w-3 shrink-0 text-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-2 space-y-1">
        {/* Back to platform */}
        <Link
          href="/feed"
          title={collapsed ? "Back to CommitCamp" : undefined}
          className={cn(
            "flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            collapsed && "justify-center"
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && "Back to CommitCamp"}
        </Link>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            collapsed && "justify-center"
          )}
        >
          {collapsed
            ? <PanelLeftOpen className="h-3.5 w-3.5 shrink-0" />
            : <><PanelLeftClose className="h-3.5 w-3.5 shrink-0" /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  );
}
