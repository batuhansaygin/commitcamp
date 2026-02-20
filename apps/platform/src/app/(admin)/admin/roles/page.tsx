import { RoleMatrix } from "@/components/admin/role-matrix";
import { getRolePermissions } from "@/lib/actions/admin/role-permissions";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Role Matrix — Admin",
  description: "CommitCamp role hierarchy and permission matrix.",
};

export default async function AdminRolesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isSystemAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isSystemAdmin = profile?.role === "system_admin";
  }

  const initialPermissions = await getRolePermissions();

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">Role Matrix</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comprehensive overview of what each role can and cannot do on the platform.
          The <span className="font-medium text-red-400">system_admin</span> role is
          fully immutable — it has unrestricted access to every feature and cannot be
          modified, banned, or deleted by anyone.
          {isSystemAdmin && (
            <span className="ml-1 text-emerald-400 font-medium">
              Click any cell to toggle permissions, then save.
            </span>
          )}
        </p>
      </div>

      <RoleMatrix initialPermissions={initialPermissions} isSystemAdmin={isSystemAdmin} />
    </div>
  );
}
