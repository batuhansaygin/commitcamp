-- ─────────────────────────────────────────────────────────────────────────────
-- 00026_task_comment_attachments.sql
-- Adds attachments (JSONB) to admin_task_comments and a storage bucket.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.admin_task_comments
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Storage bucket for task comment files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'task-comment-attachments',
  'task-comment-attachments',
  false,
  20971520, -- 20 MB
  ARRAY[
    'image/jpeg','image/png','image/gif','image/webp','image/svg+xml',
    'video/mp4','video/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated admins can upload/download/delete
DROP POLICY IF EXISTS "task_comment_attachments_select" ON storage.objects;
CREATE POLICY "task_comment_attachments_select"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'task-comment-attachments');

DROP POLICY IF EXISTS "task_comment_attachments_insert" ON storage.objects;
CREATE POLICY "task_comment_attachments_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task-comment-attachments');

DROP POLICY IF EXISTS "task_comment_attachments_delete" ON storage.objects;
CREATE POLICY "task_comment_attachments_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'task-comment-attachments');
