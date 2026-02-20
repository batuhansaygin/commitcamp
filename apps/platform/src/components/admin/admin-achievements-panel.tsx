"use client";

import { useState, useTransition } from "react";
import {
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from "@/lib/actions/admin/achievements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit, Loader2, Power } from "lucide-react";

const RARITIES = ["common", "rare", "epic", "legendary"];
const CATEGORIES = ["activity", "social", "streak", "coding", "special"];

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  rarity: string;
  category: string;
  is_active: boolean;
  criteria: Record<string, unknown>;
  earned_count?: { count: number }[];
}

const RARITY_COLORS: Record<string, string> = {
  common: "bg-gray-500/15 text-gray-400",
  rare: "bg-blue-500/15 text-blue-400",
  epic: "bg-purple-500/15 text-purple-400",
  legendary: "bg-yellow-500/15 text-yellow-400",
};

const emptyForm = {
  name: "",
  description: "",
  icon: "🏆",
  xp_reward: 100,
  rarity: "common",
  category: "activity",
  criteria: {},
};

interface Props {
  achievements: Achievement[];
}

export function AdminAchievementsPanel({ achievements }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Achievement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Achievement | null>(null);
  const [form, setForm] = useState(emptyForm);

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
      xp_reward: a.xp_reward,
      rarity: a.rarity,
      category: a.category,
      criteria: a.criteria,
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

  function handleToggleActive(a: Achievement) {
    startTransition(async () => {
      await updateAchievement(a.id, { is_active: !a.is_active });
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => {
          const earnedCount = a.earned_count?.[0]?.count ?? 0;
          return (
            <Card
              key={a.id}
              className={`relative transition-opacity ${!a.is_active ? "opacity-50" : ""}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{a.icon}</span>
                    <div>
                      <CardTitle className="text-sm font-semibold">{a.name}</CardTitle>
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${
                          RARITY_COLORS[a.rarity] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {a.rarity}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      title={a.is_active ? "Deactivate" : "Activate"}
                      disabled={isPending}
                      onClick={() => handleToggleActive(a)}
                      className={`rounded p-1 transition-colors hover:bg-accent disabled:opacity-30 ${
                        a.is_active ? "text-emerald-400" : "text-muted-foreground"
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                    </button>
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
                <p className="mb-3 text-xs text-muted-foreground">{a.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded bg-muted px-1.5 py-0.5 capitalize text-muted-foreground">
                    {a.category}
                  </span>
                  <div className="flex gap-3 text-muted-foreground">
                    <span>+{a.xp_reward} XP</span>
                    <span>{earnedCount} earned</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Edit Achievement" : "New Achievement"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Icon
                </label>
                <input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-center text-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="col-span-3">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="First Post"
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Create your first forum post"
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Rarity
                </label>
                <select
                  value={form.rarity}
                  onChange={(e) => setForm({ ...form, rarity: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring capitalize"
                >
                  {RARITIES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring capitalize"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  XP Reward
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.xp_reward}
                  onChange={(e) =>
                    setForm({ ...form, xp_reward: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
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
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
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
