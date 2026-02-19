-- ─────────────────────────────────────────────────────────────────────────────
-- 00014_search_indexes.sql
-- Full-text search for CommitCamp: tsvector columns, triggers, GIN indexes,
-- search_all RPC, and get_popular_tags RPC.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Add tsvector columns ───────────────────────────────────────────────────

ALTER TABLE public.posts    ADD COLUMN IF NOT EXISTS fts tsvector;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fts tsvector;

-- ── 2. Populate existing rows ─────────────────────────────────────────────────

UPDATE public.posts
SET fts =
  setweight(to_tsvector('english', coalesce(title,   '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'A');

UPDATE public.profiles
SET fts =
  setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(username,      '')), 'A') ||
  setweight(to_tsvector('english', coalesce(bio,           '')), 'B') ||
  setweight(to_tsvector('english', coalesce(array_to_string(tech_stack, ' '), '')), 'B');

-- ── 3. Trigger functions to keep fts columns in sync ─────────────────────────

CREATE OR REPLACE FUNCTION public.update_posts_fts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.fts :=
    setweight(to_tsvector('english', coalesce(NEW.title,   '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'A');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_profiles_fts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.fts :=
    setweight(to_tsvector('english', coalesce(NEW.display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.username,      '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.bio,           '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tech_stack, ' '), '')), 'B');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_fts    ON public.posts;
CREATE TRIGGER trg_posts_fts
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_posts_fts();

DROP TRIGGER IF EXISTS trg_profiles_fts ON public.profiles;
CREATE TRIGGER trg_profiles_fts
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profiles_fts();

-- ── 4. GIN indexes ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_posts_fts    ON public.posts     USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_profiles_fts ON public.profiles  USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_posts_tags   ON public.posts     USING gin(tags);

-- ── 5. RPC: search_all ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.search_all(
  search_query text,
  result_limit int DEFAULT 5
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  users_result  json;
  posts_result  json;
  tags_result   json;
  tsquery_val   tsquery;
  clean_query   text;
BEGIN
  clean_query := trim(search_query);

  IF clean_query IS NULL OR length(clean_query) < 2 THEN
    RETURN json_build_object(
      'users', '[]'::json,
      'posts', '[]'::json,
      'tags',  '[]'::json
    );
  END IF;

  BEGIN
    tsquery_val := plainto_tsquery('english', clean_query);
  EXCEPTION WHEN OTHERS THEN
    tsquery_val := NULL;
  END;

  -- Users
  SELECT coalesce(json_agg(row_to_json(u)), '[]'::json)
  INTO   users_result
  FROM (
    SELECT
      id,
      username,
      display_name,
      avatar_url,
      bio,
      level,
      tech_stack,
      followers_count
    FROM public.profiles
    WHERE
      (tsquery_val IS NOT NULL AND fts @@ tsquery_val)
      OR username     ILIKE '%' || clean_query || '%'
      OR display_name ILIKE '%' || clean_query || '%'
    ORDER BY
      CASE WHEN username ILIKE clean_query || '%' THEN 0 ELSE 1 END,
      CASE WHEN tsquery_val IS NOT NULL THEN ts_rank(fts, tsquery_val) ELSE 0 END DESC,
      followers_count DESC
    LIMIT result_limit
  ) u;

  -- Posts
  SELECT coalesce(json_agg(row_to_json(p)), '[]'::json)
  INTO   posts_result
  FROM (
    SELECT
      p.id,
      p.title,
      p.type,
      p.tags,
      p.created_at,
      pr.username         AS author_username,
      pr.display_name     AS author_display_name,
      pr.avatar_url       AS author_avatar_url
    FROM public.posts p
    JOIN public.profiles pr ON p.user_id = pr.id
    WHERE
      (tsquery_val IS NOT NULL AND p.fts @@ tsquery_val)
      OR p.title ILIKE '%' || clean_query || '%'
    ORDER BY
      CASE WHEN tsquery_val IS NOT NULL THEN ts_rank(p.fts, tsquery_val) ELSE 0 END DESC,
      p.created_at DESC
    LIMIT result_limit
  ) p;

  -- Tags
  SELECT coalesce(json_agg(row_to_json(t)), '[]'::json)
  INTO   tags_result
  FROM (
    SELECT
      tag,
      count(*) AS post_count
    FROM public.posts, unnest(tags) AS tag
    WHERE tag ILIKE '%' || clean_query || '%'
    GROUP BY tag
    ORDER BY count(*) DESC
    LIMIT result_limit
  ) t;

  RETURN json_build_object(
    'users', users_result,
    'posts', posts_result,
    'tags',  tags_result
  );
END;
$$;

-- ── 6. RPC: get_popular_tags ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_popular_tags(tag_limit int DEFAULT 10)
RETURNS TABLE (tag text, post_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    unnested_tag AS tag,
    count(*)     AS post_count
  FROM public.posts, unnest(tags) AS unnested_tag
  GROUP BY unnested_tag
  ORDER BY count(*) DESC
  LIMIT tag_limit;
$$;
