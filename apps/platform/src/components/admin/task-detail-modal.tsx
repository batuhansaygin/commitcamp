"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import {
  listTaskComments,
  addTaskComment,
  deleteTaskComment,
  updateTask,
  deleteTask,
} from "@/lib/actions/admin/tasks";
import type { AdminTask, AdminProfile, AdminProject, TaskComment, TaskCommentAttachment, TaskStatus, TaskPriority } from "@/lib/actions/admin/tasks";
import {
  Calendar, Tag, User2, Flag, Trash2, Save, Loader2,
  MessageSquare, Send, X, AlertCircle, Folder, Paperclip,
} from "lucide-react";
import { LabelTagInput } from "@/components/admin/label-tag-input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  TaskAttachmentUploader,
  uploadPendingFiles,
  deleteStorageFile,
  type PendingFile,
  type TaskAttachment,
} from "@/components/admin/task-attachment-uploader";
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

type LeftTab = "description" | "attachments";

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
  const [commentPendingFiles, setCommentPendingFiles] = useState<PendingFile[]>([]);
  const [addingComment, setAddingComment] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>("description");

  // Editable fields
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [assigneeId, setAssigneeId] = useState<string>(task.assignee_id ?? "");
  const [projectId, setProjectId] = useState<string>(task.project_id ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [labels, setLabels] = useState<string[]>(task.labels);
  const [dirty, setDirty] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState<TaskAttachment[]>(task.attachments ?? []);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [removedUrls, setRemovedUrls] = useState<string[]>([]);

  useEffect(() => {
    listTaskComments(task.id).then((c) => {
      setComments(c);
      setCommentsLoading(false);
    });
  }, [task.id]);

  const markDirty = () => setDirty(true);

  const handleDescriptionChange = (html: string) => {
    setDescription(html);
    markDirty();
  };

  const handleAddPending = useCallback((files: PendingFile[]) => {
    setPendingFiles((prev) => [...prev, ...files]);
    markDirty();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemovePending = useCallback((index: number) => {
    setPendingFiles((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return next;
    });
  }, []);

  const handleRemoveAttachment = useCallback((url: string) => {
    setAttachments((prev) => prev.filter((a) => a.url !== url));
    setRemovedUrls((prev) => [...prev, url]);
    markDirty();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      try {
        // Upload new files
        let finalAttachments = [...attachments];
        if (pendingFiles.length > 0) {
          const uploaded = await uploadPendingFiles(task.id, pendingFiles, "task-attachments");
          finalAttachments = [...finalAttachments, ...uploaded];
          pendingFiles.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
          setPendingFiles([]);
        }

        // Delete removed files from storage
        for (const url of removedUrls) {
          await deleteStorageFile(url);
        }
        setRemovedUrls([]);

        await updateTask(task.id, {
          title: title.trim(),
          description: description.trim() || null,
          status,
          priority,
          assignee_id: assigneeId || null,
          due_date: dueDate || null,
          labels,
          project_id: projectId || null,
          attachments: finalAttachments,
        });

        setAttachments(finalAttachments);

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
          attachments: finalAttachments,
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
    const isEmpty = !newComment || newComment.replace(/<[^>]*>/g, "").trim() === "";
    if (isEmpty && commentPendingFiles.length === 0) return;
    setAddingComment(true);
    try {
      let uploadedAttachments: TaskCommentAttachment[] = [];
      if (commentPendingFiles.length > 0) {
        const uploaded = await uploadPendingFiles(`comment-${task.id}-${Date.now()}`, commentPendingFiles, "task-comment-attachments");
        uploadedAttachments = uploaded.map((a) => ({
          name: a.name,
          url: a.url,
          type: a.type,
          size: a.size,
          uploaded_at: a.uploaded_at,
        }));
        commentPendingFiles.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
        setCommentPendingFiles([]);
      }
      await addTaskComment(task.id, isEmpty ? "" : newComment, uploadedAttachments);
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

  const attachmentCount = attachments.length + pendingFiles.length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="flex h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <VisuallyHidden><DialogTitle>{task.title}</DialogTitle></VisuallyHidden>

        {/* Header */}
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <div className="flex items-start gap-4">
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
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left — tabs: description / attachments / comments */}
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

            {/* Tab content + comments */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
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
                    attachments={attachments}
                    onRemoveAttachment={handleRemoveAttachment}
                    pendingFiles={pendingFiles}
                    onAddPending={handleAddPending}
                    onRemovePending={handleRemovePending}
                    uploading={isPending && pendingFiles.length > 0}
                  />
                  {dirty && pendingFiles.length > 0 && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Files will be uploaded when you click Save.
                    </p>
                  )}
                </div>
              )}

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
                          <div
                            className="mt-1 rounded-lg bg-muted/40 px-3 py-2 text-sm prose prose-sm dark:prose-invert max-w-none [&_p]:my-0 [&_ul]:my-1 [&_ol]:my-1"
                            dangerouslySetInnerHTML={{ __html: comment.content }}
                          />
                          {comment.attachments?.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {comment.attachments.map((att) => (
                                <a
                                  key={att.url}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Paperclip className="h-2.5 w-2.5" />
                                  {att.name}
                                </a>
                              ))}
                            </div>
                          )}
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
            <div className="shrink-0 border-t border-border px-6 py-3 space-y-2">
              <RichTextEditor
                value={newComment}
                onChange={setNewComment}
                placeholder="Write a comment..."
                minHeight="72px"
              />
              {/* Comment pending attachments preview */}
              {commentPendingFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {commentPendingFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {f.preview ? (
                        <img src={f.preview} alt={f.file.name} className="h-4 w-4 rounded object-cover" />
                      ) : (
                        <Paperclip className="h-2.5 w-2.5" />
                      )}
                      <span className="max-w-[120px] truncate">{f.file.name}</span>
                      <button
                        type="button"
                        onClick={() => setCommentPendingFiles((prev) => { const next = [...prev]; if (f.preview) URL.revokeObjectURL(f.preview!); next.splice(i, 1); return next; })}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                {/* Attach file button */}
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span>Attach</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/mp4,video/webm,application/pdf,.doc,.docx,.txt"
                    className="sr-only"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      const pending: PendingFile[] = files.map((file) => ({
                        file,
                        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
                      }));
                      setCommentPendingFiles((prev) => [...prev, ...pending]);
                      e.target.value = "";
                    }}
                  />
                </label>
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={addingComment}
                  className="gap-1.5"
                >
                  {addingComment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Send
                </Button>
              </div>
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
                min={new Date().toISOString().split("T")[0]}
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
              <LabelTagInput
                value={labels}
                onChange={(next) => { setLabels(next); markDirty(); }}
              />
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

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-3">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!dirty || isPending}>
            {isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
