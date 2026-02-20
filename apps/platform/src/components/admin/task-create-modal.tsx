"use client";

import { useState, useTransition, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { createTask } from "@/lib/actions/admin/tasks";
import type {
  AdminTask,
  AdminProfile,
  AdminProject,
  TaskStatus,
  TaskPriority,
} from "@/lib/actions/admin/tasks";
import { LabelTagInput } from "@/components/admin/label-tag-input";
import {
  TaskAttachmentUploader,
  uploadPendingFiles,
  type PendingFile,
} from "@/components/admin/task-attachment-uploader";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Calendar,
  Tag,
  User2,
  Flag,
  Loader2,
  Plus,
  Folder,
  Paperclip,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "backlog",     label: "Backlog" },
  { value: "todo",        label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review",   label: "In Review" },
  { value: "done",        label: "Done" },
];

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low",    label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High" },
  { value: "urgent", label: "Urgent" },
];

const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog:     "bg-muted/50 text-muted-foreground",
  todo:        "bg-blue-500/15 text-blue-400",
  in_progress: "bg-amber-500/15 text-amber-400",
  in_review:   "bg-purple-500/15 text-purple-400",
  done:        "bg-emerald-500/15 text-emerald-400",
};

type LeftTab = "description" | "attachments";

interface Props {
  defaultStatus: TaskStatus;
  defaultProjectId?: string | null;
  adminUsers: AdminProfile[];
  projects: AdminProject[];
  onClose: () => void;
  onCreated: (task: AdminTask) => void;
}

export function TaskCreateModal({
  defaultStatus,
  defaultProjectId,
  adminUsers,
  projects,
  onClose,
  onCreated,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>("description");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? "");
  const [dueDate, setDueDate] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const handleAddPending = useCallback((files: PendingFile[]) => {
    setPendingFiles((prev) => [...prev, ...files]);
  }, []);

  const handleRemovePending = useCallback((index: number) => {
    setPendingFiles((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return next;
    });
  }, []);

  const handleDescriptionChange = (html: string) => {
    setDescription(html);
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        const task = await createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          assignee_id: assigneeId || null,
          due_date: dueDate || null,
          labels,
          project_id: projectId || null,
          attachments: [],
        });

        if (pendingFiles.length > 0) {
          const uploaded = await uploadPendingFiles(task.id, pendingFiles, "task-attachments");
          if (uploaded.length > 0) {
            const { updateTask } = await import("@/lib/actions/admin/tasks");
            await updateTask(task.id, { attachments: uploaded });
            task.attachments = uploaded;
          }
          pendingFiles.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
        }

        onCreated(task);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create task");
      }
    });
  };

  const attachmentCount = pendingFiles.length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="flex h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">

        <VisuallyHidden><DialogTitle>New Task</DialogTitle></VisuallyHidden>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <span className={cn(
                "mb-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                STATUS_COLORS[status]
              )}>
                {STATUSES.find((s) => s.value === status)?.label}
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                autoFocus
                className="w-full bg-transparent text-lg font-semibold focus:outline-none placeholder:text-muted-foreground/40"
              />
            </div>
          </div>
        </DialogHeader>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left — description + attachments */}
          <div className="flex flex-1 flex-col overflow-hidden border-r border-border">

            {/* Tab bar */}
            <div className="flex shrink-0 items-center gap-1 border-b border-border px-4 pt-3 pb-0">
              <button
                onClick={() => setLeftTab("description")}
                className={cn(
                  "flex items-center gap-1.5 rounded-t-lg border border-b-0 px-3 py-1.5 text-xs font-medium transition-colors",
                  leftTab === "description"
                    ? "border-border bg-background text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Description
              </button>
              <button
                onClick={() => setLeftTab("attachments")}
                className={cn(
                  "flex items-center gap-1.5 rounded-t-lg border border-b-0 px-3 py-1.5 text-xs font-medium transition-colors",
                  leftTab === "attachments"
                    ? "border-border bg-background text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Paperclip className="h-3.5 w-3.5" />
                Attachments
                {attachmentCount > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary/20 px-1 text-[10px] font-bold text-primary">
                    {attachmentCount}
                  </span>
                )}
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {leftTab === "description" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Description / Detail
                  </label>
                  <RichTextEditor
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="Add a detailed description or notes about this task..."
                    minHeight="160px"
                  />
                </div>
              ) : (
                <div>
                  <TaskAttachmentUploader
                    attachments={[]}
                    onRemoveAttachment={() => {}}
                    pendingFiles={pendingFiles}
                    onAddPending={handleAddPending}
                    onRemovePending={handleRemovePending}
                    uploading={isPending && pendingFiles.length > 0}
                  />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar — metadata */}
          <div className="w-64 shrink-0 overflow-y-auto px-4 py-4 space-y-4">

            {/* Status */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-lg border border-border bg-input px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Flag className="h-3.5 w-3.5" />
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-lg border border-border bg-input px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Folder className="h-3.5 w-3.5" />
                Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— No project —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <User2 className="h-3.5 w-3.5" />
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Unassigned</option>
                {adminUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name ?? u.username ?? u.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Due date */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Labels */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                Labels
              </label>
              <LabelTagInput value={labels} onChange={setLabels} />
            </div>

          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-3">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim() || isPending}>
            {isPending
              ? <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              : <Plus className="mr-2 h-3 w-3" />
            }
            Create Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
