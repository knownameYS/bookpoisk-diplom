import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api, getAccessToken, getApiErrorMessage } from '../api/client';
import { RadarChart } from '../components/RadarChart';
import { RatingDrawer } from '../components/RatingDrawer';
import { useToast } from '../components/ToastProvider';
import { resolveMediaUrl } from '../utils/media';
import {
  addFavorite,
  clearReadingShelf,
  getFavoriteStatus,
  getReadingShelfState,
  readingShelves,
  removeFavorite,
  setReadingShelf
} from '../features/library';

const scoreLabels = [
  { key: 'avgArchitecture', title: 'Композиция' },
  { key: 'avgCharacters', title: 'Персонажи' },
  { key: 'avgLanguage', title: 'Язык' },
  { key: 'avgIdea', title: 'Идея' },
  { key: 'avgVibe', title: 'Атмосфера' }
] as const;
const reviewSortOptions = [
  { value: 'newest', title: 'Новые сначала', description: 'Сначала самые свежие впечатления' },
  { value: 'oldest', title: 'Старые сначала', description: 'Хронологически от первых рецензий' },
  { value: 'likes_desc', title: 'Больше лайков', description: 'Сначала самые поддержанные отзывы' },
  { value: 'likes_asc', title: 'Меньше лайков', description: 'Сначала рецензии с минимальным откликом' }
] as const;

type ReviewSort = (typeof reviewSortOptions)[number]['value'];

const collapsedDescriptionHeight = 248;

