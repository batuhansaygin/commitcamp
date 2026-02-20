"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Folder, FolderOpen, LayoutGrid, Pencil, Trash2, Info } from "lucide-react";
import type { AdminProject, AdminProfile } from "@/lib/actions/admin/tasks";
import { deleteProject } from "@/lib/actions/admin/tasks";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  projects: AdminProject[];
  adminUsers: AdminProfile[];
  selectedProjectId: string | null | undefined;
  onSelect: (projectId: string | null | undefined) => void;
  onCreateProject: () => void;
  onEditProject: (project: AdminProject) => void;
  onProjectDeleted: (projectId: string) => void;
}

function AssigneeAvatar({ profile }: { profile: AdminProfile }) {
  const name = profile.display_name ?? profile.username ?? "?";
  return (
    <div
      className="h-4 w-4 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-[8px] font-bold text-white ring-1 ring-border"
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

/** Portal-based tooltip for project details — bypasses overflow clipping */
function ProjectInfoTooltip({ project }: { project: AdminProject }) {
  const hasDetails = !!project.description || !!project.assignee;
  if (!hasDetails) return null;

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger
        asChild
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-muted-foreground"
        >
          <Info className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        align="start"
        className="w-56 p-3 text-left"
      >
        <p className="text-xs font-semibold text-foreground">{project.name}</p>
        {project.description && (
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            {project.description}
          </p>
        )}
        {project.assignee && (
          <div className="mt-2 flex items-center gap-1.5 border-t border-border pt-2">
            <AssigneeAvatar profile={project.assignee} />
            <span className="text-[10px] text-muted-foreground">
              {project.assignee.display_name ?? project.assignee.username}
            </span>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/** Folder icon filled with the project color */
function ProjectFolderIcon({
  color,
  isOpen,
}: {
  color: string;
  isOpen: boolean;
}) {
  const Icon = isOpen ? FolderOpen : Folder;
  return (
    <Icon
      className="h-4 w-4 shrink-0"
      style={{
        color: color,
        fill: color,
        // Slightly tone down the fill opacity while keeping solid stroke
        opacity: 0.9,
      }}
    />
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
    <TooltipProvider>
      <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-3 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Projects
          </span>
          <button
            onClick={onCreateProject}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="New project"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
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
            <span className="flex-1 truncate text-left text-sm">All Tasks</span>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {projects.reduce((sum, p) => sum + (p.task_count ?? 0), 0)}
            </span>
          </button>

          {projects.length > 0 && (
            <div className="mx-2 my-1.5 border-t border-border/60" />
          )}

          {/* Project list */}
          {projects.map((project) => {
            const isSelected = selectedProjectId === project.id;

            return (
              <div key={project.id} className="group relative">
                <button
                  onClick={() => onSelect(project.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <ProjectFolderIcon color={project.color} isOpen={isSelected} />

                  <span className="flex-1 truncate text-left text-sm leading-tight">
                    {project.name}
                  </span>

                  {(project.task_count ?? 0) > 0 && (
                    <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                      {project.task_count}
                    </span>
                  )}
                </button>

                {/* Action row — info + edit + delete, visible on hover */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 group-hover:flex">
                  <ProjectInfoTooltip project={project} />

                  <button
                    onClick={(e) => handleEdit(project, e)}
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Edit project"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(project, e)}
                    disabled={deletingId === project.id}
                    className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
            <div className="px-3 py-8 text-center">
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
    </TooltipProvider>
  );
}
