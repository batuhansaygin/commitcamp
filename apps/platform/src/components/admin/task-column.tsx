"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { SortableTaskCard } from "./task-card";
import type { AdminTask, TaskStatus } from "@/lib/actions/admin/tasks";
import { cn } from "@/lib/utils";

interface Props {
  id: TaskStatus;
  label: string;
  color: string;
  tasks: AdminTask[];
  isOver?: boolean;
  onAddTask: () => void;
  onSelectTask: (task: AdminTask) => void;
}

export function TaskColumn({ id, label, color, tasks, isOver, onAddTask, onSelectTask }: Props) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-semibold uppercase tracking-wider", color)}>
            {label}
          </span>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onAddTask}
          className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus:opacity-100 group-hover:opacity-100"
          aria-label={`Add task to ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Droppable task list */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-32 flex-1 flex-col gap-2 rounded-xl border-2 p-2 transition-colors duration-150",
            isOver
              ? "border-primary/60 bg-primary/8 shadow-inner"
              : "border-border/60 bg-card/40"
          )}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onSelect={onSelectTask}
            />
          ))}

          {tasks.length === 0 && (
            <div className={cn(
              "flex flex-1 items-center justify-center rounded-lg py-8 transition-colors",
              isOver ? "bg-primary/10" : ""
            )}>
              <p className={cn(
                "text-xs transition-colors",
                isOver ? "text-primary/60 font-medium" : "text-muted-foreground/40"
              )}>
                {isOver ? "Drop here" : "Drop tasks here"}
              </p>
            </div>
          )}
        </div>
      </SortableContext>

      {/* Add task button */}
      <button
        onClick={onAddTask}
        className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        Add task
      </button>
    </div>
  );
}
