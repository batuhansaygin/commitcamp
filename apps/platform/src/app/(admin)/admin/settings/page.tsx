import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllSettings } from "@/lib/actions/admin/settings";
import { AdminSettingsPanel } from "@/components/admin/admin-settings-panel";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform Settings — Admin",
};

async function SettingsContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "system_admin") {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Platform Settings requires <strong>system_admin</strong> role.
          </p>
        </CardContent>
      </Card>
    );
  }

  const settings = await getAllSettings();
  return <AdminSettingsPanel settings={settings} />;
}

export default function AdminSettingsPage() {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure platform-wide features, OAuth providers, and rate limits.
          Changes to OAuth settings are synced to Supabase automatically.
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading settings…</p>
            </CardContent>
          </Card>
        }
      >
        <SettingsContent />
      </Suspense>
    </div>
  );
}
