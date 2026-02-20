-- ─────────────────────────────────────────────────────────────────────────────
-- 00022_task_attachments.sql
-- Add attachments (files/images/videos) support to admin tasks
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add attachments column to admin_tasks ──────────────────────────────────
-- Each attachment is stored as:
-- { name: string, url: string, type: string, size: number, uploaded_at: string }

ALTER TABLE public.admin_tasks
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- ── 2. Create Supabase Storage bucket ─────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-attachments',
  'task-attachments',
  true,        -- public URLs (protected by RLS on upload/delete)
  52428800,    -- 50 MB per file
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/markdown'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ── 3. Storage RLS policies ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "task_attachments_insert" ON storage.objects;
CREATE POLICY "task_attachments_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'task-attachments' AND public.is_admin_user());

DROP POLICY IF EXISTS "task_attachments_select" ON storage.objects;
CREATE POLICY "task_attachments_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'task-attachments' AND public.is_admin_user());

DROP POLICY IF EXISTS "task_attachments_delete" ON storage.objects;
CREATE POLICY "task_attachments_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'task-attachments' AND public.is_admin_user());
