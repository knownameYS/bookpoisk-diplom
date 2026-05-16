import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getAccessToken, getApiErrorMessage } from '../api/client';
import { BookCard } from '../components/ContentCards';
import {
  clearReadingShelf,
  getFavorites,
  getReadingShelves,
  readingShelves,
  removeFavorite
} from '../features/library';

function ListShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <section className="surface-panel p-6">
        <span className="section-kicker">Библиотека</span>
        <h1 className="section-title">{title}</h1>
        <p className="section-subtitle">{subtitle}</p>
      </section>
      {children}
    </div>
  );
}

function LoginRequiredCard() {
  return (
    <section className="surface-card p-6">
      <p className="text-lg font-semibold text-[color:var(--text)]">Войдите в профиль, чтобы открыть личную библиотеку</p>
      <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
        После входа можно добавлять книги в избранное и распределять их по полкам чтения
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/login" className="btn-primary">Войти</Link>
        <Link to="/register" className="btn-soft">Создать аккаунт</Link>
      </div>
    </section>
  );
}

export function MyRatingsPage() {
  const isAuthenticated = Boolean(getAccessToken());
  const { data, isLoading } = useQuery({
    queryKey: ['myRatings'],
    queryFn: async () => (await api.get('/ratings/me')).data.items,
    enabled: isAuthenticated
  });

  return (
    <ListShell title="Мои оценки" subtitle="Все книги, которые вы уже оценили по системе «84».">
      {!isAuthenticated ? (
        <LoginRequiredCard />
      ) : isLoading ? (
        <div className="surface-card p-6 text-sm text-[color:var(--muted)]">Загружаем оценки...</div>
      ) : !(data?.length) ? (
        <div className="surface-card p-6 text-sm text-[color:var(--muted)]">Пока нет сохранённых оценок</div>
      ) : (
        <div className="grid gap-4">
          {data.map((item: any) => (
            <BookCard
              key={item.book.id}
              book={{
                ...item.book,
                avgFinalScore: item.finalScore,
                ratingCount: 1
              }}
            />
          ))}
        </div>
      )}
    </ListShell>
  );
}

export function LibraryPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = Boolean(getAccessToken());
  const activeTab = searchParams.get('tab') ?? 'favorites';

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: isAuthenticated
  });

  const shelvesQuery = useQuery({
    queryKey: ['libraryShelves'],
    queryFn: getReadingShelves,
    enabled: isAuthenticated
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (bookId: string) => {
      await removeFavorite(bookId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['favorites'] }),
        queryClient.invalidateQueries({ queryKey: ['favoriteStatus'] }),
        queryClient.invalidateQueries({ queryKey: ['libraryShelves'] })
      ]);
    }
  });

  const clearShelfMutation = useMutation({
    mutationFn: async (bookId: string) => {
      await clearReadingShelf(bookId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['libraryShelves'] }),
        queryClient.invalidateQueries({ queryKey: ['readingShelfStatus'] })
      ]);
    }
  });

  if (!isAuthenticated) {
    return (
      <ListShell title="Моя библиотека" subtitle="Избранное и полки чтения живут в одном месте и помогают не терять книги по дороге.">
        <LoginRequiredCard />
      </ListShell>
    );
  }

  const favorites = favoritesQuery.data ?? [];
  const shelves = shelvesQuery.data ?? [];
  const currentShelf = shelves.find((item) => item.key === activeTab);
  const tabItems = [
    { key: 'favorites', title: 'Избранное', count: favorites.length },
    ...readingShelves.map((shelf) => ({
      key: shelf.key,
      title: shelf.title,
      count: shelves.find((item) => item.key === shelf.key)?.bookCount ?? 0
    }))
  ];
  const books = activeTab === 'favorites' ? favorites.map((item: any) => item.book) : currentShelf?.books ?? [];
  const errorMessage = getApiErrorMessage(
    favoritesQuery.error ?? shelvesQuery.error,
    'Не удалось загрузить библиотеку'
  );

  return (
    <ListShell title="Моя библиотека" subtitle="Избранное и три полки чтения помогают не терять книги и фиксировать, где вы остановились.">
      <section className="surface-card space-y-5 p-6">
        <div className="flex flex-wrap gap-3">
          {tabItems.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSearchParams({ tab: tab.key })}
                className={`tab-pill ${isActive ? 'tab-pill-active' : ''}`}
              >
                {tab.title} · {tab.count}
              </button>
            );
          })}
        </div>

        {favoritesQuery.isLoading || shelvesQuery.isLoading ? (
          <div className="text-sm text-[color:var(--muted)]">Загружаем библиотеку...</div>
        ) : null}

        {favoritesQuery.isError || shelvesQuery.isError ? (
          <div
            role="alert"
            className="rounded-2xl border border-[color:rgba(255,107,107,0.35)] bg-[color:rgba(255,107,107,0.08)] px-4 py-3 text-sm text-[color:#ffb3b3]"
          >
            {errorMessage}
          </div>
        ) : null}

        {!favoritesQuery.isLoading && !shelvesQuery.isLoading && !books.length ? (
          <div className="rounded-[24px] border border-dashed border-[color:rgba(255,209,102,0.18)] p-6 text-sm leading-7 text-[color:var(--muted)]">
            {activeTab === 'favorites'
              ? 'Пока пусто. Добавьте книгу в избранное на странице книги.'
              : `Полка «${currentShelf?.title ?? 'Выбранная полка'}» пока пустая.`}
          </div>
        ) : null}
      </section>

      <div className="grid gap-4">
        {books.map((book: any) => (
          <div key={book.id} className="space-y-3">
            <BookCard book={book} />
            <div className="flex flex-wrap gap-3 px-1">
              {activeTab === 'favorites' ? (
                <button
                  type="button"
                  disabled={removeFavoriteMutation.isPending}
                  onClick={() => removeFavoriteMutation.mutate(book.id)}
                  className="btn-soft disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Убрать из избранного
                </button>
              ) : (
                <button
                  type="button"
                  disabled={clearShelfMutation.isPending}
                  onClick={() => clearShelfMutation.mutate(book.id)}
                  className="btn-soft disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Убрать с полки
                </button>
              )}

              <Link to={`/books/${book.id}`} className="btn-primary">
                Открыть книгу
              </Link>
            </div>
          </div>
        ))}
      </div>
    </ListShell>
  );
}

export const FavoritesPage = LibraryPage;

function EditorForm({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="surface-panel p-6">
        <span className="section-kicker">Редактор</span>
        <h1 className="section-title">{title}</h1>
        <p className="section-subtitle">Форма пока оставлена как базовая рабочая заготовка для пользовательского текста.</p>
      </section>
      <form className="surface-card space-y-4 p-6">
        <input className="input-modern" placeholder="Заголовок" />
        <input className="input-modern" placeholder="Краткий подзаголовок" />
        <textarea className="textarea-modern min-h-44" placeholder="Основной текст" />
        <div className="flex gap-3">
          <button type="button" className="btn-primary">Сохранить</button>
          <button type="button" className="btn-soft">Черновик</button>
        </div>
      </form>
    </div>
  );
}

export const CreateReviewPage = () => <EditorForm title="Новая рецензия" />;
export const EditReviewPage = () => <EditorForm title="Редактирование рецензии" />;
export const CreateArticlePage = () => <EditorForm title="Новая статья" />;
export const EditArticlePage = () => <EditorForm title="Редактирование статьи" />;
