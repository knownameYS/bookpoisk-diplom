-- DropIndex
DROP INDEX "authors_full_name_trgm_idx";

-- DropIndex
DROP INDEX "books_title_trgm_idx";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT,
ADD COLUMN     "bio" VARCHAR(150),
ADD COLUMN     "show_favorites" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_library" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_ratings" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_reviews" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "user_follows" (
    "follower_id" UUID NOT NULL,
    "following_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("follower_id","following_id")
);

-- CreateTable
CREATE TABLE "profile_featured_books" (
    "user_id" UUID NOT NULL,
    "book_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_featured_books_pkey" PRIMARY KEY ("user_id","book_id")
);

-- CreateIndex
CREATE INDEX "user_follows_following_id_created_at_idx" ON "user_follows"("following_id", "created_at");

-- CreateIndex
CREATE INDEX "profile_featured_books_user_id_sort_order_idx" ON "profile_featured_books"("user_id", "sort_order");

-- CreateIndex
CREATE INDEX "article_comments_user_id_status_idx" ON "article_comments"("user_id", "status");

-- CreateIndex
CREATE INDEX "articles_user_id_status_idx" ON "articles"("user_id", "status");

-- CreateIndex
CREATE INDEX "book_authors_author_id_idx" ON "book_authors"("author_id");

-- CreateIndex
CREATE INDEX "book_genres_genre_id_idx" ON "book_genres"("genre_id");

-- CreateIndex
CREATE INDEX "book_tags_tag_id_idx" ON "book_tags"("tag_id");

-- CreateIndex
CREATE INDEX "books_created_at_idx" ON "books"("created_at");

-- CreateIndex
CREATE INDEX "collection_books_book_id_idx" ON "collection_books"("book_id");

-- CreateIndex
CREATE INDEX "collections_user_id_created_at_idx" ON "collections"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "collections_is_public_created_at_idx" ON "collections"("is_public", "created_at");

-- CreateIndex
CREATE INDEX "favorite_books_user_id_created_at_idx" ON "favorite_books"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "review_comments_user_id_status_idx" ON "review_comments"("user_id", "status");

-- CreateIndex
CREATE INDEX "reviews_user_id_status_idx" ON "reviews"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_refresh_tokens_user_id_revoked_at_idx" ON "user_refresh_tokens"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "user_refresh_tokens_token_hash_idx" ON "user_refresh_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_featured_books" ADD CONSTRAINT "profile_featured_books_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_featured_books" ADD CONSTRAINT "profile_featured_books_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "books_status_year_language_idx" RENAME TO "books_status_publication_year_language_idx";
