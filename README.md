# Bookpoisk Diplom

Полноценный сервис для поиска, оценки и обсуждения книг на `React + Express + Prisma + PostgreSQL`.

## Что есть в проекте

- frontend на `Vite + React + TypeScript + Tailwind`
- backend на `Express + Prisma`
- обязательный алгоритм оценки `84`
- каталог книг, отзывы, статьи, профиль читателя
- избранное, полки чтения, пользовательские коллекции
- AI-поиск с локальным fallback-ранжированием
- импорт каталога книг с `eksmo.ru`

## Требования

- `Node.js 20+`
- `npm 10+`
- `PostgreSQL 16+` или `docker compose`

## Быстрый запуск

Из корня проекта:

```powershell
Copy-Item backend\.env.example backend\.env -Force
Copy-Item frontend\.env.example frontend\.env -Force
npm install
docker compose up -d postgres
npm run db:migrate
npm run db:seed
```

Если нужен полный каталог Eksmo:

```powershell
cd backend
npm run catalog:import
cd ..
```

Запуск backend и frontend:

```powershell
npm run dev:backend
npm run dev:frontend
```

Или одной командой:

```powershell
npm run dev
```

## Адреса

- frontend: `http://127.0.0.1:5173`
- backend API: `http://127.0.0.1:4000/api`

## Полезные команды

Проверка backend:

```powershell
cd backend
npm test
```

Сборка frontend:

```powershell
cd frontend
npm run build
```

Генерация Prisma client:

```powershell
cd backend
npm run prisma:generate
```

## Тестовые пользователи после seed

- `admin@bookpoisk.local` / `Admin123!`
- `reader@bookpoisk.local` / `Reader123!`
- `member@bookpoisk.local` / `Member123!`

## Где реализован алгоритм 84

- backend: `backend/src/common/rating84.js`
- frontend: `frontend/src/features/rating/rating84.ts`
