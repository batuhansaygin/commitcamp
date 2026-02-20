import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, username")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "system_admin"].includes(profile.role)) {
    redirect("/feed");
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar userRole={profile.role} />

      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-border bg-card/30 px-6 py-3">
          <div />
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              Signed in as{" "}
              <span className="font-medium text-foreground">
                {profile.display_name ?? profile.username}
              </span>
            </span>
            <span className="rounded border border-border bg-muted/40 px-2 py-0.5 text-[10px] capitalize font-medium">
              {profile.role.replace("_", " ")}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
