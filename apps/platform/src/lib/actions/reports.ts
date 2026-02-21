"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/actions/admin/audit";

const REPORT_TARGET_TYPES = ["post", "snippet", "comment"] as const;
const REPORT_REASONS = [
  "spam",
  "harassment",
  "inappropriate",
  "copyright",
  "other",
] as const;
const REPORT_STATUSES = ["pending", "reviewed", "resolved", "dismissed"] as const;

export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];
export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];

const createReportSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: z.string().uuid("Invalid target id"),
  reason: z.enum(REPORT_REASONS),
  details: z
    .string()
    .trim()
    .max(1000, "Details must be at most 1000 characters")
    .optional()
    .transform((value) => value ?? ""),
});

const listReportsFiltersSchema = z.object({
  status: z.enum(REPORT_STATUSES).optional(),
  targetType: z.enum(REPORT_TARGET_TYPES).optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

interface ActionResult {
  error?: string;
  success?: boolean;
}

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

export async function createReport(input: {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}): Promise<ActionResult> {
  const parsed = createReportSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { error: firstIssue?.message ?? "Invalid input" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "You must be signed in to report content." };

    const { targetType, targetId, reason, details } = parsed.data;

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details || null,
    });

    if (error) return { error: error.message };

    revalidatePath("/admin/reports");
    return { success: true };
  } catch {
    return { error: "Failed to submit report." };
  }
}

export async function listReportsAdmin(filters: {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  limit?: number;
  offset?: number;
} = {}) {
  await requireAdminUser();
  const parsed = listReportsFiltersSchema.parse(filters);
  const admin = createAdminClient();

  let query = admin
    .from("reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, details, status, reviewed_by, reviewed_at, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(parsed.offset, parsed.offset + parsed.limit - 1);

  if (parsed.status) query = query.eq("status", parsed.status);
  if (parsed.targetType) query = query.eq("target_type", parsed.targetType);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const reporterIds = [...new Set((data ?? []).map((row) => row.reporter_id))];
  const reviewerIds = [...new Set((data ?? []).map((row) => row.reviewed_by).filter(Boolean))];
  const allUserIds = [...new Set([...reporterIds, ...reviewerIds])];

  const { data: users } = allUserIds.length
    ? await admin
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", allUserIds)
    : { data: [] };

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  const reports = (data ?? []).map((row) => ({
    ...row,
    reporter: userMap.get(row.reporter_id) ?? null,
    reviewer: row.reviewed_by ? (userMap.get(row.reviewed_by) ?? null) : null,
  }));

  return { reports, total: count ?? 0 };
}

export async function updateReportStatusAdmin(
  reportId: string,
  status: ReportStatus
): Promise<ActionResult> {
  const user = await requireAdminUser();
  const admin = createAdminClient();

  const { error } = await admin
    .from("reports")
    .update({
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) return { error: error.message };

  await logAdminAction("update_report_status", "report", reportId, { status });
  revalidatePath("/admin/reports");
  return { success: true };
}

export async function adminDeleteReportedTarget(reportId: string): Promise<ActionResult> {
  const user = await requireAdminUser();
  const admin = createAdminClient();

  const { data: report, error: reportError } = await admin
    .from("reports")
    .select("id, target_type, target_id")
    .eq("id", reportId)
    .single();

  if (reportError) return { error: reportError.message };
  if (!report) return { error: "Report not found." };

  const table =
    report.target_type === "post"
      ? "posts"
      : report.target_type === "snippet"
        ? "snippets"
        : "comments";

  const { error: deleteError } = await admin.from(table).delete().eq("id", report.target_id);
  if (deleteError) return { error: deleteError.message };

  const { error: updateError } = await admin
    .from("reports")
    .update({
      status: "resolved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", report.id);

  if (updateError) return { error: updateError.message };

  await logAdminAction("delete_reported_target", report.target_type, report.target_id, {
    report_id: report.id,
  });

  revalidatePath("/admin/reports");
  revalidatePath("/forum", "layout");
  revalidatePath("/snippets", "layout");
  revalidatePath("/feed", "layout");
  return { success: true };
}
