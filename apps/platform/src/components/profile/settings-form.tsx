"use client";

import { useActionState, useState, useRef, useCallback } from "react";
import { updateProfile } from "@/lib/actions/profiles";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  MapPin,
  Globe,
  Github,
  Twitter,
  ImageIcon,
  Cpu,
  X,
  Plus,
  Camera,
} from "lucide-react";
import type { Profile } from "@/lib/types/profiles";

interface SettingsFormProps {
  profile: Profile;
}

const POPULAR_TECH = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Go",
  "Rust",
  "Java",
  "C++",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "Tailwind CSS",
  "GraphQL",
  "Vue.js",
  "Svelte",
];

function FieldWrapper({
  label,
  hint,
  children,
  required,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-primary">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function InputField({
  id,
  name,
  defaultValue,
  placeholder,
  prefix,
  maxLength,
  type = "text",
}: {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  prefix?: React.ReactNode;
  maxLength?: number;
  type?: string;
}) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <div className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
          {prefix}
        </div>
      )}
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full rounded-lg border border-border bg-background/50 py-2.5 text-sm transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 ${prefix ? "pl-9 pr-3" : "px-3"}`}
      />
    </div>
  );
}

function BioField({ defaultValue }: { defaultValue?: string }) {
  const [count, setCount] = useState((defaultValue ?? "").length);
  const max = 300;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor="bio" className="text-sm font-medium text-foreground">
          Bio
        </label>
        <span
          className={`text-xs tabular-nums ${count > max * 0.9 ? (count >= max ? "text-destructive" : "text-amber-500") : "text-muted-foreground"}`}
        >
          {count}/{max}
        </span>
      </div>
      <textarea
        id="bio"
        name="bio"
        maxLength={max}
        rows={4}
        defaultValue={defaultValue ?? ""}
        onChange={(e) => setCount(e.target.value.length)}
        placeholder="Tell the community about yourself, your experience, and what you're working on..."
        className="w-full resize-none rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

function TechStackField({ defaultValue }: { defaultValue: string[] }) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = POPULAR_TECH.filter(
    (t) =>
      !tags.includes(t) &&
      t.toLowerCase().includes(input.toLowerCase()) &&
      input.length > 0
  ).slice(0, 5);

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (trimmed && !tags.includes(trimmed) && tags.length < 20) {
        setTags((prev) => [...prev, trimmed]);
        setInput("");
      }
    },
    [tags]
  );

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">
        Tech Stack
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          ({tags.length}/20)
        </span>
      </label>

      <input
        type="hidden"
        name="tech_stack_serialized"
        value={tags.join(",")}
      />

      {/* Tag display + input */}
      <div
        className="flex min-h-[48px] flex-wrap gap-2 rounded-lg border border-border bg-background/50 px-3 py-2.5 transition-colors focus-within:border-primary/50 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="rounded hover:text-destructive transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            tags.length === 0 ? "Add technologies (e.g. React, Go...)" : ""
          }
          className="min-w-[140px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          disabled={tags.length >= 20}
        />
      </div>

      {/* Autocomplete suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="h-3 w-3" />
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Popular suggestions when empty */}
      {tags.length === 0 && input.length === 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground self-center">
            Popular:
          </span>
          {POPULAR_TECH.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="h-3 w-3" />
              {s}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add. Click × to remove.
      </p>
    </div>
  );
}

function ImagePreviewField({
  id,
  name,
  label,
  defaultValue,
  placeholder,
  hint,
  aspectClass,
  icon,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  aspectClass: string;
  icon: React.ReactNode;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className={`relative w-full overflow-hidden rounded-xl border border-border bg-muted/30 ${aspectClass}`}>
        {url ? (
          <img
            src={url}
            alt={label}
            className="h-full w-full object-cover"
            onError={() => setUrl("")}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground/40">
            {icon}
            <span className="text-xs">{hint ?? "No image set"}</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </div>
      </div>
      <input
        id={id}
        name={name}
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={placeholder}
        maxLength={500}
        className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 text-sm transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const [state, action, pending] = useActionState(updateProfile, {});

  return (
    <form action={action} className="space-y-6">
      {/* Status banners */}
      {state.success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Profile updated successfully!
        </div>
      )}
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.error}
        </div>
      )}

      {/* ── Cover & Avatar ── */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4 text-primary" />
            Profile Images
          </CardTitle>
          <CardDescription>
            Paste a direct image URL for your avatar and cover photo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Cover image */}
          <ImagePreviewField
            id="cover_url"
            name="cover_url"
            label="Cover Photo"
            defaultValue={profile.cover_url ?? ""}
            placeholder="https://example.com/cover.jpg"
            hint="Wide banner image shown at the top of your profile"
            aspectClass="aspect-[4/1]"
            icon={<ImageIcon className="h-8 w-8" />}
          />

          {/* Avatar image */}
          <div className="flex items-start gap-6">
            <div className="shrink-0 space-y-2">
              <label className="text-sm font-medium text-foreground">
                Preview
              </label>
              <AvatarPreview
                urlInput="avatar_url_preview"
                defaultUrl={profile.avatar_url ?? ""}
                displayName={profile.display_name ?? profile.username}
              />
            </div>
            <div className="flex-1">
              <ImagePreviewField
                id="avatar_url"
                name="avatar_url"
                label="Avatar"
                defaultValue={profile.avatar_url ?? ""}
                placeholder="https://example.com/avatar.jpg"
                hint="Square image, at least 200×200px recommended"
                aspectClass="aspect-square max-h-28 w-28"
                icon={<User className="h-6 w-6" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Basic Information ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            Basic Information
          </CardTitle>
          <CardDescription>
            This is the public information shown on your profile page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Username */}
          <FieldWrapper
            label="Username"
            required
            hint="3–30 characters. Lowercase letters, numbers, hyphens and underscores only."
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                @
              </span>
              <input
                id="username"
                name="username"
                required
                minLength={3}
                maxLength={30}
                defaultValue={profile.username}
                placeholder="your_username"
                className="w-full rounded-lg border border-border bg-background/50 py-2.5 pl-7 pr-3 text-sm transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </FieldWrapper>

          {/* Display name */}
          <FieldWrapper
            label="Display Name"
            hint="Your full name or a friendly alias (max 50 characters)."
          >
            <InputField
              id="display_name"
              name="display_name"
              defaultValue={profile.display_name ?? ""}
              placeholder="Your Name"
              maxLength={50}
            />
          </FieldWrapper>

          {/* Bio */}
          <BioField defaultValue={profile.bio ?? ""} />

          {/* Location */}
          <FieldWrapper label="Location">
            <InputField
              id="location"
              name="location"
              defaultValue={profile.location ?? ""}
              placeholder="Istanbul, Turkey"
              maxLength={100}
              prefix={<MapPin className="h-4 w-4" />}
            />
          </FieldWrapper>
        </CardContent>
      </Card>

      {/* ── Social Links ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-primary" />
            Social Links
          </CardTitle>
          <CardDescription>
            Connect your accounts so others can find you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Website */}
          <FieldWrapper label="Website" hint="Your personal site or portfolio.">
            <InputField
              id="website"
              name="website"
              type="url"
              defaultValue={profile.website ?? ""}
              placeholder="https://yoursite.com"
              maxLength={200}
              prefix={<Globe className="h-4 w-4" />}
            />
          </FieldWrapper>

          {/* GitHub */}
          <FieldWrapper
            label="GitHub"
            hint="Enter your username without the @ symbol."
          >
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-3 flex items-center gap-1 text-muted-foreground">
                <Github className="h-4 w-4" />
                <span className="text-xs">github.com/</span>
              </div>
              <input
                id="github_username"
                name="github_username"
                maxLength={39}
                defaultValue={profile.github_username ?? ""}
                placeholder="your-handle"
                className="w-full rounded-lg border border-border bg-background/50 py-2.5 pl-24 pr-3 text-sm transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </FieldWrapper>

          {/* Twitter/X */}
          <FieldWrapper
            label="Twitter / X"
            hint="Enter your username without the @ symbol."
          >
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-3 flex items-center gap-1 text-muted-foreground">
                <Twitter className="h-4 w-4" />
                <span className="text-xs">x.com/</span>
              </div>
              <input
                id="twitter_username"
                name="twitter_username"
                maxLength={15}
                defaultValue={profile.twitter_username ?? ""}
                placeholder="your_handle"
                className="w-full rounded-lg border border-border bg-background/50 py-2.5 pl-[4.5rem] pr-3 text-sm transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </FieldWrapper>
        </CardContent>
      </Card>

      {/* ── Tech Stack ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="h-4 w-4 text-primary" />
            Tech Stack
          </CardTitle>
          <CardDescription>
            Show the world what you build with. Up to 20 technologies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TechStackField defaultValue={profile.tech_stack ?? []} />
        </CardContent>
      </Card>

      {/* ── Read-only Stats ── */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-muted-foreground">
            Account Stats
          </CardTitle>
          <CardDescription>These values are managed by the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBadge label="Level" value={`Lvl ${profile.level}`} />
            <StatBadge label="XP Points" value={profile.xp_points.toLocaleString()} />
            <StatBadge label="Current Streak" value={`${profile.current_streak}d`} />
            <StatBadge label="Longest Streak" value={`${profile.longest_streak}d`} />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} size="lg" className="min-w-[140px]">
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save Profile"
          )}
        </Button>
      </div>
    </form>
  );
}

function AvatarPreview({
  defaultUrl,
  displayName,
}: {
  urlInput: string;
  defaultUrl: string;
  displayName: string;
}) {
  const [error, setError] = useState(false);
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-border bg-muted">
      {defaultUrl && !error ? (
        <img
          src={defaultUrl}
          alt="Avatar"
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground">
          {initials || <User className="h-6 w-6" />}
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-center">
      <span className="text-base font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
