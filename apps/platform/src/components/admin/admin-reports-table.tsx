"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  adminDeleteReportedTarget,
  updateReportStatusAdmin,
  type ReportStatus,
} from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";

interface UserRef {
  username: string;
  display_name: string | null;
}

interface ReportRow {
  id: string;
  target_type: "post" | "snippet" | "comment";
  target_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  reporter: UserRef | null;
  reviewer: UserRef | null;
}

interface Props {
  reports: ReportRow[];
  total: number;
  page: number;
  limit: number;
  status: string;
  targetType: string;
}

const STATUS_OPTIONS: ReportStatus[] = ["pending", "reviewed", "resolved", "dismissed"];

function userName(user: UserRef | null) {
  if (!user) return "Unknown";
  return user.display_name || user.username;
}

export function AdminReportsTable({
  reports,
  total,
  page,
  limit,
  status,
  targetType,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function navigate(next: { page?: number; status?: string; targetType?: string }) {
    const sp = new URLSearchParams();
    sp.set("page", String(next.page ?? page));
    if ((next.status ?? status) && (next.status ?? status) !== "all") {
      sp.set("status", next.status ?? status);
    }
    if ((next.targetType ?? targetType) && (next.targetType ?? targetType) !== "all") {
      sp.set("target", next.targetType ?? targetType);
    }
    router.push(`${pathname}?${sp.toString()}`);
  }

  const runAction = (id: string, fn: () => Promise<{ error?: string }>) => {
    setError(null);
    setActionId(id);
    startTransition(async () => {
      const result = await fn();
      if (result.error) setError(result.error);
      else router.refresh();
      setActionId(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={status || "all"}
          onValueChange={(value) => navigate({ status: value, page: 1 })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={targetType || "all"}
          onValueChange={(value) => navigate({ targetType: value, page: 1 })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Target type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All targets</SelectItem>
            <SelectItem value="post">Post</SelectItem>
            <SelectItem value="snippet">Snippet</SelectItem>
            <SelectItem value="comment">Comment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Reporter</th>
                  <th className="px-4 py-3 text-left font-medium">Target</th>
                  <th className="px-4 py-3 text-left font-medium">Reason</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      No reports found.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="align-top hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{userName(report.reporter)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium capitalize">{report.target_type}</p>
                        <p className="text-xs text-muted-foreground">{report.target_id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium capitalize">{report.reason.replace("_", " ")}</p>
                        {report.details ? (
                          <p className="text-xs text-muted-foreground">{report.details}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={report.status}
                          onValueChange={(value) =>
                            runAction(report.id, () =>
                              updateReportStatusAdmin(report.id, value as ReportStatus)
                            )
                          }
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isPending && actionId === report.id}
                            onClick={() =>
                              runAction(report.id, () => adminDeleteReportedTarget(report.id))
                            }
                          >
                            {isPending && actionId === report.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="mr-1 h-3 w-3" />
                            )}
                            Delete target
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => navigate({ page: page - 1 })}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => navigate({ page: page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
