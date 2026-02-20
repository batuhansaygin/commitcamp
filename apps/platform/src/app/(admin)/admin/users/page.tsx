import { Suspense } from "react";
import { listUsers } from "@/lib/actions/admin/users";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management — Admin",
};

interface PageProps {
  searchParams: Promise<{ search?: string; role?: string; page?: string }>;
}

async function UsersContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search ?? "";
  const role = params.role ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  const { users, total } = await listUsers(search, role, limit, offset);

  return (
    <AdminUsersTable
      users={users}
      total={total}
      page={page}
      limit={limit}
      search={search}
      roleFilter={role}
    />
  );
}

export default function AdminUsersPage(props: PageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-sm text-muted-foreground">
          View, search, and manage all platform users.
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <div className="text-sm text-muted-foreground">Loading users…</div>
            </CardContent>
          </Card>
        }
      >
        <UsersContent {...props} />
      </Suspense>
    </div>
  );
}
