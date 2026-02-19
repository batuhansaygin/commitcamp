"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PlatformSidebar } from "@/components/layout/platform-sidebar";
import { SearchCommand } from "@/components/search/search-command";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AIChatWidget } from "@/components/ai/ai-chat-widget";

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Header showMenuButton onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-0">
        <PlatformSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden p-4 pb-20 md:p-6 md:pb-6">
          <div className="flex-1 min-h-0 overflow-y-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      {/* Global Cmd+K search */}
      <SearchCommand />
      {/* Mobile bottom navigation — hidden on md+ */}
      <BottomNav />
      {/* Floating AI chat widget — hidden on /ai-assistant page */}
      <AIChatWidget />
    </div>
  );
}
