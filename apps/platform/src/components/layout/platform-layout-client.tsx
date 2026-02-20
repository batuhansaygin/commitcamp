"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PlatformSidebar } from "@/components/layout/platform-sidebar";
import { SearchCommand } from "@/components/search/search-command";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AIChatWidget } from "@/components/ai/ai-chat-widget";
import { UserProvider } from "@/components/providers/user-provider";
import type { UserProfile } from "@/components/providers/user-provider";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface PlatformLayoutClientProps {
  initialUser: SupabaseUser | null;
  initialProfile: UserProfile | null;
  children: React.ReactNode;
}

export function PlatformLayoutClient({
  initialUser,
  initialProfile,
  children,
}: PlatformLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <UserProvider initialUser={initialUser} initialProfile={initialProfile}>
      <div className="flex min-h-screen flex-col">
        <Header showMenuButton onToggleSidebar={() => setSidebarOpen(true)} />
        <div className="flex flex-1 min-h-0">
          <PlatformSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <main className="flex-1 min-h-0 flex flex-col overflow-hidden p-4 pb-20 md:p-6 md:pb-6">
            <div className="flex-1 min-h-0 overflow-y-auto animate-fade-in">
              {children}
            </div>
          </main>
        </div>
        <SearchCommand />
        <BottomNav />
        <AIChatWidget />
      </div>
    </UserProvider>
  );
}
