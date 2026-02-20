"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Folder, FolderOpen, LayoutGrid, Pencil, Trash2 } from "lucide-react";
import type { AdminProject, AdminProfile } from "@/lib/actions/admin/tasks";
import { deleteProject } from "@/lib/actions/admin/tasks";

interface Props {
  projects: AdminProject[];
  adminUsers: AdminProfile[];
  selectedProjectId: string | null | undefined;
  onSelect: (projectId: string | null | undefined) => void;
  onCreateProject: () => void;
  onEditProject: (project: AdminProject) => void;
  onProjectDeleted: (projectId: string) => void;
}

function Avatar({ profile }: { profile: AdminProfile }) {
  const name = profile.display_name ?? profile.username ?? "?";
  return (
    <div
      className="h-5 w-5 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white ring-1 ring-border"
      title={name}
    >
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

export function ProjectListSidebar({
  projects,
  adminUsers: _adminUsers,
  selectedProjectId,
  onSelect,
  onCreateProject,
  onEditProject,
  onProjectDeleted,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (project: AdminProject, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete project "${project.name}"? Tasks won't be deleted but will become unassigned.`)) return;
    setDeletingId(project.id);
    try {
      await deleteProject(project.id);
      onProjectDeleted(project.id);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (project: AdminProject, e: React.MouseEvent) => {
    e.stopPropagation();
    onEditProject(project);
  };

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Projects
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onCreateProject}
          title="New project"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* All Tasks */}
        <button
          onClick={() => onSelect(undefined)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
            selectedProjectId === undefined
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate text-left">All Tasks</span>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {projects.reduce((sum, p) => sum + (p.task_count ?? 0), 0)}
          </span>
        </button>

        {/* Separator */}
        {projects.length > 0 && (
          <div className="mx-2 my-1 border-t border-border/60" />
        )}

        {/* Project list */}
        {projects.map((project) => {
          const isSelected = selectedProjectId === project.id;
          const FolderIcon = isSelected ? FolderOpen : Folder;
          return (
            <div key={project.id} className="group relative">
              <button
                onClick={() => onSelect(project.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors pr-14",
                  isSelected
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {/* Color dot + folder icon */}
                <div className="relative shrink-0">
                  <FolderIcon className="h-4 w-4" style={{ color: project.color }} />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <p className="truncate text-sm leading-tight">{project.name}</p>
                  {project.assignee && (
                    <div className="mt-0.5 flex items-center gap-1">
                      <Avatar profile={project.assignee} />
                      <span className="truncate text-[10px] text-muted-foreground">
                        {project.assignee.display_name ?? project.assignee.username}
                      </span>
                    </div>
                  )}
                </div>

                {/* Task count badge */}
                {(project.task_count ?? 0) > 0 && (
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {project.task_count}
                  </span>
                )}
              </button>

              {/* Edit / Delete on hover */}
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={(e) => handleEdit(project, e)}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Edit project"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => handleDelete(project, e)}
                  disabled={deletingId === project.id}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="px-3 py-6 text-center">
            <Folder className="mx-auto h-8 w-8 text-muted-foreground/30" />
            <p className="mt-2 text-xs text-muted-foreground">No projects yet</p>
            <button
              onClick={onCreateProject}
              className="mt-1 text-xs text-primary hover:underline"
            >
              Create one
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
}
