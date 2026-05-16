CREATE EXTENSION IF NOT EXISTS pgcrypto;
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

CREATE INDEX IF NOT EXISTS books_status_year_language_idx
ON books (status, publication_year, language);

CREATE INDEX IF NOT EXISTS ratings_book_id_final_score_idx
ON ratings (book_id, final_score);

CREATE INDEX IF NOT EXISTS reviews_book_id_status_idx
ON reviews (book_id, status);

CREATE INDEX IF NOT EXISTS articles_book_id_status_idx
ON articles (book_id, status);

CREATE INDEX IF NOT EXISTS review_comments_review_id_status_idx
ON review_comments (review_id, status);

CREATE INDEX IF NOT EXISTS article_comments_article_id_status_idx
ON article_comments (article_id, status);
