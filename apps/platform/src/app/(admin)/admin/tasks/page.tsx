import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listTasks, listAdminUsers, listProjects } from "@/lib/actions/admin/tasks";
import { TaskBoard } from "@/components/admin/task-board";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Task Board — Admin",
};

export default async function AdminTasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "system_admin"].includes(profile.role)) {
    redirect("/feed");
  }

  const [tasks, adminUsers, projects] = await Promise.all([
    listTasks(),
    listAdminUsers(),
    listProjects(),
  ]);

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      <TaskBoard
        initialTasks={tasks}
        initialProjects={projects}
        adminUsers={adminUsers}
        currentUserId={user.id}
      />
    </div>
  );
}