export default function BookPage() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isAuthenticated = Boolean(getAccessToken());
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [coverFailed, setCoverFailed] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [descriptionFullHeight, setDescriptionFullHeight] = useState(collapsedDescriptionHeight);
  const [reviewSort, setReviewSort] = useState<ReviewSort>('newest');
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['book', id],
    queryFn: async () => (await api.get(`/books/${id}`)).data.item
  });

  const fragmentQuery = useQuery({
    queryKey: ['bookFragment', id],
    queryFn: async () => (await api.get(`/books/${id}/fragment`)).data.item,
    enabled: Boolean(id) && data?.sourceSite === 'eksmo' && Boolean(data?.sourceUrl),
    staleTime: 1000 * 60 * 60
  });

  const favoriteStatusQuery = useQuery({
    queryKey: ['favoriteStatus', id],
    queryFn: async () => getFavoriteStatus(id),
    enabled: isAuthenticated && Boolean(id)
  });

  const shelfStatusQuery = useQuery({
    queryKey: ['readingShelfStatus', id],
    queryFn: async () => getReadingShelfState(id),
    enabled: isAuthenticated && Boolean(id)
  });

  const reviewsQuery = useQuery({
    queryKey: ['bookReviews', id, reviewSort],
    enabled: Boolean(id),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('bookId', id);
      params.set('sort', reviewSort);
      params.set('limit', '50');

      return (await api.get(`/reviews?${params.toString()}`)).data as {
        items: Array<{
          id: string;
          title: string;
          body: string;
          createdAt: string;
          user?: {
            id: string;
            username?: string;
            avatarUrl?: string | null;
          };
          reactionSummary: {
            likesCount: number;
            dislikesCount: number;
            userReaction: 'LIKE' | 'DISLIKE' | null;
          };
        }>;
        meta: {
          total: number;
        };
      };
    }
  });

  async function refreshLibraryState() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['favoriteStatus', id] }),
      queryClient.invalidateQueries({ queryKey: ['readingShelfStatus', id] }),
      queryClient.invalidateQueries({ queryKey: ['favorites'] }),
      queryClient.invalidateQueries({ queryKey: ['libraryShelves'] })
    ]);
  }

  const favoriteMutation = useMutation({
    mutationFn: async (nextIsFavorite: boolean) => {
      setLibraryError(null);

      if (nextIsFavorite) {
        await addFavorite(id);
        return;
      }

      await removeFavorite(id);
    },
    onSuccess: refreshLibraryState,
    onError: (mutationError) => {
      setLibraryError(getApiErrorMessage(mutationError, 'Не удалось обновить избранное'));
    }
  });

  const shelfMutation = useMutation({
    mutationFn: async (shelfKey: (typeof readingShelves)[number]['key']) => {
      setLibraryError(null);
      return setReadingShelf(id, shelfKey);
    },
    onSuccess: refreshLibraryState,
    onError: (mutationError) => {
      setLibraryError(getApiErrorMessage(mutationError, 'Не удалось обновить статус чтения'));
    }
  });

  const clearShelfMutation = useMutation({
    mutationFn: async () => {
      setLibraryError(null);
      return clearReadingShelf(id);
    },
    onSuccess: refreshLibraryState,
    onError: (mutationError) => {
      setLibraryError(getApiErrorMessage(mutationError, 'Не удалось убрать книгу из полки чтения'));
    }
  });

  const reviewReactionMutation = useMutation({
    mutationFn: async ({ reviewId, type }: { reviewId: string; type: 'LIKE' | 'DISLIKE' }) =>
      (await api.put(`/reviews/${reviewId}/reaction`, { type })).data.item,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookReviews', id] });
    },
    onError: (mutationError) => {
      showToast({
        title: 'Не удалось обновить реакцию',
        message: getApiErrorMessage(mutationError, 'Попробуйте ещё раз чуть позже.'),
        variant: 'error'
      });
    }
  });

  const stats = data?.ratingStats ?? {
    avgFinalScore: 0,
    ratingCount: 0,
    avgArchitecture: 0,
    avgCharacters: 0,
    avgLanguage: 0,
    avgIdea: 0,
    avgVibe: 0
  };

  const radarAxes = useMemo(
    () => [
      { label: 'Композиция', value: stats.avgArchitecture ?? 0 },
      { label: 'Персонажи', value: stats.avgCharacters ?? 0 },
      { label: 'Язык', value: stats.avgLanguage ?? 0 },
      { label: 'Идея', value: stats.avgIdea ?? 0 },
      { label: 'Атмосфера', value: stats.avgVibe ?? 0 }
    ],
    [stats.avgArchitecture, stats.avgCharacters, stats.avgIdea, stats.avgLanguage, stats.avgVibe]
  );

  const coverUrl = resolveMediaUrl(data?.coverUrl);
  const hasBookRatings = (stats.ratingCount ?? 0) > 0;

  useEffect(() => {
    setCoverFailed(false);
  }, [coverUrl]);

  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [id, data?.description]);

  useEffect(() => {
    const node = descriptionRef.current;

    if (!node) {
      return undefined;
    }

    const measure = () => {
      setDescriptionFullHeight(Math.max(node.scrollHeight, collapsedDescriptionHeight));
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(() => measure());
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [data?.description, id]);

  if (isLoading) {
    return <div className="surface-card p-6 text-sm text-[color:var(--muted)]">Загружаем карточку книги...</div>;
  }

  if (error || !data) {
    return <div className="surface-card p-6 text-sm text-[color:var(--muted)]">Не удалось открыть карточку книги</div>;
  }

  const isFavorite = favoriteStatusQuery.data?.isFavorite ?? false;
  const currentShelf = shelfStatusQuery.data?.shelfKey ?? null;
  const isLibraryBusy = favoriteMutation.isPending || shelfMutation.isPending || clearShelfMutation.isPending;
  const hasCover = Boolean(coverUrl && !coverFailed);
  const reviews = reviewsQuery.data?.items ?? [];
  const reviewsTotal = reviewsQuery.data?.meta?.total ?? reviews.length;
  const activeReviewSort = reviewSortOptions.find((item) => item.value === reviewSort) ?? reviewSortOptions[0];
  const descriptionText =
    data.description || 'Аннотация пока не добавлена, но книга уже доступна в каталоге и системе оценивания';
  const shouldCollapseDescription = descriptionText.length > 520;
  const descriptionMaxHeight = shouldCollapseDescription
    ? `${isDescriptionExpanded ? descriptionFullHeight : collapsedDescriptionHeight}px`
    : undefined;
  const hasFragment = fragmentQuery.data?.available ?? false;
  const canCheckFragment = data.sourceSite === 'eksmo' && Boolean(data.sourceUrl);
  const bookFacts = [
    { label: 'Раздел', value: data.catalogSection },
    { label: 'Серия', value: data.series },
    { label: 'ISBN', value: data.isbn13 },
    { label: 'Возрастное ограничение', value: data.ageRestriction },
    { label: 'Издательство', value: data.publisher },
    { label: 'Редактор', value: data.editor },
    { label: 'Страниц', value: data.pageCount ? String(data.pageCount) : null },
    { label: 'Время чтения', value: data.readTimeHours ? `${data.readTimeHours} ч` : null }
  ].filter((item) => item.value);

  function handleReactionClick(reviewId: string, type: 'LIKE' | 'DISLIKE') {
    if (!isAuthenticated) {
      showToast({
        title: 'Нужен вход в аккаунт',
        message: 'Лайки и дизлайки доступны только авторизованным пользователям.',
        variant: 'info'
      });
      return;
    }

    reviewReactionMutation.mutate({ reviewId, type });
  }

  return (
    <div className="space-y-8">
      <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-[color:var(--muted)] hover:text-[color:var(--accent)]">
        ← Вернуться к каталогу
      </Link>

      <section className="gradient-ring">
        <div className="grid gap-6 rounded-[30px] bg-[color:var(--background-soft)] p-5 md:grid-cols-[300px_1fr] md:items-start md:p-7">
          <div className="book-cover-frame book-cover-frame--hero">
            {hasCover ? (
              <img
                src={coverUrl ?? undefined}
                alt={data.title}
                className="book-cover-image"
                decoding="async"
                onError={() => setCoverFailed(true)}
              />
            ) : (
              <div className="book-cover-fallback">Нет обложки</div>
            )}
          </div>

          <div className="flex flex-col">
            <span className="section-kicker">Карточка книги</span>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">{data.title}</h1>
            {data.originalTitle ? <p className="mt-3 text-lg italic text-[color:var(--muted)]">{data.originalTitle}</p> : null}

            <div className="mt-5 flex flex-wrap gap-2">
              {(data.authors ?? []).map((author: any) => (
                <Link key={author.id} to={`/authors/${author.id}`} className="warm-chip">
                  {author.fullName}
                </Link>
              ))}
              {(data.genres ?? []).map((genre: any) => (
                <span key={genre.id} className="warm-chip">{genre.name}</span>
              ))}
            </div>

            <div className="mt-6 max-w-3xl">
              <div
                className={`book-description-shell ${
                  shouldCollapseDescription
                    ? isDescriptionExpanded
                      ? 'book-description-shell--expanded'
                      : 'book-description-shell--collapsed'
                    : ''
                }`}
                style={descriptionMaxHeight ? { maxHeight: descriptionMaxHeight } : undefined}
              >
                <p ref={descriptionRef} className="book-description whitespace-pre-line text-sm leading-8 text-[color:var(--muted)]">
                  {descriptionText}
                </p>
              </div>
              {shouldCollapseDescription ? (
                <button
                  type="button"
                  className="book-description-toggle mt-4"
                  aria-expanded={isDescriptionExpanded}
                  onClick={() => setIsDescriptionExpanded((value) => !value)}
                >
                  <span>{isDescriptionExpanded ? 'Свернуть описание' : 'Показать описание полностью'}</span>
                  <span
                    aria-hidden="true"
                    className={`book-description-toggle__arrow ${isDescriptionExpanded ? 'book-description-toggle__arrow--expanded' : ''}`}
                  >
                    ↓
                  </span>
                </button>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {hasFragment ? (
                <Link to={`/books/${id}/fragment`} className="btn-primary">
                  Читать фрагмент
                </Link>
              ) : null}
              {canCheckFragment && fragmentQuery.isLoading ? <span className="btn-soft cursor-wait">Проверяем фрагмент</span> : null}
              {data.sourceUrl ? (
                <a href={data.sourceUrl} target="_blank" rel="noreferrer" className="btn-soft">
                  Карточка на источнике
                </a>
              ) : null}
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-4">
              <div className="metric-pill">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Средний рейтинг</p>
                {hasBookRatings ? (
                  <p className="mt-2 text-3xl font-semibold text-[color:var(--accent)]">{Number(stats.avgFinalScore ?? 0).toFixed(1)}</p>
                ) : (
                  <p className="mt-2 text-base font-semibold text-[color:var(--muted)]">Пока нет оценок</p>
                )}
              </div>
              <div className="metric-pill">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Оценок</p>
                <p className="mt-2 text-3xl font-semibold text-[color:var(--text)]">{stats.ratingCount ?? 0}</p>
              </div>
              <div className="metric-pill">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Язык книги</p>
                <p className="mt-2 text-3xl font-semibold text-[color:var(--text)]">{data.language || '—'}</p>
              </div>
              <div className="metric-pill">
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Год</p>
                <p className="mt-2 text-3xl font-semibold text-[color:var(--text)]">{data.publicationYear || '—'}</p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="surface-card space-y-4 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--accent)]">Моя библиотека</p>
                    <h3 className="mt-2 text-2xl font-semibold text-[color:var(--text)]">Сохраните книгу в нужный список</h3>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                      Избранное хранится отдельно, а статус чтения можно держать только на одной из трёх полок
                    </p>
                  </div>

                  <Link to={isAuthenticated ? '/profile/library' : '/login'} className="btn-soft shrink-0">
                    {isAuthenticated ? 'Открыть библиотеку' : 'Войти, чтобы сохранять'}
                  </Link>
                </div>

                {libraryError ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-[color:rgba(255,107,107,0.35)] bg-[color:rgba(255,107,107,0.08)] px-4 py-3 text-sm text-[color:#ffb3b3]"
                  >
                    {libraryError}
                  </div>
                ) : null}

                {isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={isLibraryBusy}
                        onClick={() => favoriteMutation.mutate(!isFavorite)}
                        className={`${isFavorite ? 'btn-primary' : 'btn-soft'} disabled:cursor-not-allowed disabled:opacity-70`}
                      >
                        {isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {readingShelves.map((shelf) => {
                        const isActive = currentShelf === shelf.key;

                        return (
                          <button
                            key={shelf.key}
                            type="button"
                            disabled={isLibraryBusy}
                            onClick={() => {
                              if (isActive) {
                                clearShelfMutation.mutate();
                                return;
                              }

                              shelfMutation.mutate(shelf.key);
                            }}
                            className={`${isActive ? 'btn-primary' : 'btn-soft'} disabled:cursor-not-allowed disabled:opacity-70`}
                          >
                            {shelf.title}
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-xs leading-6 text-[color:var(--muted)]">
                      Повторный клик по активной полке убирает книгу из этого списка
                    </p>
                  </div>
                ) : (
                  <p className="text-sm leading-7 text-[color:var(--muted)]">
                    После входа можно добавлять книгу в избранное и отмечать её как «Буду читать», «Прочитано» или «Перестал читать»
                  </p>
                )}
              </div>

              <RatingDrawer bookId={id} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="surface-panel p-6">
          <span className="section-kicker">Средние оценки</span>
          <h2 className="text-3xl font-semibold">Как книгу оценивают читатели</h2>
          {hasBookRatings ? (
            <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
              <RadarChart axes={radarAxes} />
              <div className="grid gap-3 sm:grid-cols-2">
                {scoreLabels.map((item) => (
                  <div key={item.key} className="metric-pill">
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">{item.title}</p>
                    <p className="mt-2 text-2xl font-semibold text-[color:var(--accent)]">
                      {Number(stats[item.key] ?? 0).toFixed(1)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="surface-card mt-6 p-5 text-sm leading-7 text-[color:var(--muted)]">Пока нет оценок</div>
          )}
        </article>

        <article className="surface-panel p-6">
          <span className="section-kicker">Материалы</span>
          <h2 className="text-3xl font-semibold">Что есть по книге</h2>
          <div className="mt-6 space-y-4">
            <div className="surface-card p-4">
              <p className="text-sm font-semibold text-[color:var(--muted-strong)]">Рецензии</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{reviewsTotal} опубликовано</p>
            </div>
            <div className="surface-card p-4">
              <p className="text-sm font-semibold text-[color:var(--muted-strong)]">Статьи</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{data.articles?.length ?? 0} опубликовано</p>
            </div>
            {bookFacts.length ? (
              <div className="surface-card p-4">
                <p className="text-sm font-semibold text-[color:var(--muted-strong)]">Дополнительная информация</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {bookFacts.map((fact) => (
                    <div key={fact.label} className="rounded-2xl border border-[color:rgba(255,220,120,0.12)] bg-[color:rgba(255,248,238,0.03)] px-3 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">{fact.label}</p>
                      <p className="mt-2 text-sm text-[color:var(--text)]">{fact.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="surface-card p-4">
              <p className="text-sm font-semibold text-[color:var(--muted-strong)]">Теги</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(data.tags ?? []).map((tag: any) => (
                  <span key={tag.id} className="warm-chip">{tag.name}</span>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className="surface-panel p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="section-kicker">Рецензии</span>
            <h2 className="text-3xl font-semibold">Что пишут читатели</h2>
          </div>
          <span className="text-sm text-[color:var(--muted)]">{reviewsTotal} рецензий</span>
        </div>

        <div className="mt-6 sort-panel">
          <div className="sort-panel__header">
            <div>
              <p className="sort-panel__title">Сортировка рецензий</p>
              <p className="sort-panel__hint">Сейчас активно: {activeReviewSort.title.toLowerCase()}</p>
            </div>
            <span className="warm-chip">{activeReviewSort.title}</span>
          </div>
          <div className="sort-panel__grid">
            {reviewSortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setReviewSort(option.value)}
                className={`sort-tile ${reviewSort === option.value ? 'sort-tile--active' : ''}`}
              >
                <span className="sort-tile__title">{option.title}</span>
                <span className="sort-tile__description">{option.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {reviewsQuery.isLoading ? (
            <div className="surface-card p-5 text-sm text-[color:var(--muted)]">Загружаем рецензии...</div>
          ) : null}

          {!reviewsQuery.isLoading && reviews.length ? (
            reviews.map((review: any) => (
              <article key={review.id} className="surface-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-[color:var(--text)]">{review.title}</h3>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[color:var(--muted)]">
                      {review.user?.username ? (
                        <Link to={`/people/${review.user.username}`} className="hover:text-[color:var(--accent)]">
                          @{review.user.username}
                        </Link>
                      ) : null}
                      <span>{new Date(review.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                  {review.user?.avatarUrl ? (
                    <div className="h-12 w-12 overflow-hidden rounded-2xl border border-[color:rgba(255,226,160,0.18)] bg-[color:rgba(255,248,238,0.05)]">
                      <img src={resolveMediaUrl(review.user.avatarUrl) ?? undefined} alt={review.user.username} className="h-full w-full object-cover" />
                    </div>
                  ) : null}
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-8 text-[color:var(--muted)]">{review.body}</p>
                <div className="review-reaction-bar">
                  <button
                    type="button"
                    onClick={() => handleReactionClick(review.id, 'LIKE')}
                    disabled={reviewReactionMutation.isPending}
                    className={`reaction-button ${review.reactionSummary?.userReaction === 'LIKE' ? 'reaction-button--active-like' : ''}`}
                  >
                    <span className="reaction-button__icon" aria-hidden="true">↑</span>
                    <span>Лайк</span>
                    <span>{review.reactionSummary?.likesCount ?? 0}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReactionClick(review.id, 'DISLIKE')}
                    disabled={reviewReactionMutation.isPending}
                    className={`reaction-button ${review.reactionSummary?.userReaction === 'DISLIKE' ? 'reaction-button--active-dislike' : ''}`}
                  >
                    <span className="reaction-button__icon" aria-hidden="true">↓</span>
                    <span>Дизлайк</span>
                    <span>{review.reactionSummary?.dislikesCount ?? 0}</span>
                  </button>
                </div>
              </article>
            ))
          ) : null}

          {!reviewsQuery.isLoading && !reviews.length ? (
            <div className="surface-card p-5 text-sm text-[color:var(--muted)]">
              Пока нет опубликованных рецензий по этой книге
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
