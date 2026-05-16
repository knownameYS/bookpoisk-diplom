ALTER TABLE "books"
ADD COLUMN "catalog_section" TEXT,
ADD COLUMN "catalog_section_slug" TEXT,
ADD COLUMN "source_site" TEXT,
ADD COLUMN "source_url" TEXT,
ADD COLUMN "series" TEXT,
ADD COLUMN "publisher" TEXT,
ADD COLUMN "editor" TEXT,
ADD COLUMN "age_restriction" TEXT,
ADD COLUMN "binding" TEXT,
ADD COLUMN "page_count" INTEGER,
ADD COLUMN "weight_grams" INTEGER,
ADD COLUMN "thickness_mm" INTEGER,
ADD COLUMN "book_format" TEXT,
ADD COLUMN "paper_material" TEXT,
ADD COLUMN "read_time_hours" DOUBLE PRECISION;

CREATE INDEX "books_catalog_section_slug_status_idx" ON "books"("catalog_section_slug", "status");
CREATE INDEX "books_isbn13_idx" ON "books"("isbn13");
