# Backend setup (exact commands)

## 1) Install dependencies from repository root

```bash
npm install
```

## 2) Configure environment

Create `backend/.env` with a valid PostgreSQL connection:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
JWT_ACCESS_SECRET="change_me_access"
JWT_REFRESH_SECRET="change_me_refresh"
PORT=4000
FRONTEND_ORIGIN="http://127.0.0.1:5173"
```

## 3) Generate Prisma client

```bash
npm run prisma:generate -w backend
```

## 4) Apply migrations

```bash
npm run prisma:migrate -w backend
```

## 5) (Optional) Seed DB

```bash
npm run prisma:seed -w backend
```

## 6) Run backend in development

```bash
npm run dev -w backend
```

> `predev` now runs `prisma generate` automatically, so `npm run dev -w backend` no longer crashes with `@prisma/client did not initialize yet` when client artifacts are missing.
