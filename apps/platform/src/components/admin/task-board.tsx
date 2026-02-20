"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  MeasuringStrategy,
  pointerWithin,
  rectIntersection,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus, Folder, FolderX, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TaskColumn } from "./task-column";
import { TaskCard } from "./task-card";
import { TaskDetailModal } from "./task-detail-modal";
import { TaskCreateModal } from "./task-create-modal";
import { ProjectListSidebar } from "./project-list-sidebar";
import { ProjectCreateModal } from "./project-create-modal";
import { moveTask } from "@/lib/actions/admin/tasks";
import type {
  AdminTask,
  AdminProfile,
  AdminProject,
  TaskStatus,
} from "@/lib/actions/admin/tasks";

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "backlog",     label: "Backlog",     color: "text-muted-foreground" },
  { id: "todo",        label: "To Do",       color: "text-blue-400" },
  { id: "in_progress", label: "In Progress", color: "text-amber-400" },
  { id: "in_review",   label: "In Review",   color: "text-purple-400" },
  { id: "done",        label: "Done",        color: "text-emerald-400" },
];

const COLUMN_IDS = new Set(COLUMNS.map((c) => c.id));

/**
 * Custom collision detection: prioritise pointer-within for cross-column drops,
 * fall back to rect intersection so empty columns are still valid drop targets.
 */
const customCollision: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  if (pointer.length > 0) return pointer;
  return rectIntersection(args);
};

interface Props {
  initialTasks: Record<TaskStatus, AdminTask[]>;
  initialProjects: AdminProject[];
  adminUsers: AdminProfile[];
  currentUserId: string;
}

