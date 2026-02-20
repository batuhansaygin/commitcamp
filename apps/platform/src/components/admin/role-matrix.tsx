"use client";

import React, { useState, useTransition, useCallback } from "react";
import { Lock, Check, X, Shield, ShieldCheck, User, Users, Save, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { saveRolePermissions, type RolePermissionsMap, type EditableRole } from "@/lib/actions/admin/role-permissions";

// ── Types ──────────────────────────────────────────────────────────────────────

type HardcodedAccess = "yes" | "no" | "never";

interface Capability {
  id: string;
  label: string;
  description?: string;
  user: HardcodedAccess;
  moderator: HardcodedAccess;
  admin: HardcodedAccess;
  /** system_admin is always "yes" (except "never") — not editable */
  system_admin: "yes" | "never";
}

interface CapabilityGroup {
  group: string;
  icon: React.ElementType;
  color: string;
  capabilities: Capability[];
}

// ── Capability definitions — default values ───────────────────────────────────
// "yes"   = allowed by default
// "no"    = denied by default
// "never" = hardcoded block, cannot be toggled

const MATRIX: CapabilityGroup[] = [
  {
    group: "Platform Access",
    icon: Shield,
    color: "text-slate-400",
    capabilities: [
      { id: "admin_panel_access",    label: "Admin panel access",    description: "Can log in to /admin",                       user: "no", moderator: "no", admin: "yes", system_admin: "yes" },
      { id: "dashboard_statistics",  label: "Dashboard & statistics", description: "View platform-wide metrics",               user: "no", moderator: "no", admin: "yes", system_admin: "yes" },
      { id: "audit_logs",            label: "Audit logs",             description: "View full history of admin actions",       user: "no", moderator: "no", admin: "yes", system_admin: "yes" },
      { id: "task_board",            label: "Task board",             description: "Manage and track admin tasks",             user: "no", moderator: "no", admin: "yes", system_admin: "yes" },
    ],
  },
  {
    group: "User Management",
    icon: Users,
    color: "text-blue-400",
    capabilities: [
      { id: "view_user_list",              label: "View user list",              description: "Browse all platform members",                        user: "no", moderator: "no",  admin: "yes", system_admin: "yes" },
      { id: "verify_users",                label: "Verify / unverify users",     description: "Grant or revoke verified badge",                     user: "no", moderator: "no",  admin: "yes", system_admin: "yes" },
      { id: "ban_users",                   label: "Ban / unban users",           description: "Temporarily or permanently restrict access",         user: "no", moderator: "no",  admin: "yes", system_admin: "yes" },
      { id: "change_role_user_moderator",  label: "Change role (user ↔ mod)",    description: "Promote or demote between low-tier roles",           user: "no", moderator: "no",  admin: "yes", system_admin: "yes" },
      { id: "assign_admin_role",           label: "Assign admin role",           description: "Promote a user to admin",                            user: "no", moderator: "no",  admin: "no",  system_admin: "yes" },
      { id: "assign_system_admin_role",    label: "Assign system_admin role",    description: "Grant the highest privilege level",                  user: "no", moderator: "no",  admin: "no",  system_admin: "yes" },
      { id: "delete_users",                label: "Delete users",                description: "Permanently remove account from the platform",       user: "no", moderator: "no",  admin: "no",  system_admin: "yes" },
      { id: "ban_system_admin",            label: "Ban system_admin",            description: "Restricted — immutable protection",                  user: "never", moderator: "never", admin: "never", system_admin: "never" },
      { id: "delete_system_admin",         label: "Delete system_admin",         description: "Restricted — immutable protection",                  user: "never", moderator: "never", admin: "never", system_admin: "never" },
    ],
  },
  {
    group: "Content Moderation",
    icon: ShieldCheck,
    color: "text-emerald-400",
    capabilities: [
      { id: "view_all_content",   label: "View all content",   description: "Browse all posts, snippets, and comments", user: "no", moderator: "no",  admin: "yes", system_admin: "yes" },
      { id: "delete_posts",       label: "Delete posts",       description: "Remove forum posts",                       user: "no", moderator: "no",  admin: "yes", system_admin: "yes" },
      { id: "delete_snippets",    label: "Delete snippets",    description: "Remove code snippets",                     user: "no", moderator: "no",  admin: "yes", system_admin: "yes" },
      { id: "delete_comments",    label: "Delete comments",    description: "Remove user comments",                     user: "no", moderator: "no",  admin: "yes", system_admin: "yes" },
    ],
  },
  {
    group: "Achievements",
    icon: User,
    color: "text-yellow-400",
    capabilities: [
      { id: "view_achievements",          label: "View achievements",          description: "See the achievements list",                 user: "no", moderator: "no", admin: "yes", system_admin: "yes" },
      { id: "create_edit_achievements",   label: "Create / edit achievements", description: "Define new badges and milestones",          user: "no", moderator: "no", admin: "yes", system_admin: "yes" },
      { id: "delete_achievements",        label: "Delete achievements",        description: "Remove existing achievements",              user: "no", moderator: "no", admin: "yes", system_admin: "yes" },
    ],
  },
  {
    group: "Platform Settings",
    icon: Shield,
    color: "text-red-400",
    capabilities: [
      { id: "view_platform_settings",   label: "View platform settings",   description: "Read auth, feature, and rate-limit config",                     user: "no", moderator: "no", admin: "yes", system_admin: "yes" },
      { id: "edit_platform_settings",   label: "Edit platform settings",   description: "Change OAuth, feature flags, rate limits, maintenance mode",   user: "no", moderator: "no", admin: "no",  system_admin: "yes" },
      { id: "toggle_maintenance_mode",  label: "Toggle maintenance mode",  description: "Block all non-admin access to the platform",                   user: "no", moderator: "no", admin: "no",  system_admin: "yes" },
    ],
  },
];

// ── Role column config ─────────────────────────────────────────────────────────

const EDITABLE_ROLES: { key: EditableRole; label: string; description: string; badge: string; header: string }[] = [
  { key: "user",      label: "User",      description: "Default role on signup",     badge: "bg-slate-500/15 text-slate-400 border-slate-500/30",  header: "bg-slate-500/8 border-slate-500/20" },
  { key: "moderator", label: "Moderator", description: "Trusted community member",   badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",    header: "bg-blue-500/8 border-blue-500/20"   },
  { key: "admin",     label: "Admin",     description: "Platform administrator",     badge: "bg-purple-500/15 text-purple-400 border-purple-500/30", header: "bg-purple-500/8 border-purple-500/20" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build a default permissions map from MATRIX defaults */
function buildDefaults(): RolePermissionsMap {
  const map: RolePermissionsMap = { user: {}, moderator: {}, admin: {} };
  for (const group of MATRIX) {
    for (const cap of group.capabilities) {
      for (const role of EDITABLE_ROLES) {
        if (cap[role.key] !== "never") {
          map[role.key][cap.id] = cap[role.key] === "yes";
        }
      }
    }
  }
  return map;
}

/** Merge saved DB overrides on top of the defaults */
function mergeWithDefaults(saved: RolePermissionsMap | null): RolePermissionsMap {
  const defaults = buildDefaults();
  if (!saved) return defaults;
  return {
    user:      { ...defaults.user,      ...(saved.user      ?? {}) },
    moderator: { ...defaults.moderator, ...(saved.moderator ?? {}) },
    admin:     { ...defaults.admin,     ...(saved.admin     ?? {}) },
  };
}

// ── Toggle cell ────────────────────────────────────────────────────────────────

interface ToggleCellProps {
  capId: string;
  hardcoded: HardcodedAccess;
  value: boolean;
  onChange: (capId: string, value: boolean) => void;
}

function ToggleCell({ capId, hardcoded, value, onChange }: ToggleCellProps) {
  if (hardcoded === "never") {
    return (
      <div className="flex items-center justify-center">
        <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
          <Lock className="h-2.5 w-2.5" />
          never
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <button
        onClick={() => onChange(capId, !value)}
        className={cn(
          "group relative flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-150",
          value
            ? "border-emerald-500/50 bg-emerald-500/15 hover:bg-emerald-500/25"
            : "border-border bg-muted/40 hover:border-border hover:bg-muted/70"
        )}
        title={value ? "Click to revoke" : "Click to grant"}
      >
        {value ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <X className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground/70" />
        )}
      </button>
    </div>
  );
}

// ── system_admin cell (always locked) ─────────────────────────────────────────

function SystemAdminCell({ access }: { access: "yes" | "never" }) {
  if (access === "never") {
    return (
      <div className="flex items-center justify-center">
        <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
          <Lock className="h-2.5 w-2.5" />
          never
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20">
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface RoleMatrixProps {
  initialPermissions: RolePermissionsMap | null;
  isSystemAdmin: boolean;
}

export function RoleMatrix({ initialPermissions, isSystemAdmin }: RoleMatrixProps) {
  const [permissions, setPermissions] = useState<RolePermissionsMap>(
    () => mergeWithDefaults(initialPermissions)
  );
  const [original]   = useState<RolePermissionsMap>(() => mergeWithDefaults(initialPermissions));
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleToggle = useCallback((role: EditableRole, capId: string, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [capId]: value },
    }));
  }, []);

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveRolePermissions(permissions);
      if (result.success) {
        showToast("success", "Permissions saved successfully.");
      } else {
        showToast("error", result.error ?? "Failed to save permissions.");
      }
    });
  };

  const handleReset = () => {
    setPermissions(mergeWithDefaults(null));
  };

  const isDirty = JSON.stringify(permissions) !== JSON.stringify(original);

  return (
    <div className="space-y-6">
      {/* Legend + actions bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-muted/20 px-4 py-3">
        <span className="text-xs font-medium text-muted-foreground">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-emerald-500/50 bg-emerald-500/15">
            <Check className="h-3 w-3 text-emerald-400" />
          </div>
          <span className="text-xs text-muted-foreground">Allowed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border bg-muted/40">
            <X className="h-3 w-3 text-muted-foreground/40" />
          </div>
          <span className="text-xs text-muted-foreground">Not allowed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400">
            <Lock className="h-2.5 w-2.5" />
            never
          </span>
          <span className="text-xs text-muted-foreground">Hardcoded — cannot be changed</span>
        </div>
        {isSystemAdmin && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to defaults
            </button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending || !isDirty}
              className={cn(!isDirty && "opacity-50")}
            >
              {isPending
                ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                : <Save className="mr-1.5 h-3 w-3" />
              }
              Save changes
            </Button>
          </div>
        )}
        {!isSystemAdmin && (
          <div className="ml-auto flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs text-amber-400">Read-only — system_admin only can edit</span>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={cn(
          "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm",
          toast.type === "success"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
            : "border-red-500/30 bg-red-500/10 text-red-400"
        )}>
          {toast.type === "success"
            ? <Check className="h-4 w-4" />
            : <X className="h-4 w-4" />
          }
          {toast.message}
        </div>
      )}

      {/* Matrix table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-72 border-b border-border bg-muted/20 px-4 py-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Capability
                </span>
              </th>
              {EDITABLE_ROLES.map((role) => (
                <th
                  key={role.key}
                  className={cn("border-b border-l border-border px-4 py-3 text-center", role.header)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      role.badge
                    )}>
                      {role.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{role.description}</span>
                    {isSystemAdmin && (
                      <span className="text-[10px] text-muted-foreground/60">click cell to toggle</span>
                    )}
                  </div>
                </th>
              ))}
              {/* system_admin column */}
              <th className="border-b border-l border-border bg-red-500/5 px-4 py-3 text-center border-red-500/20">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-red-400" />
                    <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                      System Admin
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Full immutable access</span>
                  <span className="text-[10px] font-medium text-red-400">Immutable · Cannot edit</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {MATRIX.map((group) => (
              <React.Fragment key={group.group}>
                <tr className="bg-muted/30">
                  <td colSpan={5} className="border-b border-t border-border px-4 py-2">
                    <div className="flex items-center gap-2">
                      <group.icon className={cn("h-3.5 w-3.5", group.color)} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.group}
                      </span>
                    </div>
                  </td>
                </tr>

                {group.capabilities.map((cap, idx) => (
                  <tr
                    key={cap.id}
                    className={cn(
                      "transition-colors",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/5"
                    )}
                  >
                    <td className="border-b border-border px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{cap.label}</p>
                      {cap.description && (
                        <p className="text-[11px] text-muted-foreground">{cap.description}</p>
                      )}
                    </td>

                    {EDITABLE_ROLES.map((role) => (
                      <td
                        key={role.key}
                        className={cn(
                          "border-b border-l border-border px-4 py-3",
                          cap[role.key] === "never" && "bg-red-500/5",
                          isSystemAdmin && cap[role.key] !== "never" && "cursor-pointer hover:bg-muted/30"
                        )}
                        onClick={
                          isSystemAdmin && cap[role.key] !== "never"
                            ? () => handleToggle(role.key, cap.id, !permissions[role.key][cap.id])
                            : undefined
                        }
                      >
                        <ToggleCell
                          capId={cap.id}
                          hardcoded={cap[role.key]}
                          value={permissions[role.key][cap.id] ?? false}
                          onChange={isSystemAdmin ? (id, val) => handleToggle(role.key, id, val) : () => {}}
                        />
                      </td>
                    ))}

                    {/* system_admin cell */}
                    <td className="border-b border-l border-border bg-red-500/3 px-4 py-3 border-red-500/10">
                      <SystemAdminCell access={cap.system_admin} />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* system_admin immutability callout */}
      <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
        <div>
          <p className="text-sm font-semibold text-red-400">system_admin is immutable</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            A system_admin account cannot be banned, demoted, or deleted by anyone — including
            other system_admins. This is enforced at the server action level and in database RLS
            policies. The{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">system_admin</code>{" "}
            role is the only way to access platform settings and assign admin roles.
          </p>
        </div>
      </div>
    </div>
  );
}
