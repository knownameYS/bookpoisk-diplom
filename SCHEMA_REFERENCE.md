# SCHEMA_REFERENCE.md

## Existing PostgreSQL schema

### users
- id uuid PK
- username citext
- email citext
- password_hash text
- role user_role
- is_active boolean
- created_at timestamptz
- updated_at timestamptz

### user_refresh_tokens
- id uuid PK
- user_id uuid FK -> users.id
- token_hash text
- created_at timestamptz
- expires_at timestamptz
- revoked_at timestamptz

### authors
- id uuid PK
- full_name text
- birth_date date
- death_date date
- bio text
- created_at timestamptz
- updated_at timestamptz

### genres
- id uuid PK
- name citext
- description text
- created_at timestamptz
- updated_at timestamptz

### tags
- id uuid PK
- name citext
- created_at timestamptz

### books
- id uuid PK
- title text
- original_title text
- description text
- isbn13 text
- publication_year integer
- language text
- cover_url text
- added_by_user_id uuid FK -> users.id
- status content_status
- created_at timestamptz
- updated_at timestamptz

### book_authors
- book_id uuid FK -> books.id
- author_id uuid FK -> authors.id
- author_order integer
- role text

### book_genres
- book_id uuid FK -> books.id
- genre_id uuid FK -> genres.id

### book_tags
- book_id uuid FK -> books.id
- tag_id uuid FK -> tags.id

### ratings
- id uuid PK
- user_id uuid FK -> users.id
- book_id uuid FK -> books.id
- architecture integer
- characters integer
- lang_style integer
- idea integer
- vibe integer
- final_score integer
- created_at timestamptz
- updated_at timestamptz

### reviews
- id uuid PK
- book_id uuid FK -> books.id
- user_id uuid FK -> users.id
- title text
- body text
- status content_status
- is_spoiler boolean
- created_at timestamptz
- updated_at timestamptz

### review_comments
- id uuid PK
- review_id uuid FK -> reviews.id
- user_id uuid FK -> users.id
- body text
- status content_status
- created_at timestamptz
- updated_at timestamptz

### articles
- id uuid PK
- user_id uuid FK -> users.id
- title text
- body text
- status content_status
- book_id uuid FK -> books.id
- created_at timestamptz
- updated_at timestamptz

### article_comments
- id uuid PK
- article_id uuid FK -> articles.id
- user_id uuid FK -> users.id
- body text
- status content_status
- created_at timestamptz
- updated_at timestamptz

## Additional required migrations
- favorite_books
- collections
- collection_books

## Rating algorithm 84
- objectiveScore = (Architecture + Characters + Language + Idea) * 1.4
- Vibe multipliers:
  1 -> 1.0000
  2 -> 1.0556
  3 -> 1.1111
  4 -> 1.1667
  5 -> 1.2222
  6 -> 1.2788
  7 -> 1.3333
  8 -> 1.3889
  9 -> 1.4444
  10 -> 1.5000
- finalScore = min(84, round(objectiveScore * multiplier))