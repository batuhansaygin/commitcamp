"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  updateUserRole,
  banUser,
  unbanUser,
  deleteUser,
  setUserVerified,
  type AdminUserRow,
  type UserRole,
} from "@/lib/actions/admin/users";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Shield,
  ShieldOff,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  Ban,
} from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  user: "bg-muted text-muted-foreground",
  moderator: "bg-blue-500/15 text-blue-400",
  admin: "bg-purple-500/15 text-purple-400",
  system_admin: "bg-red-500/15 text-red-400",
};

const ROLES: UserRole[] = ["user", "moderator", "admin", "system_admin"];

interface Props {
  users: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
  search: string;
  roleFilter: string;
}

export function AdminUsersTable({
  users,
  total,
  page,
  limit,
  search,
  roleFilter,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // Ban dialog state
  const [banTarget, setBanTarget] = useState<AdminUserRow | null>(null);
  const [banReason, setBanReason] = useState("");

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);

  const totalPages = Math.ceil(total / limit);

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams({
      ...(search ? { search } : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
      page: String(page),
      ...params,
    });
    router.push(`${pathname}?${sp.toString()}`);
  }

  function handleAction(fn: () => Promise<void>) {
    setActionError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            defaultValue={search}
            placeholder="Search by username or name…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                navigate({ search: (e.target as HTMLInputElement).value, page: "1" });
              }
            }}
            className="w-full rounded-lg border border-border bg-input py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => navigate({ role: e.target.value, page: "1" })}
          className="rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace("_", " ")}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">
          {total.toLocaleString()} users
        </span>
      </div>

      {actionError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">XP / Level</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Joined</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-accent to-purple-accent text-xs font-bold text-white">
                            {(user.display_name ?? user.username).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.display_name ?? user.username}
                            </p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {user.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          disabled={isPending}
                          onChange={(e) =>
                            handleAction(() =>
                              updateUserRole(user.id, e.target.value as UserRole)
                            )
                          }
                          className={`rounded px-2 py-0.5 text-xs font-medium border-0 focus:ring-0 cursor-pointer ${
                            ROLE_COLORS[user.role] ?? "bg-muted"
                          }`}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {user.xp_points.toLocaleString()} XP · Lv{user.level}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {user.is_banned ? (
                            <span className="inline-flex w-fit items-center gap-1 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                              <Ban className="h-2.5 w-2.5" /> Banned
                            </span>
                          ) : (
                            <span className="inline-flex w-fit rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                              Active
                            </span>
                          )}
                          {user.is_verified && (
                            <span className="inline-flex w-fit rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
                              Verified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Verify toggle */}
                          <button
                            title={user.is_verified ? "Remove verification" : "Verify user"}
                            disabled={isPending}
                            onClick={() =>
                              handleAction(() =>
                                setUserVerified(user.id, !user.is_verified)
                              )
                            }
                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                          >
                            {user.is_verified ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>

                          {/* Ban toggle */}
                          {user.is_banned ? (
                            <button
                              title="Unban user"
                              disabled={isPending}
                              onClick={() =>
                                handleAction(() => unbanUser(user.id))
                              }
                              className="rounded p-1.5 text-emerald-500 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                            >
                              <ShieldOff className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              title="Ban user"
                              disabled={isPending || user.role === "system_admin"}
                              onClick={() => setBanTarget(user)}
                              className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-orange-500/10 hover:text-orange-400 disabled:opacity-30"
                            >
                              <Shield className="h-4 w-4" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            title="Delete user"
                            disabled={isPending || user.role === "system_admin"}
                            onClick={() => setDeleteTarget(user)}
                            className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => navigate({ page: String(page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => navigate({ page: String(page + 1) })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Ban Dialog */}
      <Dialog open={Boolean(banTarget)} onOpenChange={() => setBanTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban {banTarget?.display_name ?? banTarget?.username}?</DialogTitle>
            <DialogDescription>
              Provide a reason for banning this user. They will not be able to access the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Reason *
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={3}
                placeholder="Describe the reason for the ban…"
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBanTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!banReason.trim() || isPending}
              onClick={() => {
                if (!banTarget) return;
                handleAction(async () => {
                  await banUser(banTarget.id, banReason.trim());
                  setBanTarget(null);
                  setBanReason("");
                });
              }}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.username}?</DialogTitle>
            <DialogDescription>
              This will permanently delete the user and all their data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                if (!deleteTarget) return;
                handleAction(async () => {
                  await deleteUser(deleteTarget.id);
                  setDeleteTarget(null);
                });
              }}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
