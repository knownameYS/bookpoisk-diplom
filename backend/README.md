# Bookpoisk Backend

Node.js + Express + PostgreSQL + Prisma backend for the diploma project about book search, reviews and the custom `84` rating system.

## What Is Included

- JWT access token + refresh token with refresh token hashes stored in DB
- REST API with roles `USER` and `ADMIN`
- CRUD for books, authors, genres, tags
- Reviews, articles, comments, moderation routes
- Favorites and collections
- Search with PostgreSQL filters and an AI-style book selection assistant
- OpenAPI docs at `http://localhost:4000/api/docs`
- Seed data for live testing
- Minimal local tests for auth, ratings, search and AI-search fallback logic

## Setup Without Docker

1. Copy the backend env file:

```powershell
Copy-Item .env.example .env
```

2. Install dependencies:

```powershell
npm.cmd install
```

3. Run PostgreSQL:

```powershell
docker compose -f ..\docker-compose.yml up -d postgres
```

4. Generate Prisma client:

```powershell
npm.cmd run prisma:generate
```

5. Apply migrations:

```powershell
npm.cmd run prisma:migrate
```

6. Seed the database:

```powershell
npm.cmd run prisma:seed
```

7. Start backend:

```powershell
npm.cmd run dev
```

## Full Docker Compose

```powershell
Copy-Item .env.example .env
docker compose -f docker-compose.yml up --build
```

## Local Tests

```powershell
npm.cmd test
```

## Swagger Manual Testing

Open the interactive API docs:

```text
http://127.0.0.1:4000/api/docs
```

Recommended testing flow:

1. Call `POST /auth/login` with one of the demo users below.
2. Copy `accessToken` from the response body.
3. Click `Authorize` in Swagger UI and paste `Bearer <token>`.
4. Test protected routes such as `GET /auth/me`, `PUT /ratings/books/{bookId}/rating`, `POST /search/ai`, `GET /favorites` and `GET /collections/mine`.
5. Run `POST /auth/refresh` and `POST /auth/logout` to verify the refresh-cookie flow.

## Demo Users

- `admin@bookpoisk.local` / `Admin123!`
- `reader@bookpoisk.local` / `Reader123!`
- `member@bookpoisk.local` / `Member123!`

## Important Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/books`
- `GET /api/books/:id`
- `PUT /api/ratings/books/:bookId/rating`
- `GET /api/ratings/me`
- `GET /api/search`
- `POST /api/search/ai`
- `GET /api/favorites`
- `GET /api/collections/public`
- `GET /api/collections/mine`
- `GET /api/admin/dashboard`

## Request Examples

Create or update a rating:

```json
PUT /api/ratings/books/<bookId>/rating
{
  "architecture": 8,
  "characters": 9,
  "language": 8,
  "idea": 10,
  "vibe": 9
}
```

Regular search:

```text
GET /api/search?query=earthsea&genres=Fantasy&language=en&minRating=60&sort=rating
```

AI assistant search:

```json
POST /api/search/ai
{
  "prompt": "Найди мрачные философские книги с сильной идеей и рейтингом выше 70"
}
```

GenAPI configuration:

```powershell
AI_PROVIDER=genapi
GEN_API_KEY=<your GenAPI key>
GEN_API_MODEL=grok-4.1-fast-non-reasoning
```
