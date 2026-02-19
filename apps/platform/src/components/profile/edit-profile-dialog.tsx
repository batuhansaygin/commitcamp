"use client";

import { useState, useEffect, useRef, useCallback, useActionState } from "react";
import { useTranslations } from "@/lib/i18n";
import { useRouter } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateProfile } from "@/lib/actions/profile";
import { updateAvatarUrl, updateCoverUrl } from "@/lib/actions/profile";
import { checkUsernameAvailable } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, CheckCircle2, X, Camera, Edit } from "lucide-react";
import type { Profile } from "@/lib/types/profiles";

const COMMON_TECHS = [
  "React", "Next.js", "TypeScript", "JavaScript", "Python", "Node.js",
  "Go", "Rust", "Java", "C#", "Flutter", "Docker", "AWS", "PostgreSQL",
  "MongoDB", "Redis", "GraphQL", "TailwindCSS", "Vue.js", "Angular",
  "Swift", "Kotlin", "Ruby", "PHP", "Django", "FastAPI", "Express",
  "Spring", "Svelte", "Linux", "Git", "Kubernetes",
];

interface EditProfileDialogProps {
  profile: Profile;
  trigger?: React.ReactNode;
}

export function EditProfileDialog({ profile, trigger }: EditProfileDialogProps) {
  const t = useTranslations("profile");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateProfile, {});

  // Tech stack local state
  const [techStack, setTechStack] = useState<string[]>(profile.tech_stack ?? []);
  const [techInput, setTechInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Username availability
  const [username, setUsername] = useState(profile.username);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Avatar / cover upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [coverUrl, setCoverUrl] = useState(profile.cover_url ?? "");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Bio character counter
  const [bio, setBio] = useState(profile.bio ?? "");

  useEffect(() => {
    if (state.success) {
      router.refresh();
      setOpen(false);
    }
  }, [state.success, router]);

  // Debounced username check
  const checkUsername = useCallback(
    (value: string) => {
      if (usernameTimer.current) clearTimeout(usernameTimer.current);
      if (value === profile.username) {
        setUsernameStatus("idle");
        return;
      }
      if (value.length < 3) {
        setUsernameStatus("idle");
        return;
      }
      setUsernameStatus("checking");
      usernameTimer.current = setTimeout(async () => {
        const { available } = await checkUsernameAvailable(value);
        setUsernameStatus(available ? "available" : "taken");
      }, 500);
    },
    [profile.username]
  );

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUsername(e.target.value);
    checkUsername(e.target.value);
  }

  // Tech stack management
  const filteredSuggestions = COMMON_TECHS.filter(
    (t) =>
      t.toLowerCase().includes(techInput.toLowerCase()) &&
      !techStack.map((s) => s.toLowerCase()).includes(t.toLowerCase())
  );

  function addTech(tech: string) {
    const trimmed = tech.trim();
    if (!trimmed || techStack.map((s) => s.toLowerCase()).includes(trimmed.toLowerCase())) return;
    setTechStack((prev) => [...prev, trimmed]);
    setTechInput("");
    setShowSuggestions(false);
  }

  function removeTech(tech: string) {
    setTechStack((prev) => prev.filter((t) => t !== tech));
  }

  function handleTechKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTech(techInput);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  // File upload helpers
  async function uploadFile(
    file: File,
    bucket: "avatars" | "covers",
    onSuccess: (url: string) => void,
    setUploading: (v: boolean) => void
  ) {
    if (file.size > (bucket === "covers" ? 5 * 1024 * 1024 : 2 * 1024 * 1024)) {
      alert(
        bucket === "covers"
          ? "Cover image must be smaller than 5 MB."
          : "Avatar must be smaller than 2 MB."
      );
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

    if (error) {
      alert("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    if (bucket === "avatars") {
      await updateAvatarUrl(publicUrl);
      setAvatarUrl(publicUrl);
    } else {
      await updateCoverUrl(publicUrl);
      setCoverUrl(publicUrl);
    }

    onSuccess(publicUrl);
    setUploading(false);
  }

  const initial = (profile.display_name || profile.username).charAt(0).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            {t("editProfile")}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("edit.title")}</DialogTitle>
        </DialogHeader>

        <form action={action} className="space-y-5">
          {/* Hidden tech_stack field */}
          <input
            type="hidden"
            name="tech_stack"
            value={JSON.stringify(techStack)}
          />

          {/* Avatar + Cover preview */}
          <div className="relative">
            {/* Cover */}
            <div className="relative h-28 w-full overflow-hidden rounded-lg bg-gradient-to-br from-primary/30 to-purple-500/30">
              {coverUrl && (
                <img src={coverUrl} alt="cover" className="h-full w-full object-cover" />
              )}
              <button
                type="button"
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => coverInputRef.current?.click()}
                disabled={coverUploading}
              >
                {coverUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <div className="flex items-center gap-1.5 text-white text-xs font-medium">
                    <Camera className="h-4 w-4" />
                    {t("edit.changeCover")}
                  </div>
                )}
              </button>
            </div>

            {/* Avatar */}
            <div className="absolute -bottom-8 left-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-background overflow-hidden bg-gradient-to-br from-cyan-accent to-purple-accent flex items-center justify-center text-xl font-bold text-white">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <button
                  type="button"
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <Camera className="h-4 w-4 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file, "avatars", setAvatarUrl, setAvatarUploading);
            }}
          />
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadFile(file, "covers", setCoverUrl, setCoverUploading);
            }}
          />

          {/* Spacer for avatar overlap */}
          <div className="pt-8" />

          {/* Alerts */}
          {state.success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {t("edit.saved")}
            </div>
          )}
          {state.error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Display Name */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {t("edit.displayName")}
              </label>
              <input
                name="display_name"
                maxLength={50}
                defaultValue={profile.display_name ?? ""}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Username */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {t("edit.username")} *
              </label>
              <div className="relative">
                <input
                  name="username"
                  required
                  minLength={3}
                  maxLength={30}
                  value={username}
                  onChange={handleUsernameChange}
                  className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {usernameStatus === "checking" && (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {usernameStatus === "available" && (
                  <CheckCircle2 className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />
                )}
                {usernameStatus === "taken" && (
                  <AlertCircle className="absolute right-3 top-2.5 h-4 w-4 text-destructive" />
                )}
              </div>
              {usernameStatus === "available" && (
                <p className="mt-0.5 text-xs text-green-500">{t("edit.usernameAvailable")}</p>
              )}
              {usernameStatus === "taken" && (
                <p className="mt-0.5 text-xs text-destructive">{t("edit.usernameTaken")}</p>
              )}
              {usernameStatus === "idle" && (
                <p className="mt-0.5 text-xs text-muted-foreground">{t("edit.usernameHint")}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="mb-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{t("edit.bio")}</span>
              <span className={bio.length > 450 ? "text-orange-400" : ""}>{bio.length}/500</span>
            </label>
            <textarea
              name="bio"
              maxLength={500}
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full resize-none rounded-lg border border-border bg-input p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Location */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {t("edit.location")}
              </label>
              <input
                name="location"
                maxLength={100}
                defaultValue={profile.location ?? ""}
                placeholder={t("edit.locationPlaceholder")}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Website */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {t("edit.website")}
              </label>
              <input
                name="website"
                type="url"
                maxLength={200}
                defaultValue={profile.website ?? ""}
                placeholder={t("edit.websitePlaceholder")}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* GitHub */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {t("edit.github")}
              </label>
              <input
                name="github_username"
                maxLength={39}
                defaultValue={profile.github_username ?? ""}
                placeholder={t("edit.githubPlaceholder")}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Twitter */}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {t("edit.twitter")}
              </label>
              <input
                name="twitter_username"
                maxLength={50}
                defaultValue={profile.twitter_username ?? ""}
                placeholder={t("edit.twitterPlaceholder")}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {t("edit.techStack")}
            </label>

            {/* Selected tags */}
            {techStack.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTech(tech)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="relative">
              <input
                value={techInput}
                onChange={(e) => {
                  setTechInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={handleTechKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder={t("edit.techStackPlaceholder")}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />

              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
                  {filteredSuggestions.slice(0, 8).map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onMouseDown={() => addTech(tech)}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Press Enter or comma to add
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              {t("edit.cancel")}
            </Button>
            <Button type="submit" disabled={pending || usernameStatus === "taken"}>
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("edit.saving")}
                </>
              ) : (
                t("edit.save")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
