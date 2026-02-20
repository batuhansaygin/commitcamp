import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

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
    .select("role, display_name, username, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "system_admin"].includes(profile.role)) {
    redirect("/feed");
  }

  const displayName = profile.display_name ?? profile.username ?? "Admin";

  return (
    <div className="flex min-h-screen">
      <AdminSidebar userRole={profile.role} />

      <div className="flex flex-1 flex-col min-w-0">
        <AdminHeader
          displayName={displayName}
          avatarUrl={profile.avatar_url ?? null}
        />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
