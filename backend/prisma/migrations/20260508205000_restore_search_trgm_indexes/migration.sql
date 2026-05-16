CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS books_title_trgm_idx
ON books
USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS books_original_title_trgm_idx
ON books
USING gin (coalesce(original_title, '') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS authors_full_name_trgm_idx
ON authors
USING gin (full_name gin_trgm_ops);
