"use client";

import { useState } from "react";
import { BackButton } from "@/components/layout/back-button";
import { Header } from "@/components/layout/header";
import { ToolsSidebar } from "@/components/layout/tools-sidebar";
import { ToolHistoryTracker } from "@/components/tools/tool-history-tracker";

interface ToolsLayoutProps {
  children: React.ReactNode;
}

export default function ToolsLayout({ children }: ToolsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <ToolHistoryTracker />
      <Header
        showMenuButton
        onToggleSidebar={() => setSidebarOpen(true)}
      />
      <div className="flex flex-1">
        <ToolsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="animate-fade-in">
            <div className="mb-4">
              <BackButton />
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
