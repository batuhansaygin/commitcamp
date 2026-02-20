"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface AdminProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
}

export interface AdminProject {
  id: string;
  name: string;
  description: string | null;
  color: string;
  assignee_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  assignee?: AdminProfile | null;
  task_count?: number;
}

export interface TaskAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export interface AdminTask {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  created_by: string;
  due_date: string | null;
  labels: string[];
  position: number;
  project_id: string | null;
  attachments: TaskAttachment[];
  created_at: string;
  updated_at: string;
  assignee?: AdminProfile | null;
  creator?: AdminProfile | null;
  project?: AdminProject | null;
  comment_count?: number;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: AdminProfile | null;
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "system_admin"].includes(profile.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

// ── Label suggestions ─────────────────────────────────────────────────────────

export async function listAllLabels(): Promise<string[]> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data } = await admin
    .from("admin_tasks")
    .select("labels")
    .not("labels", "eq", "{}");

  if (!data) return [];

  const all = data.flatMap((t) => t.labels as string[]);
  const unique = [...new Set(all)].sort((a, b) => a.localeCompare(b));
  return unique;
}

// ── Admin user list ───────────────────────────────────────────────────────────

export async function listAdminUsers(): Promise<AdminProfile[]> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("id, username, display_name, avatar_url, role")
    .in("role", ["admin", "system_admin"])
    .order("display_name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Projects CRUD ─────────────────────────────────────────────────────────────

export async function listProjects(): Promise<AdminProject[]> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: projects, error } = await admin
    .from("admin_projects")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  // Count tasks per project
  const { data: taskCounts } = await admin
    .from("admin_tasks")
    .select("project_id");

  const countMap = new Map<string, number>();
  for (const t of taskCounts ?? []) {
    if (t.project_id) {
      countMap.set(t.project_id, (countMap.get(t.project_id) ?? 0) + 1);
    }
  }

  // Enrich with assignee profile
  const assigneeIds = [...new Set((projects ?? []).map((p) => p.assignee_id).filter(Boolean))] as string[];
  const { data: profiles } = assigneeIds.length
    ? await admin.from("profiles").select("id, username, display_name, avatar_url, role").in("id", assigneeIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (projects ?? []).map((p) => ({
    ...p,
    assignee: p.assignee_id ? profileMap.get(p.assignee_id) ?? null : null,
    task_count: countMap.get(p.id) ?? 0,
  }));
}

export async function createProject(input: {
  name: string;
  description?: string;
  color?: string;
  assignee_id?: string | null;
}): Promise<AdminProject> {
  const user = await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("admin_projects")
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      color: input.color ?? "#6366f1",
      assignee_id: input.assignee_id ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/tasks");
  return { ...data, task_count: 0 };
}

export async function updateProject(
  id: string,
  updates: Partial<{
    name: string;
    description: string | null;
    color: string;
    assignee_id: string | null;
  }>
): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("admin_projects").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/tasks");
}

export async function deleteProject(id: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("admin_projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/tasks");
}

// ── Tasks CRUD ────────────────────────────────────────────────────────────────

/**
 * List tasks grouped by status.
 * @param projectId  - when provided, filters to that project's tasks only.
 *                     Pass null to get tasks with no project assigned.
 *                     Omit (undefined) to get all tasks regardless of project.
 */
export async function listTasks(
  projectId?: string | null
): Promise<Record<TaskStatus, AdminTask[]>> {
  await requireAdmin();
  const admin = createAdminClient();

  let query = admin
    .from("admin_tasks")
    .select("*, comment_count:admin_task_comments(count)")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (projectId !== undefined) {
    query = query.eq("project_id", projectId ?? null);
  }

  const { data: tasks, error } = await query;
  if (error) throw new Error(error.message);

  // Collect all user IDs for profile enrichment
  const userIds = [
    ...new Set([
      ...(tasks ?? []).map((t) => t.assignee_id).filter(Boolean),
      ...(tasks ?? []).map((t) => t.created_by),
    ]),
  ] as string[];

  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, username, display_name, avatar_url, role").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Collect project IDs for project enrichment
  const projectIds = [...new Set((tasks ?? []).map((t) => t.project_id).filter(Boolean))] as string[];
  const { data: projects } = projectIds.length
    ? await admin.from("admin_projects").select("id, name, color, description, assignee_id, created_by, created_at, updated_at").in("id", projectIds)
    : { data: [] };

  const projectMap = new Map((projects ?? []).map((p) => [p.id, p]));

  const enriched: AdminTask[] = (tasks ?? []).map((t) => ({
    ...t,
    comment_count: (t.comment_count as { count: number }[])?.[0]?.count ?? 0,
    assignee: t.assignee_id ? profileMap.get(t.assignee_id) ?? null : null,
    creator: profileMap.get(t.created_by) ?? null,
    project: t.project_id ? (projectMap.get(t.project_id) ?? null) : null,
  }));

  const grouped: Record<TaskStatus, AdminTask[]> = {
    backlog: [],
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  };

  for (const task of enriched) {
    grouped[task.status as TaskStatus].push(task);
  }

  return grouped;
}

export async function createTask(input: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignee_id?: string | null;
  due_date?: string | null;
  labels?: string[];
  status?: TaskStatus;
  project_id?: string | null;
  attachments?: TaskAttachment[];
}): Promise<AdminTask> {
  const user = await requireAdmin();
  const admin = createAdminClient();

  const status = input.status ?? "todo";
  const { count } = await admin
    .from("admin_tasks")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  const { data, error } = await admin
    .from("admin_tasks")
    .insert({
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? "medium",
      assignee_id: input.assignee_id ?? null,
      due_date: input.due_date ?? null,
      labels: input.labels ?? [],
      status,
      position: count ?? 0,
      created_by: user.id,
      project_id: input.project_id ?? null,
      attachments: input.attachments ?? [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/tasks");
  return data;
}

export async function updateTask(
  id: string,
  updates: Partial<{
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    assignee_id: string | null;
    due_date: string | null;
    labels: string[];
    position: number;
    project_id: string | null;
    attachments: TaskAttachment[];
  }>
): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("admin_tasks").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/tasks");
}

export async function moveTask(
  taskId: string,
  newStatus: TaskStatus,
  newPosition: number
): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("admin_tasks")
    .update({ status: newStatus, position: newPosition })
    .eq("id", taskId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/tasks");
}

export async function deleteTask(id: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("admin_tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/tasks");
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function listTaskComments(taskId: string): Promise<TaskComment[]> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: comments, error } = await admin
    .from("admin_task_comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const userIds = [...new Set((comments ?? []).map((c) => c.user_id))];
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, username, display_name, avatar_url, role").in("id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (comments ?? []).map((c) => ({
    ...c,
    author: profileMap.get(c.user_id) ?? null,
  }));
}

export async function addTaskComment(taskId: string, content: string): Promise<void> {
  const user = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("admin_task_comments").insert({
    task_id: taskId,
    user_id: user.id,
    content: content.trim(),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/tasks");
}

export async function deleteTaskComment(commentId: string): Promise<void> {
  const user = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("admin_task_comments")
    .delete()
    .eq("id", commentId)
    .or(`user_id.eq.${user.id}`);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/tasks");
}
