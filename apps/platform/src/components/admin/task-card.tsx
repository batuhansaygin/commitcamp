"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, MessageSquare, GripVertical, Folder } from "lucide-react";
import type { AdminTask } from "@/lib/actions/admin/tasks";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<string, string> = {
  low:    "bg-slate-500/20 text-slate-400",
  medium: "bg-blue-500/20 text-blue-400",
  high:   "bg-amber-500/20 text-amber-400",
  urgent: "bg-red-500/20 text-red-400",
};

const PRIORITY_DOT: Record<string, string> = {
  low:    "bg-slate-400",
  medium: "bg-blue-400",
  high:   "bg-amber-400",
  urgent: "bg-red-400",
};

interface CardProps {
  task: AdminTask;
  onSelect: (task: AdminTask) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onSelect, isDragging }: CardProps) {
  const isOverdue =
    task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  return (
    <div
      onClick={() => onSelect(task)}
      className={cn(
        "group cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:border-primary/30 hover:shadow-md",
        isDragging && "rotate-2 opacity-80 shadow-xl ring-2 ring-primary/40"
      )}
    >
      {/* Priority + Labels */}
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
            PRIORITY_STYLES[task.priority]
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[task.priority])} />
          {task.priority}
        </span>
        {task.labels.slice(0, 2).map((label) => (
          <span
            key={label}
            className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
          >
            {label}
          </span>
        ))}
        {task.labels.length > 2 && (
          <span className="text-[10px] text-muted-foreground">+{task.labels.length - 2}</span>
        )}
      </div>

      {/* Title */}
      <p className="mb-2 text-sm font-medium leading-snug line-clamp-2">{task.title}</p>

      {/* Project badge — only shown in "All Tasks" view (when project is populated) */}
      {task.project && (
        <div className="mb-2 flex items-center gap-1">
          <Folder className="h-3 w-3 shrink-0" style={{ color: task.project.color }} />
          <span className="truncate text-[10px]" style={{ color: task.project.color }}>
            {task.project.name}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Assignee avatar */}
          {task.assignee && (
            <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-accent to-purple-accent text-[9px] font-bold text-white">
              {task.assignee.avatar_url ? (
                <img
                  src={task.assignee.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                (task.assignee.display_name ?? task.assignee.username ?? "?").charAt(0).toUpperCase()
              )}
            </div>
          )}

          {/* Due date */}
          {task.due_date && (
            <span
              className={cn(
                "flex items-center gap-1 text-[10px]",
                isOverdue ? "text-red-400" : "text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>

        {/* Comment count */}
        {(task.comment_count ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {task.comment_count}
          </span>
        )}
      </div>
    </div>
  );
}

// Sortable wrapper
export function SortableTaskCard({ task, onSelect }: Omit<CardProps, "isDragging">) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 flex h-full w-6 cursor-grab items-center justify-center rounded-l-lg opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <TaskCard task={task} onSelect={onSelect} isDragging={isDragging} />
    </div>
  );
}
