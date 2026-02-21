import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { AdminReportsTable } from "@/components/admin/admin-reports-table";
import {
  listReportsAdmin,
  type ReportStatus,
  type ReportTargetType,
} from "@/lib/actions/reports";

export const metadata: Metadata = {
  title: "Reports Moderation - Admin",
};

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string; target?: string }>;
}

async function ReportsContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const limit = 30;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * limit;
  const status = params.status ?? "";
  const targetType = params.target ?? "";

  const { reports, total } = await listReportsAdmin({
    status: status && status !== "all" ? (status as ReportStatus) : undefined,
    targetType:
      targetType && targetType !== "all"
        ? (targetType as ReportTargetType)
        : undefined,
    limit,
    offset,
  });

  return (
    <AdminReportsTable
      reports={reports}
      total={total}
      page={page}
      limit={limit}
      status={status}
      targetType={targetType}
    />
  );
}

export default function AdminReportsPage(props: PageProps) {
  return (
    <div className="h-full overflow-y-auto space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Reports Moderation</h1>
        <p className="text-sm text-muted-foreground">
          Review user reports, update statuses, and moderate reported content.
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardContent className="flex h-56 items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading reports...</p>
            </CardContent>
          </Card>
        }
      >
        <ReportsContent {...props} />
      </Suspense>
    </div>
  );
}
