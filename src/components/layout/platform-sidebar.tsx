"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/layout/notification-badge";
import { X, Home, FileCode, MessageCircle, BookMarked, User, Wrench } from "lucide-react";

interface PlatformSidebarProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS: { href: string; icon: typeof Home; label: string; showBadge?: boolean }[] = [
  { href: "/feed", icon: Home, label: "Feed" },
  { href: "/snippets", icon: FileCode, label: "Snippets" },
  { href: "/forum", icon: MessageCircle, label: "Forum" },
  { href: "/messages", icon: BookMarked, label: "Messages", showBadge: true },
  { href: "/settings", icon: User, label: "Settings" },
];

export function PlatformSidebar({ open, onClose }: PlatformSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-60 flex-col border-r border-border bg-background transition-transform duration-300 md:sticky md:top-16 md:z-0 md:h-[calc(100vh-4rem)] md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4 md:hidden">
          <span className="font-bold gradient-text">CommitCamp</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            const showBadge = item.showBadge === true;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {showBadge && (
                  <span className="ml-auto">
                    <NotificationBadge />
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <Link
            href="/tools"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Wrench className="h-4 w-4" />
            Developer Tools
          </Link>
        </div>
      </aside>
    </>
  );
}
