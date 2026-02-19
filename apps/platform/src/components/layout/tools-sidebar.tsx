"use client";

import { useTranslations } from "@/lib/i18n";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolsSidebarProps {
  open: boolean;
  onClose: () => void;
}

interface ToolItem {
  href: string;
  icon: string;
  titleKey: string;
}

const TOOL_GROUPS: { labelKey: string; tools: ToolItem[] }[] = [
  {
    labelKey: "transform",
    tools: [
      { href: "/tools/json-formatter", icon: "{ }", titleKey: "jsonFormatter" },
      { href: "/tools/regex-tester", icon: ".*", titleKey: "regexTester" },
      { href: "/tools/base64-encoder", icon: "B64", titleKey: "base64Encoder" },
    ],
  },
  {
    labelKey: "generate",
    tools: [
      { href: "/tools/color-converter", icon: "◆", titleKey: "colorConverter" },
      { href: "/tools/uuid-generator", icon: "#", titleKey: "uuidGenerator" },
      { href: "/tools/lorem-generator", icon: "¶", titleKey: "loremGenerator" },
    ],
  },
  {
    labelKey: "decode",
    tools: [
      { href: "/tools/jwt-decoder", icon: "🔑", titleKey: "jwtDecoder" },
      { href: "/tools/timestamp-converter", icon: "⏱", titleKey: "timestampConverter" },
    ],
  },
];

export function ToolsSidebar({ open, onClose }: ToolsSidebarProps) {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tTools = useTranslations("tools");

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-[270px] flex-col border-r border-border bg-background transition-transform duration-300 md:sticky md:top-16 md:z-0 md:h-[calc(100vh-4rem)] md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-border p-4 md:hidden">
          <span className="font-bold gradient-text">CommitCamp</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {TOOL_GROUPS.map((group) => (
            <div key={group.labelKey} className="mb-4">
              <span className="mb-1 block px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {tNav(group.labelKey)}
              </span>
              {group.tools.map((tool) => {
                const isActive = pathname === tool.href;
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-xs font-mono">
                      {tool.icon}
                    </span>
                    <span>{tTools(`${tool.titleKey}.title`)}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-4 text-center">
          <p className="text-[10px] font-medium text-muted-foreground">
            100% Client-Side
          </p>
          <p className="text-[9px] text-muted-foreground/60">
            No data is sent to any server
          </p>
        </div>
      </aside>
    </>
  );
}
