"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus, Folder, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Filter tasks by selected project
  const visibleTasks = useMemo((): Record<TaskStatus, AdminTask[]> => {
    if (selectedProjectId === undefined) return tasks; // all tasks
    const filtered: Record<TaskStatus, AdminTask[]> = {
      backlog: [], todo: [], in_progress: [], in_review: [], done: [],
    };
    for (const [status, col] of Object.entries(tasks) as [TaskStatus, AdminTask[]][]) {
      filtered[status] = col.filter((t) => t.project_id === selectedProjectId);
    }
    return filtered;
  }, [tasks, selectedProjectId]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const totalVisible = Object.values(visibleTasks).flat().length;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    for (const col of Object.values(tasks)) {
      const found = col.find((t) => t.id === id);
      if (found) { setActiveTask(found); break; }
    }
  }, [tasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    let sourceStatus: TaskStatus | null = null;
    let sourceIndex = -1;
    for (const [status, col] of Object.entries(tasks)) {
      const idx = col.findIndex((t) => t.id === taskId);
      if (idx !== -1) { sourceStatus = status as TaskStatus; sourceIndex = idx; break; }
    }
    if (!sourceStatus) return;

    let destStatus: TaskStatus = sourceStatus;
    let destIndex = 0;

    if (COLUMNS.some((c) => c.id === overId)) {
      destStatus = overId as TaskStatus;
      destIndex = tasks[destStatus].length;
    } else {
      for (const [status, col] of Object.entries(tasks)) {
        const idx = col.findIndex((t) => t.id === overId);
        if (idx !== -1) { destStatus = status as TaskStatus; destIndex = idx; break; }
      }
    }

    setTasks((prev) => {
      const next = { ...prev };
      if (sourceStatus === destStatus) {
        next[sourceStatus] = arrayMove(prev[sourceStatus], sourceIndex, destIndex);
      } else {
        const sourceCol = [...prev[sourceStatus!]];
        const [moved] = sourceCol.splice(sourceIndex, 1);
        const destCol = [...prev[destStatus]];
        destCol.splice(destIndex, 0, { ...moved, status: destStatus });
        next[sourceStatus!] = sourceCol;
        next[destStatus] = destCol;
      }
      return next;
    });

    startTransition(async () => {
      await moveTask(taskId, destStatus, destIndex);
    });
  }, [tasks]);

  const handleOpenCreate = (status: TaskStatus) => {
    setCreateStatus(status);
    setShowCreate(true);
  };

  const handleTaskCreated = (task: AdminTask) => {
    setTasks((prev) => ({
      ...prev,
      [task.status]: [...prev[task.status], task],
    }));
    // Update project task_count
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
        // Decrement project task_count
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
    // If the deleted project was selected, go back to "All Tasks"
    if (selectedProjectId === projectId) setSelectedProjectId(undefined);
  };

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Project sidebar */}
      <ProjectListSidebar
        projects={projects}
        adminUsers={adminUsers}
        selectedProjectId={selectedProjectId}
        onSelect={setSelectedProjectId}
        onCreateProject={() => { setEditingProject(null); setShowProjectModal(true); }}
        onEditProject={(p) => { setEditingProject(p); setShowProjectModal(true); }}
        onProjectDeleted={handleProjectDeleted}
      />

      {/* Main board area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Board header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-5 py-3.5">
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
              </>
            ) : (
              <>
                <div>
                  <h1 className="text-base font-bold">All Tasks</h1>
                  <p className="text-xs text-muted-foreground">
                    {totalVisible} task{totalVisible !== 1 ? "s" : ""} across all projects
                  </p>
                </div>
              </>
            )}
            {selectedProject && (
              <p className="ml-1 shrink-0 text-xs text-muted-foreground">
                {totalVisible} task{totalVisible !== 1 ? "s" : ""}
              </p>
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

        {/* Kanban board */}
        <div className="flex-1 overflow-auto p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 pb-4" style={{ minWidth: "min-content" }}>
              {COLUMNS.map((col) => (
                <TaskColumn
                  key={col.id}
                  id={col.id}
                  label={col.label}
                  color={col.color}
                  tasks={visibleTasks[col.id]}
                  onAddTask={() => handleOpenCreate(col.id)}
                  onSelectTask={setSelectedTask}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask && (
                <TaskCard task={activeTask} onSelect={() => {}} isDragging />
              )}
            </DragOverlay>
          </DndContext>
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
