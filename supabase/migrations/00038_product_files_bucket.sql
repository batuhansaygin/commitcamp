insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-files',
  'product-files',
  false,
  52428800,
  array[
    'application/zip',
    'application/x-zip-compressed',
    'application/pdf',
    'application/json',
    'text/plain',
    'text/markdown'
  ]
)
on conflict (id) do nothing;
