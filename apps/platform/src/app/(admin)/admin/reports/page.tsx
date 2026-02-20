import { redirect } from "next/navigation";

// Reports moved to audit logs and dashboard
export default function AdminReportsPage() {
  redirect("/admin/audit");
}
