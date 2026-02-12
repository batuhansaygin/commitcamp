"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PlatformSidebar } from "@/components/layout/platform-sidebar";

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <Header showMenuButton onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1">
        <PlatformSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
