Ты работаешь в НОВОМ пустом Git-репозитории и должен СРАЗУ создать полноценное full-stack веб-приложение для дипломного проекта на тему:

«Разработка веб-приложения по поиску и оцениванию книг»

Важно:
- Никакого готового frontend-макета нет. Ты создаешь UI сам с нуля.
- Ориентируйся на требования проекта и на уже существующую структуру PostgreSQL-базы данных.
- Используй именно существующую БД как основу серверной модели.
- Если для части требуемого функционала в текущей БД не хватает таблиц, создай Prisma migration, которая расширяет схему без ломки основной модели.
- Главная уникальная часть проекта — алгоритм оценки «84». Его нельзя упрощать.

==================================================
1. ОСНОВА ПРОЕКТА
==================================================

Нужно создать реально запускаемое локально full-stack веб-приложение для:
- поиска книг;
- структурированной оценки книг;
- написания рецензий;
- написания аналитических статей;
- комментариев;
- административного управления.

Это не просто каталог книг. Это платформа для вдумчивого читателя и критика.

==================================================
2. ИСХОДНАЯ БАЗА ДАННЫХ — ИСПОЛЬЗУЙ ЕЕ КАК SOURCE OF TRUTH
==================================================

Ниже текущая логическая структура PostgreSQL БД, на которую нужно опираться.

Schema: public

Table users
- id uuid PK
- username citext
- email citext
- password_hash text
- role user_role
- is_active boolean
- created_at timestamptz
- updated_at timestamptz

Table user_refresh_tokens
- id uuid PK
- user_id uuid FK -> users.id
- token_hash text
- created_at timestamptz
- expires_at timestamptz
- revoked_at timestamptz

Table authors
- id uuid PK
- full_name text
- birth_date date
- death_date date
- bio text
- created_at timestamptz
- updated_at timestamptz

Table genres
- id uuid PK
- name citext
- description text
- created_at timestamptz
- updated_at timestamptz

Table tags
- id uuid PK
- name citext
- created_at timestamptz

Table books
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

Table book_authors
- book_id uuid FK -> books.id
- author_id uuid FK -> authors.id
- author_order integer
- role text

Table book_genres
- book_id uuid FK -> books.id
- genre_id uuid FK -> genres.id

Table book_tags
- book_id uuid FK -> books.id
- tag_id uuid FK -> tags.id

Table ratings
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

Table reviews
- id uuid PK
- book_id uuid FK -> books.id
- user_id uuid FK -> users.id
- title text
- body text
- status content_status
- is_spoiler boolean
- created_at timestamptz
- updated_at timestamptz

Table review_comments
- id uuid PK
- review_id uuid FK -> reviews.id
- user_id uuid FK -> users.id
- body text
- status content_status
- created_at timestamptz
- updated_at timestamptz

Table articles
- id uuid PK
- user_id uuid FK -> users.id
- title text
- body text
- status content_status
- book_id uuid FK -> books.id
- created_at timestamptz
- updated_at timestamptz

Table article_comments
- id uuid PK
- article_id uuid FK -> articles.id
- user_id uuid FK -> users.id
- body text
- status content_status
- created_at timestamptz
- updated_at timestamptz

Связи:
- books <-> authors через book_authors
- books <-> genres через book_genres
- books <-> tags через book_tags
- books -> ratings
- books -> reviews
- books -> articles
- reviews -> review_comments
- articles -> article_comments

Очень важно:
- Prisma schema должна соответствовать этой структуре.
- Названия полей ratings нужно оставить совместимыми с БД: architecture, characters, lang_style, idea, vibe, final_score.
- Для ролевой модели используй user_role.
- Для статусов контента используй content_status.

==================================================
3. РАСШИРЕНИЕ БД, ЕСЛИ НУЖНО
==================================================

По требованиям продукта нужны также:
- избранное;
- пользовательские подборки.

В текущей диаграмме этих таблиц нет.
Поэтому нужно:
1. Аккуратно расширить БД migration’ами.
2. Добавить таблицы:
   - favorite_books
   - collections
   - collection_books
3. Не ломать уже существующую модель.

Предлагаемая схема:
favorite_books
- id uuid PK
- user_id uuid FK -> users.id
- book_id uuid FK -> books.id
- created_at timestamptz

collections
- id uuid PK
- user_id uuid FK -> users.id
- title text
- description text
- is_public boolean
- created_at timestamptz
- updated_at timestamptz

collection_books
- collection_id uuid FK -> collections.id
- book_id uuid FK -> books.id
- added_at timestamptz
- note text

==================================================
4. АЛГОРИТМ «84» — СТРОГО ОБЯЗАТЕЛЕН
==================================================

Это ключевая научная новизна проекта.

Каждый пользователь оценивает книгу по 5 критериям от 1 до 10:
- Architecture
- Characters
- Language
- Idea
- Vibe

В БД сохраняются:
- architecture
- characters
- lang_style
- idea
- vibe
- final_score