export function TaskBoard({ initialTasks, initialProjects, adminUsers, currentUserId }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [projects, setProjects] = useState(initialProjects);
  const [activeTask, setActiveTask] = useState<AdminTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<AdminTask | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("todo");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null | undefined>(undefined);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<AdminProject | null>(null);
  const [overColumnId, setOverColumnId] = useState<TaskStatus | null>(null);
  const [filterNoProject, setFilterNoProject] = useState(false);
  const [filterNoAssignee, setFilterNoAssignee] = useState(false);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Start drag only after the pointer has moved 5px — prevents accidental
      // drags while still allowing normal click-to-open behaviour.
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Helper to find which column a task belongs to (searches all tasks)
  const findTaskColumn = useCallback((taskId: string): { status: TaskStatus; index: number } | null => {
    for (const [status, col] of Object.entries(tasks) as [TaskStatus, AdminTask[]][]) {
      const index = col.findIndex((t) => t.id === taskId);
      if (index !== -1) return { status, index };
    }
    return null;
  }, [tasks]);

  // Filter tasks by selected project + optional no-project / no-assignee chips
  const visibleTasks = useMemo((): Record<TaskStatus, AdminTask[]> => {
    const base: Record<TaskStatus, AdminTask[]> = { backlog: [], todo: [], in_progress: [], in_review: [], done: [] };
    for (const [status, col] of Object.entries(tasks) as [TaskStatus, AdminTask[]][]) {
      base[status] = col.filter((t) => {
        if (selectedProjectId !== undefined && t.project_id !== selectedProjectId) return false;
        if (filterNoProject && t.project_id !== null) return false;
        if (filterNoAssignee && t.assignee_id !== null) return false;
        return true;
      });
    }
    return base;
  }, [tasks, selectedProjectId, filterNoProject, filterNoAssignee]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const totalVisible = Object.values(visibleTasks).flat().length;

  // Counts for filter chips (based on project-filtered tasks, before no-project/no-assignee filter)
  const allInView = useMemo(() => {
    const base: AdminTask[] = [];
    for (const [, col] of Object.entries(tasks) as [TaskStatus, AdminTask[]][]) {
      for (const t of col) {
        if (selectedProjectId !== undefined && t.project_id !== selectedProjectId) continue;
        base.push(t);
      }
    }
    return base;
  }, [tasks, selectedProjectId]);

  const noProjectCount  = allInView.filter((t) => t.project_id === null).length;
  const noAssigneeCount = allInView.filter((t) => t.assignee_id === null).length;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    for (const col of Object.values(tasks)) {
      const found = col.find((t) => t.id === id);
      if (found) { setActiveTask(found); return; }
    }
  }, [tasks]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (!over) { setOverColumnId(null); return; }
    const overId = over.id as string;
    if (COLUMN_IDS.has(overId as TaskStatus)) {
      setOverColumnId(overId as TaskStatus);
    } else {
      // Over a task — find its column
      const found = findTaskColumn(overId);
      setOverColumnId(found?.status ?? null);
    }
  }, [findTaskColumn]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumnId(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const src = findTaskColumn(taskId);
    if (!src) return;

    let destStatus: TaskStatus = src.status;
    let destIndex = 0;

    if (COLUMN_IDS.has(overId as TaskStatus)) {
      // Dropped directly onto a column container
      destStatus = overId as TaskStatus;
      destIndex = tasks[destStatus].length;
    } else {
      // Dropped onto another task
      const dst = findTaskColumn(overId);
      if (!dst) return;
      destStatus = dst.status;
      destIndex = dst.index;
    }

    // No-op: same task, same position, same column
    if (taskId === overId) return;

    setTasks((prev) => {
      const next = { ...prev };
      if (src.status === destStatus) {
        // Same column reorder
        next[src.status] = arrayMove(prev[src.status], src.index, destIndex);
      } else {
        // Cross-column move
        const srcCol = [...prev[src.status]];
        const [moved] = srcCol.splice(src.index, 1);
        const dstCol = [...prev[destStatus]];
        dstCol.splice(destIndex, 0, { ...moved, status: destStatus });
        next[src.status] = srcCol;
        next[destStatus] = dstCol;
      }
      return next;
    });

    startTransition(async () => {
      await moveTask(taskId, destStatus, destIndex);
    });
  }, [tasks, findTaskColumn]);

  const handleOpenCreate = (status: TaskStatus) => {
    setCreateStatus(status);
    setShowCreate(true);
  };

  const handleTaskCreated = (task: AdminTask) => {
    setTasks((prev) => ({
      ...prev,
      [task.status]: [...prev[task.status], task],
    }));
    if (task.project_id) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === task.project_id
            ? { ...p, task_count: (p.task_count ?? 0) + 1 }
            : p
        )
      );
    }
  };

  const handleTaskUpdated = (updated: AdminTask) => {
    setTasks((prev) => {
      const next = { ...prev };
      for (const status of Object.keys(next) as TaskStatus[]) {
        next[status] = next[status].filter((t) => t.id !== updated.id);
      }
      next[updated.status] = [...next[updated.status], updated];
      return next;
    });
    setSelectedTask(updated);
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prev) => {
      const next = { ...prev };
      for (const status of Object.keys(next) as TaskStatus[]) {
        const removed = next[status].find((t) => t.id === taskId);
        next[status] = next[status].filter((t) => t.id !== taskId);
        if (removed?.project_id) {
          setProjects((p) =>
            p.map((proj) =>
              proj.id === removed.project_id
                ? { ...proj, task_count: Math.max(0, (proj.task_count ?? 1) - 1) }
                : proj
            )
          );
        }
      }
      return next;
    });
    setSelectedTask(null);
  };

  const handleProjectSaved = (project: AdminProject) => {
    setProjects((prev) => {
      const existing = prev.findIndex((p) => p.id === project.id);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], ...project };
        return updated;
      }
      return [...prev, project];
    });
    setEditingProject(null);
  };

  const handleProjectDeleted = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (selectedProjectId === projectId) setSelectedProjectId(undefined);
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Project sidebar */}
      <ProjectListSidebar
        projects={projects}
        adminUsers={adminUsers}
        selectedProjectId={selectedProjectId}
        onSelect={(id) => { setSelectedProjectId(id); setFilterNoProject(false); setFilterNoAssignee(false); }}
        onCreateProject={() => { setEditingProject(null); setShowProjectModal(true); }}
        onEditProject={(p) => { setEditingProject(p); setShowProjectModal(true); }}
        onProjectDeleted={handleProjectDeleted}
      />

      {/* Main board area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Board header */}
        <div className="shrink-0 border-b border-border bg-background">
          <div className="flex items-center justify-between px-5 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              {selectedProject ? (
                <>
                  <Folder className="h-5 w-5 shrink-0" style={{ color: selectedProject.color }} />
                  <div className="min-w-0">
                    <h1 className="truncate text-base font-bold leading-tight">
                      {selectedProject.name}
                    </h1>
                    {selectedProject.description && (
                      <p className="truncate text-xs text-muted-foreground">
                        {selectedProject.description}
                      </p>
                    )}
                  </div>
                  {selectedProject.assignee && (
                    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-1">
                      <div className="h-4 w-4 overflow-hidden rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-[8px] font-bold text-white">
                        {selectedProject.assignee.avatar_url ? (
                          <img src={selectedProject.assignee.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          (selectedProject.assignee.display_name ?? "?").charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {selectedProject.assignee.display_name ?? selectedProject.assignee.username}
                      </span>
                    </div>
                  )}
                  <p className="ml-1 shrink-0 text-xs text-muted-foreground">
                    {totalVisible} task{totalVisible !== 1 ? "s" : ""}
                  </p>
                </>
              ) : (
                <div>
                  <h1 className="text-base font-bold">All Tasks</h1>
                  <p className="text-xs text-muted-foreground">
                    {totalVisible} task{totalVisible !== 1 ? "s" : ""} across all projects
                  </p>
                </div>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {selectedProjectId === undefined && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditingProject(null); setShowProjectModal(true); }}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  New Project
                </Button>
              )}
              <Button size="sm" onClick={() => handleOpenCreate("todo")}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New Task
              </Button>
            </div>
          </div>

          {/* Filter chips — shown in all-tasks and single-project views */}
          {(noProjectCount > 0 || noAssigneeCount > 0) && (
            <div className="flex items-center gap-2 border-t border-border/50 px-5 py-2">
              <span className="text-[11px] text-muted-foreground">Filter:</span>

              {noProjectCount > 0 && (
                <button
                  onClick={() => {
                    setFilterNoProject((v) => !v);
                    setFilterNoAssignee(false);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    filterNoProject
                      ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-400"
                  )}
                >
                  <FolderX className="h-3 w-3" />
                  No project
                  <span className={cn(
                    "flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    filterNoProject ? "bg-amber-500/30 text-amber-300" : "bg-muted text-muted-foreground"
                  )}>
                    {noProjectCount}
                  </span>
                </button>
              )}

              {noAssigneeCount > 0 && (
                <button
                  onClick={() => {
                    setFilterNoAssignee((v) => !v);
                    setFilterNoProject(false);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    filterNoAssignee
                      ? "border-orange-500/50 bg-orange-500/15 text-orange-400"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-orange-500/40 hover:bg-orange-500/10 hover:text-orange-400"
                  )}
                >
                  <UserX className="h-3 w-3" />
                  No assignee
                  <span className={cn(
                    "flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold",
                    filterNoAssignee ? "bg-orange-500/30 text-orange-300" : "bg-muted text-muted-foreground"
                  )}>
                    {noAssigneeCount}
                  </span>
                </button>
              )}

              {(filterNoProject || filterNoAssignee) && (
                <button
                  onClick={() => { setFilterNoProject(false); setFilterNoAssignee(false); }}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Kanban board — own scroll context */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <div className="flex h-full min-h-0 gap-3 p-4" style={{ minWidth: "max-content" }}>
            <DndContext
              sensors={sensors}
              collisionDetection={customCollision}
              measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              {COLUMNS.map((col) => (
                <TaskColumn
                  key={col.id}
                  id={col.id}
                  label={col.label}
                  color={col.color}
                  tasks={visibleTasks[col.id]}
                  isOver={overColumnId === col.id}
                  onAddTask={() => handleOpenCreate(col.id)}
                  onSelectTask={setSelectedTask}
                />
              ))}

              <DragOverlay dropAnimation={{ duration: 150, easing: "cubic-bezier(0.18,0.67,0.6,1.22)" }}>
                {activeTask && (
                  <div className="rotate-2 opacity-90">
                    <TaskCard task={activeTask} onSelect={() => {}} isDragging />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          adminUsers={adminUsers}
          projects={projects}
          currentUserId={currentUserId}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}

      {/* Create Task Modal */}
      {showCreate && (
        <TaskCreateModal
          defaultStatus={createStatus}
          defaultProjectId={typeof selectedProjectId === "string" ? selectedProjectId : null}
          adminUsers={adminUsers}
          projects={projects}
          onClose={() => setShowCreate(false)}
          onCreated={handleTaskCreated}
        />
      )}

      {/* Project Create/Edit Modal */}
      {showProjectModal && (
        <ProjectCreateModal
          project={editingProject}
          adminUsers={adminUsers}
          onClose={() => { setShowProjectModal(false); setEditingProject(null); }}
          onSaved={handleProjectSaved}
        />
      )}
    </div>
  );
}
