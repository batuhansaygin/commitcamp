"use client";

import { useState, useTransition, useRef } from "react";
import {
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from "@/lib/actions/admin/achievements";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Loader2, Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ── Constants ──────────────────────────────────────────────────────────────────

const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"] as const;
const CATEGORIES = ["milestone", "streak", "community", "skill", "level", "explorer", "quality", "special"] as const;

const REQUIREMENT_TYPES = [
  { value: "posts_count",        label: "Posts Count" },
  { value: "comments_count",     label: "Comments Count" },
  { value: "snippets_count",     label: "Snippets Count" },
  { value: "followers_count",    label: "Followers Count" },
  { value: "following_count",    label: "Following Count" },
  { value: "xp_points",          label: "XP Points" },
  { value: "level",              label: "Level" },
  { value: "current_streak",     label: "Current Streak (days)" },
  { value: "longest_streak",     label: "Longest Streak (days)" },
  { value: "reactions_received", label: "Reactions Received" },
  { value: "challenges_solved",  label: "Challenges Solved" },
  { value: "duel_wins",          label: "Duel Wins" },
] as const;

const RARITY_COLORS: Record<string, string> = {
  common:    "bg-slate-500/15 text-slate-400",
  uncommon:  "bg-emerald-500/15 text-emerald-400",
  rare:      "bg-sky-500/15 text-sky-400",
  epic:      "bg-purple-500/15 text-purple-400",
  legendary: "bg-amber-500/15 text-amber-400",
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  icon_url: string | null;
  xp_reward: number;
  rarity: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  sort_order: number;
  created_at: string;
  earned_count?: { count: number }[];
}

interface AchievementForm {
  name: string;
  description: string;
  icon: string;
  icon_url: string | null;
  xp_reward: number;
  rarity: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
}

const emptyForm: AchievementForm = {
  name: "",
  description: "",
  icon: "🏆",
  icon_url: null,
  xp_reward: 100,
  rarity: "common",
  category: "milestone",
  requirement_type: "posts_count",
  requirement_value: 1,
};

// ── Icon display helper ────────────────────────────────────────────────────────

function AchievementIcon({ icon, icon_url, size = "md" }: { icon: string; icon_url: string | null; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-8 w-8 text-lg", md: "h-10 w-10 text-2xl", lg: "h-14 w-14 text-3xl" };
  if (icon_url) {
    return (
      <div className={cn("relative overflow-hidden rounded-lg flex-shrink-0", sizes[size])}>
        <Image src={icon_url} alt="" fill className="object-cover" />
      </div>
    );
  }
  return <span className={cn("flex items-center justify-center flex-shrink-0", sizes[size])}>{icon}</span>;
}

// ── Image uploader (inline) ────────────────────────────────────────────────────

interface IconUploaderProps {
  currentUrl: string | null;
  onUploaded: (url: string | null) => void;
}

function IconUploader({ currentUrl, onUploaded }: IconUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl);

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "png";
    const path = `icons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("achievement-icons")
      .upload(path, file, { upsert: false });

    if (error || !data) {
      setPreview(currentUrl);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("achievement-icons")
      .getPublicUrl(data.path);

    onUploaded(publicUrl);
    setUploading(false);
  };

  const handleRemove = () => {
    setPreview(null);
    onUploaded(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-3">
      {preview ? (
        <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-border">
          <Image src={preview} alt="" fill className="object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
          <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="text-xs"
        >
          {uploading
            ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            : <Upload className="mr-1.5 h-3 w-3" />
          }
          {preview ? "Replace image" : "Upload image"}
        </Button>
        <p className="mt-1 text-[10px] text-muted-foreground">JPG, PNG, GIF, WebP · max 5 MB</p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  achievements: Achievement[];
}

export function AdminAchievementsPanel({ achievements }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Achievement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Achievement | null>(null);
  const [form, setForm] = useState<AchievementForm>(emptyForm);

  function openCreate() {
    setForm(emptyForm);
    setEditTarget(null);
    setShowForm(true);
  }

  function openEdit(a: Achievement) {
    setForm({
      name: a.name,
      description: a.description,
      icon: a.icon,
      icon_url: a.icon_url,
      xp_reward: a.xp_reward,
      rarity: a.rarity,
      category: a.category,
      requirement_type: a.requirement_type,
      requirement_value: a.requirement_value,
    });
    setEditTarget(a);
    setShowForm(true);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        if (editTarget) {
          await updateAchievement(editTarget.id, form);
        } else {
          await createAchievement(form);
        }
        setShowForm(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteAchievement(deleteTarget.id);
        setDeleteTarget(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  const reqLabel = (type: string) =>
    REQUIREMENT_TYPES.find((r) => r.value === type)?.label ?? type;

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {achievements.length} achievements
        </span>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Achievement
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => {
          const earnedCount = a.earned_count?.[0]?.count ?? 0;
          return (
            <Card key={a.id} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <AchievementIcon icon={a.icon} icon_url={a.icon_url} size="md" />
                    <div className="min-w-0">
                      <CardTitle className="truncate text-sm font-semibold">{a.name}</CardTitle>
                      <span className={cn(
                        "inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium capitalize",
                        RARITY_COLORS[a.rarity] ?? "bg-muted text-muted-foreground"
                      )}>
                        {a.rarity}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      title="Edit"
                      onClick={() => openEdit(a)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      title="Delete"
                      onClick={() => setDeleteTarget(a)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded bg-muted px-1.5 py-0.5 capitalize text-muted-foreground">
                    {a.category}
                  </span>
                  <div className="flex gap-3 text-muted-foreground">
                    <span>+{a.xp_reward} XP</span>
                    <span>{earnedCount} earned</span>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground/60">
                  {reqLabel(a.requirement_type)} ≥ {a.requirement_value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Achievement" : "New Achievement"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="First Commit"
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Description *</label>
              <RichTextEditor
                value={form.description}
                onChange={(html) => setForm({ ...form, description: html })}
                placeholder="Publish your very first post"
                minHeight="80px"
              />
            </div>

            {/* Icon — emoji + image upload */}
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Icon</p>

              <div className="flex items-end gap-4">
                {/* Emoji fallback */}
                <div className="shrink-0">
                  <label className="mb-1 block text-[10px] text-muted-foreground/70">Emoji fallback</label>
                  <input
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                    className="h-10 w-14 rounded-lg border border-border bg-input text-center text-xl focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={4}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <label className="mb-1 block text-[10px] text-muted-foreground/70">
                    Image (overrides emoji when set)
                  </label>
                  <IconUploader
                    currentUrl={form.icon_url}
                    onUploaded={(url) => setForm({ ...form, icon_url: url })}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/60">Preview:</span>
                <AchievementIcon icon={form.icon} icon_url={form.icon_url} size="sm" />
              </div>
            </div>

            {/* Rarity / Category / XP */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Rarity</label>
                <select
                  value={form.rarity}
                  onChange={(e) => setForm({ ...form, rarity: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">XP Reward</label>
                <input
                  type="number"
                  min={0}
                  value={form.xp_reward}
                  onChange={(e) => setForm({ ...form, xp_reward: parseInt(e.target.value, 10) || 0 })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Requirement type (select) + value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Requirement Type</label>
                <select
                  value={form.requirement_type}
                  onChange={(e) => setForm({ ...form, requirement_type: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {REQUIREMENT_TYPES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Requirement Value</label>
                <input
                  type="number"
                  min={1}
                  value={form.requirement_value}
                  onChange={(e) => setForm({ ...form, requirement_value: parseInt(e.target.value, 10) || 1 })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              disabled={!form.name.trim() || !form.description.trim() || isPending}
              onClick={handleSubmit}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editTarget ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will also remove all earned records for this achievement.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
