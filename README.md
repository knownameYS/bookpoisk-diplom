# Bookpoisk Diplom

Full-stack приложение для поиска, оценки и критики книг на React + Express + Prisma + PostgreSQL.

## Что реализовано
- Frontend (Vite/React/TS/Tailwind) с публичными страницами, auth, профилем, базовой админкой.
- Backend (Express/Prisma/PostgreSQL/JWT/refresh token).
- Алгоритм оценки **84** на frontend (live preview) и backend (server-side пересчёт).
- Миграции Prisma с существующей схемой + расширения: `favorite_books`, `collections`, `collection_books`.
- Seed с пользователями:
  - admin: `admin@bookpoisk.local` / `Admin123!`
  - demo: `demo@bookpoisk.local` / `Demo123!`

## Локальный запуск
```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Backend: http://localhost:4000/api  
Frontend: http://localhost:5173

## Где реализован алгоритм 84
- Backend: `backend/src/utils/rating84.js`, используется в `backend/src/controllers/ratings.controller.js`.
- Frontend (live preview): `frontend/src/features/rating/rating84.ts`, UI: `frontend/src/components/RatingDrawer.tsx`.
