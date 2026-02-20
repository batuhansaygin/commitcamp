"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin?: {
    username: string;
    display_name: string | null;
  };
}

export async function logAdminAction(
  action: string,
  targetType: string | null,
  targetId: string | null,
  metadata?: Record<string, unknown>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin.from("admin_audit_logs").insert({
    admin_id: user.id,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata: metadata ?? null,
  });
}

export async function getAuditLogs(
  limit = 50,
  offset = 0,
  actionFilter?: string
) {
  const admin = createAdminClient();

  let query = admin
    .from("admin_audit_logs")
    .select("id, admin_id, action, target_type, target_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (actionFilter) {
    query = query.eq("action", actionFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const logs = data ?? [];
  if (logs.length === 0) return [] as AuditLogEntry[];

  // Fetch profile info for all distinct admin ids
  const adminIds = [...new Set(logs.map((l) => l.admin_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, username, display_name")
    .in("id", adminIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, { username: p.username, display_name: p.display_name }])
  );

  return logs.map((l) => ({
    ...l,
    admin: profileMap[l.admin_id] ?? null,
  })) as AuditLogEntry[];
}
