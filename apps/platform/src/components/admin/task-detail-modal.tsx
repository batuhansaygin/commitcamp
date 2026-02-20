"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  listTaskComments,
  addTaskComment,
  deleteTaskComment,
  updateTask,
  deleteTask,
} from "@/lib/actions/admin/tasks";
import type { AdminTask, AdminProfile, AdminProject, TaskComment, TaskStatus, TaskPriority } from "@/lib/actions/admin/tasks";
import {
  Calendar, Tag, User2, Flag, Trash2, Save, Loader2,
  MessageSquare, Send, X, AlertCircle, Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "backlog",     label: "Backlog" },
  { value: "todo",        label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review",   label: "In Review" },
  { value: "done",        label: "Done" },
];

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low",    label: "Low",    color: "text-slate-400" },
  { value: "medium", label: "Medium", color: "text-blue-400" },
  { value: "high",   label: "High",   color: "text-amber-400" },
  { value: "urgent", label: "Urgent", color: "text-red-400" },
];

const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog:     "bg-muted/50 text-muted-foreground",
  todo:        "bg-blue-500/15 text-blue-400",
  in_progress: "bg-amber-500/15 text-amber-400",
  in_review:   "bg-purple-500/15 text-purple-400",
  done:        "bg-emerald-500/15 text-emerald-400",
};

interface Props {
  task: AdminTask;
  adminUsers: AdminProfile[];
  projects: AdminProject[];
  currentUserId: string;
  onClose: () => void;
  onUpdated: (task: AdminTask) => void;
  onDeleted: (taskId: string) => void;
}

export function TaskDetailModal({ task, adminUsers, projects, currentUserId, onClose, onUpdated, onDeleted }: Props) {
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [assigneeId, setAssigneeId] = useState<string>(task.assignee_id ?? "");
  const [projectId, setProjectId] = useState<string>(task.project_id ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [labelInput, setLabelInput] = useState(task.labels.join(", "));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    listTaskComments(task.id).then((c) => {
      setComments(c);
      setCommentsLoading(false);
    });
  }, [task.id]);

  const markDirty = () => setDirty(true);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        const labels = labelInput
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean);

        await updateTask(task.id, {
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          assignee_id: assigneeId || null,
          due_date: dueDate || null,
          labels,
          project_id: projectId || null,
        });

        const selectedProject = projects.find((p) => p.id === projectId) ?? null;
        onUpdated({
          ...task,
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          assignee_id: assigneeId || null,
          due_date: dueDate || null,
          labels,
          project_id: projectId || null,
          assignee: adminUsers.find((u) => u.id === assigneeId) ?? null,
          project: selectedProject,
        });

        setDirty(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteTask(task.id);
        onDeleted(task.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      }
    });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setAddingComment(true);
    try {
      await addTaskComment(task.id, newComment.trim());
      const updated = await listTaskComments(task.id);
      setComments(updated);
      setNewComment("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add comment");
    } finally {
      setAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteTaskComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete comment");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="flex h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className={cn("mb-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_COLORS[status])}>
                {STATUSES.find((s) => s.value === status)?.label}
              </span>
              <input
                value={title}
                onChange={(e) => { setTitle(e.target.value); markDirty(); }}
                className="w-full bg-transparent text-lg font-semibold focus:outline-none"
                placeholder="Task title..."
              />
            </div>
            {dirty && (
              <Button size="sm" onClick={handleSave} disabled={isPending}>
                {isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
                Save
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — description + comments */}
          <div className="flex flex-1 flex-col overflow-hidden border-r border-border">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); markDirty(); }}
                  rows={5}
                  placeholder="Add a detailed description..."
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Comments */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Comments</span>
                  <span className="text-xs text-muted-foreground">({comments.length})</span>
                </div>

                {commentsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-accent to-purple-accent text-[10px] font-bold text-white">
                          {comment.author?.avatar_url ? (
                            <img src={comment.author.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (comment.author?.display_name ?? "?").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium">
                              {comment.author?.display_name ?? comment.author?.username ?? "Admin"}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(comment.created_at).toLocaleDateString("en-US", {
                                  month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                                })}
                              </span>
                              {(comment.user_id === currentUserId) && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 rounded-lg bg-muted/40 px-3 py-2 text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))}

                    {comments.length === 0 && (
                      <p className="py-4 text-center text-xs text-muted-foreground">No comments yet. Be the first!</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Comment input */}
            <div className="shrink-0 border-t border-border px-6 py-3">
              <div className="flex gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddComment();
                  }}
                  rows={2}
                  placeholder="Write a comment... (Ctrl+Enter to send)"
                  className="flex-1 resize-none rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  size="icon"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || addingComment}
                  className="self-end"
                >
                  {addingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Right sidebar — metadata */}
          <div className="w-60 shrink-0 overflow-y-auto px-4 py-4 space-y-4">
            {/* Status */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value as TaskStatus); markDirty(); }}
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
                onChange={(e) => { setPriority(e.target.value as TaskPriority); markDirty(); }}
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
                onChange={(e) => { setProjectId(e.target.value); markDirty(); }}
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
                onChange={(e) => { setAssigneeId(e.target.value); markDirty(); }}
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
                onChange={(e) => { setDueDate(e.target.value); markDirty(); }}
                className="w-full rounded-lg border border-border bg-input px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Labels */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                Labels
              </label>
              <input
                value={labelInput}
                onChange={(e) => { setLabelInput(e.target.value); markDirty(); }}
                placeholder="feature, bug, design"
                className="w-full rounded-lg border border-border bg-input px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">Comma-separated</p>
            </div>

            {/* Creator info */}
            {task.creator && (
              <div className="rounded-lg bg-muted/30 p-3">
                <p className="mb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Created by</p>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-accent to-purple-accent text-[9px] font-bold text-white">
                    {task.creator.avatar_url ? (
                      <img src={task.creator.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      (task.creator.display_name ?? "?").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{task.creator.display_name ?? task.creator.username}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(task.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Delete */}
            <div className="border-t border-border pt-4">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete task
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Are you sure?</p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      disabled={isPending}
                      onClick={handleDelete}
                    >
                      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Delete"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
