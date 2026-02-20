import { Suspense } from "react";
import { listAchievementsAdmin } from "@/lib/actions/admin/achievements";
import { AdminAchievementsPanel } from "@/components/admin/admin-achievements-panel";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Achievement Management — Admin",
};

async function AchievementsContent() {
  const achievements = await listAchievementsAdmin();
  return <AdminAchievementsPanel achievements={achievements} />;
}

export default function AdminAchievementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Achievements</h1>
        <p className="text-sm text-muted-foreground">
          Create, edit, and manage platform achievements.
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading achievements…</p>
            </CardContent>
          </Card>
        }
      >
        <AchievementsContent />
      </Suspense>
    </div>
  );
}
