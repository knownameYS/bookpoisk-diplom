CREATE TYPE "review_reaction_type" AS ENUM ('like', 'dislike');

CREATE TABLE "review_reactions" (
    "review_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "review_reaction_type" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_reactions_pkey" PRIMARY KEY ("review_id","user_id")
);

ALTER TABLE "review_reactions"
ADD CONSTRAINT "review_reactions_review_id_fkey"
FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_reactions"
ADD CONSTRAINT "review_reactions_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "review_reactions_review_id_type_created_at_idx"
ON "review_reactions"("review_id", "type", "created_at");

CREATE INDEX "review_reactions_user_id_created_at_idx"
ON "review_reactions"("user_id", "created_at");
