"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createProject, updateProject } from "@/lib/actions/admin/tasks";
import type { AdminProject, AdminProfile } from "@/lib/actions/admin/tasks";
import { Loader2 } from "lucide-react";

const PRESET_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
];

interface Props {
  project?: AdminProject | null;
  adminUsers: AdminProfile[];
  onClose: () => void;
  onSaved: (project: AdminProject) => void;
}

export function ProjectCreateModal({ project, adminUsers, onClose, onSaved }: Props) {
  const isEdit = !!project;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [color, setColor] = useState(project?.color ?? "#6366f1");
  const [assigneeId, setAssigneeId] = useState(project?.assignee_id ?? "");

  const handleSave = () => {
    if (!name.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        if (isEdit && project) {
          await updateProject(project.id, {
            name: name.trim(),
            description: description.trim() || null,
            color,
            assignee_id: assigneeId || null,
          });
          const assignee = adminUsers.find((u) => u.id === assigneeId) ?? null;
          onSaved({ ...project, name: name.trim(), description: description.trim() || null, color, assignee_id: assigneeId || null, assignee });
        } else {
          const created = await createProject({
            name: name.trim(),
            description: description.trim() || undefined,
            color,
            assignee_id: assigneeId || null,
          });
          const assignee = adminUsers.find((u) => u.id === assigneeId) ?? null;
          onSaved({ ...created, assignee });
        }
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save project");
      }
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Project Name *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Platform Redesign"
              autoFocus
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What is this project about?"
              className="w-full resize-none rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Color */}
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-6 w-6 rounded-full ring-offset-background transition-all hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                  title={c}
                />
              ))}
              {/* Custom color input */}
              <label className="h-6 w-6 cursor-pointer rounded-full border-2 border-dashed border-border flex items-center justify-center text-[9px] text-muted-foreground hover:border-foreground transition-colors" title="Custom color">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="sr-only"
                />
                +
              </label>
            </div>
          </div>

          {/* Responsible person */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Responsible Person
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— No owner —</option>
              {adminUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name ?? u.username ?? u.id}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || isPending}
            style={name.trim() ? { borderColor: color } : undefined}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
