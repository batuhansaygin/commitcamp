"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Paperclip,
  X,
  Upload,
  FileText,
  FileVideo,
  File,
  ZoomIn,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TaskAttachment {
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

/** Files selected locally but not yet uploaded (pending state in create modal) */
export interface PendingFile {
  file: File;
  preview?: string; // object URL for images
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentIcon({ type }: { type: string }) {
  if (type.startsWith("video/")) return <FileVideo className="h-8 w-8 text-purple-400" />;
  if (type === "application/pdf") return <FileText className="h-8 w-8 text-red-400" />;
  if (type.includes("word") || type.includes("document"))
    return <FileText className="h-8 w-8 text-blue-400" />;
  if (type.includes("sheet") || type.includes("excel"))
    return <FileText className="h-8 w-8 text-emerald-400" />;
  return <File className="h-8 w-8 text-muted-foreground" />;
}

// ── Existing attachment card ──────────────────────────────────────────────────

interface ExistingCardProps {
  attachment: TaskAttachment;
  onRemove: () => void;
}

function ExistingCard({ attachment, onRemove }: ExistingCardProps) {
  const isImage = attachment.type.startsWith("image/");
  const [lightbox, setLightbox] = useState(false);

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-muted/30">
        {/* Preview */}
        <div className="relative flex h-24 items-center justify-center bg-muted/20">
          {isImage ? (
            <>
              <img
                src={attachment.url}
                alt={attachment.name}
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => setLightbox(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100"
              >
                <ZoomIn className="h-5 w-5 text-white" />
              </button>
            </>
          ) : (
            <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 hover:opacity-80">
              <AttachmentIcon type={attachment.type} />
            </a>
          )}
        </div>

        {/* Info */}
        <div className="px-2 py-1.5">
          <p className="truncate text-[11px] font-medium text-foreground" title={attachment.name}>
            {attachment.name}
          </p>
          <p className="text-[10px] text-muted-foreground">{formatBytes(attachment.size)}</p>
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive/90 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
          title="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <img
            src={attachment.url}
            alt={attachment.name}
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightbox(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  );
}

// ── Pending (not-yet-uploaded) file card ─────────────────────────────────────

interface PendingCardProps {
  pending: PendingFile;
  uploading?: boolean;
  onRemove: () => void;
}

function PendingCard({ pending, uploading, onRemove }: PendingCardProps) {
  const isImage = pending.file.type.startsWith("image/");

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-dashed border-border bg-muted/20">
      <div className="relative flex h-24 items-center justify-center">
        {isImage && pending.preview ? (
          <img src={pending.preview} alt={pending.file.name} className="h-full w-full object-cover opacity-70" />
        ) : (
          <AttachmentIcon type={pending.file.type} />
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}
      </div>
      <div className="px-2 py-1.5">
        <p className="truncate text-[11px] font-medium text-foreground" title={pending.file.name}>
          {pending.file.name}
        </p>
        <p className="text-[10px] text-muted-foreground">{formatBytes(pending.file.size)}</p>
      </div>
      {!uploading && (
        <button
          onClick={onRemove}
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive/90 text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ── Main uploader ─────────────────────────────────────────────────────────────

const ACCEPT = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "video/mp4", "video/webm", "video/quicktime",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
].join(",");

interface UploaderProps {
  /** Already-saved attachments (from DB) */
  attachments: TaskAttachment[];
  /** Called when a saved attachment is marked for removal */
  onRemoveAttachment: (url: string) => void;
  /** Pending local files (not yet uploaded) */
  pendingFiles: PendingFile[];
  onAddPending: (files: PendingFile[]) => void;
  onRemovePending: (index: number) => void;
  /** When true, shows spinners on pending files */
  uploading?: boolean;
}

export function TaskAttachmentUploader({
  attachments,
  onRemoveAttachment,
  pendingFiles,
  onAddPending,
  onRemovePending,
  uploading,
}: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const pending: PendingFile[] = Array.from(files).map((file) => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    }));
    onAddPending(pending);
  }, [onAddPending]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const hasItems = attachments.length > 0 || pendingFiles.length > 0;

  return (
    <div className="space-y-3">
      {/* Attachment grid */}
      {hasItems && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {attachments.map((att) => (
            <ExistingCard
              key={att.url}
              attachment={att}
              onRemove={() => onRemoveAttachment(att.url)}
            />
          ))}
          {pendingFiles.map((pf, idx) => (
            <PendingCard
              key={`${pf.file.name}-${idx}`}
              pending={pf}
              uploading={uploading}
              onRemove={() => onRemovePending(idx)}
            />
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
          dragging
            ? "border-primary bg-primary/5 text-primary"
            : "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/30"
        )}
      >
        <Upload className="h-5 w-5" />
        <div>
          <p className="text-xs font-medium">
            {dragging ? "Drop files here" : "Click or drag files here"}
          </p>
          <p className="mt-0.5 text-[10px]">
            Images, videos, PDFs, documents — up to 50 MB each
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Paperclip className="h-3 w-3" />
          <span className="text-[10px]">
            {attachments.length + pendingFiles.length} file{(attachments.length + pendingFiles.length) !== 1 ? "s" : ""} attached
          </span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => processFiles(e.target.files)}
      />
    </div>
  );
}

// ── Upload helper (called from modal on save) ─────────────────────────────────

export async function uploadPendingFiles(
  taskId: string,
  pendingFiles: PendingFile[]
): Promise<TaskAttachment[]> {
  if (pendingFiles.length === 0) return [];

  const supabase = createClient();
  const uploaded: TaskAttachment[] = [];

  for (const { file } of pendingFiles) {
    const ext = file.name.split(".").pop();
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${taskId}/${safeName}`;

    const { error } = await supabase.storage
      .from("task-attachments")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) {
      console.error("Upload failed for", file.name, error);
      continue;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("task-attachments")
      .getPublicUrl(path);

    uploaded.push({
      name: file.name,
      url: publicUrl,
      type: file.type,
      size: file.size,
      uploaded_at: new Date().toISOString(),
    });
  }

  return uploaded;
}

export async function deleteStorageFile(url: string): Promise<void> {
  const supabase = createClient();
  // Extract path from public URL: .../task-attachments/taskId/filename
  const match = url.match(/task-attachments\/(.+)$/);
  if (!match) return;
  await supabase.storage.from("task-attachments").remove([match[1]]);
}