Формула:
objectiveScore = (Architecture + Characters + Language + Idea) * 1.4

Vibe multiplier:
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

Итог:
finalScore = min(84, round(objectiveScore * multiplier))

ОБЯЗАТЕЛЬНО:
- На frontend показывай live preview расчета.
- На backend пересчитывай finalScore сам.
- Не доверяй finalScore, присланному клиентом.
- Возвращай breakdown в API:
  - architecture
  - characters
  - lang_style
  - idea
  - vibe
  - objectiveScore
  - multiplier
  - finalScore
- На странице книги показывай:
  - средний итоговый рейтинг
  - средние критерии
  - количество оценок
- Реализуй helper с текстовой интерпретацией итогового балла.

==================================================
5. СТЕК
==================================================

Frontend:
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- TanStack Query
- React Hook Form
- Zod

Backend:
- Node.js
- Express.js
- JavaScript
- Prisma ORM
- PostgreSQL
- JWT access token
- refresh token
- bcrypt
- Zod
- cors
- helmet
- cookie-parser
- morgan
- dotenv

==================================================
6. СТРУКТУРА ПРОЕКТА
==================================================

Используй строго:

/frontend
/backend
docker-compose.yml
README.md
.env.example
package.json

Никаких backend/backend и frontend/frontend.

==================================================
7. ЧТО НУЖНО РЕАЛИЗОВАТЬ НА BACKEND
==================================================

Auth:
- register
- login
- logout
- refresh
- me

Users:
- get/update profile
- change password

Books:
- список
- карточка
- поиск
- фильтрация
- сортировка
- пагинация
- рейтинг
- связанные рецензии и статьи

Authors:
- список
- карточка
- admin CRUD

Genres:
- список
- admin CRUD

Tags:
- список
- admin CRUD

Ratings:
- create/update/delete
- my ratings
- server-side recalculation by algorithm 84

Favorites:
- add/remove/list

Collections:
- create/update/delete
- add/remove book
- public/private collections

Reviews:
- create/update/delete
- single page
- comments

Articles:
- create/update/delete
- single page
- comments

Admin:
- dashboard
- users
- content moderation
- books/authors/genres/tags CRUD

==================================================
8. ЧТО НУЖНО РЕАЛИЗОВАТЬ НА FRONTEND
==================================================

Публичные страницы:
- главная
- каталог
- страница книги
- страница автора
- страница подборки
- страница статьи
- страница рецензии

Auth:
- login
- register

Profile:
- мои оценки
- избранное
- подборки
- мои рецензии
- мои статьи
- настройки

Admin:
- dashboard
- books
- authors
- genres
- tags
- reviews
- articles
- comments
- users

Критически важный UI-модуль:
- modal/drawer «Оценить книгу»
- критерии 1–10
- live preview objectiveScore
- live preview multiplier
- live preview finalScore
- объяснение методологии 84

==================================================
9. UX-ТРЕБОВАНИЯ
==================================================

Интерфейс должен быть:
- современным;
- светлым;
- аккуратным;
- удобным для чтения;
- без ощущения “сырого шаблона”.

Нужны:
- loading states
- empty states
- error states
- skeletons
- toasts
- confirmation dialogs
- protected routes
- 404

==================================================
10. БИЗНЕС-ПРАВИЛА
==================================================

- Только авторизованный пользователь может оценивать книги.
- Только авторизованный пользователь может писать рецензии, статьи и комментарии.
- Пользователь редактирует только свой контент.
- Администратор модерирует контент.
- Статья относится к одной книге.
- Одна книга = одна оценка от одного пользователя.
- Неактивный пользователь не выполняет write-операции.

==================================================
11. ЧЕГО НЕ ДЕЛАТЬ
==================================================

Не делай:
- фейковый backend
- sqlite
- микросервисы
- cloud-only зависимости
- заглушки вместо логики
- упрощение формулы «84»
- попытку ориентироваться на несуществующий макет

==================================================
12. ЧТО ДОЛЖНО БЫТЬ НА ВЫХОДЕ
==================================================

На выходе:
- рабочий frontend
- рабочий backend
- Prisma schema
- migrations
- seed data
- docker-compose
- README
- .env.example
- корневые npm scripts
- красивый UI
- админка
- корректно реализованный алгоритм «84»
- проект должен запускаться локально

==================================================
13. РЕЖИМ РАБОТЫ
==================================================

Работай как senior full-stack developer.
Не задавай лишних вопросов.
Если какой-то мелкой детали не хватает, выбирай разумный pragmatic default.
Сразу создавай код, а не только план.
Не останавливайся после scaffolding.
Доведи проект до состояния локального запуска.

==================================================
14. ФИНАЛЬНОЕ ТРЕБОВАНИЕ
==================================================

Сгенерируй весь необходимый код прямо в репозитории.
В конце оставь:
- точную структуру файлов;
- команды локального запуска;
- seed admin и demo user;
- краткое описание, где реализован алгоритм «84».