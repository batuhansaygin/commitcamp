import { Suspense } from "react";
import { getAuditLogs } from "@/lib/actions/admin/audit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit Logs — Admin",
};

const ACTION_COLORS: Record<string, string> = {
  ban_user:           "bg-red-500/15 text-red-400",
  unban_user:         "bg-emerald-500/15 text-emerald-400",
  delete_user:        "bg-red-500/25 text-red-400",
  change_role:        "bg-purple-500/15 text-purple-400",
  verify_user:        "bg-blue-500/15 text-blue-400",
  unverify_user:      "bg-muted text-muted-foreground",
  delete_post:        "bg-orange-500/15 text-orange-400",
  delete_snippet:     "bg-orange-500/15 text-orange-400",
  delete_comment:     "bg-orange-500/15 text-orange-400",
  update_setting:     "bg-cyan-500/15 text-cyan-400",
  create_achievement: "bg-yellow-500/15 text-yellow-400",
  update_achievement: "bg-yellow-500/15 text-yellow-400",
  delete_achievement: "bg-red-500/15 text-red-400",
  award_achievement:  "bg-yellow-500/15 text-yellow-400",
};

async function AuditContent() {
  const logs = await getAuditLogs(100, 0);

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <p className="text-sm text-muted-foreground">No admin actions logged yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ScrollText className="h-4 w-4 text-primary" />
          Recent Actions ({logs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Action</th>
                <th className="px-4 py-3 text-left font-medium">Target</th>
                <th className="px-4 py-3 text-left font-medium">Details</th>
                <th className="px-4 py-3 text-left font-medium">Admin</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => {
                const admin = Array.isArray(log.admin) ? log.admin[0] : log.admin;
                return (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                          ACTION_COLORS[log.action] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {log.target_type && (
                        <span className="rounded bg-muted px-1 py-0.5 mr-1">
                          {log.target_type}
                        </span>
                      )}
                      {log.target_id?.slice(0, 8)}
                      {log.target_id && log.target_id.length > 8 ? "…" : ""}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-muted-foreground truncate">
                      {log.metadata
                        ? Object.entries(log.metadata)
                            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
                            .join(" | ")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {admin
                        ? (admin.display_name ?? admin.username)
                        : log.admin_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAuditPage() {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Full history of all admin actions on the platform.
        </p>
      </div>
      <Suspense
        fallback={
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading logs…</p>
            </CardContent>
          </Card>
        }
      >
        <AuditContent />
      </Suspense>
    </div>
  );
}
