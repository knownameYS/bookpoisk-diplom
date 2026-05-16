import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { api, getAccessToken, getApiErrorMessage } from '../api/client';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/ToastProvider';
import { getCurrentUser } from '../features/profiles';

const tabs = [
  { key: 'dashboard', title: 'Обзор' },
  { key: 'books', title: 'Книги' },
  { key: 'users', title: 'Пользователи' },
  { key: 'reviews', title: 'Рецензии' },
  { key: 'articles', title: 'Статьи' },
  { key: 'comments', title: 'Комментарии' },
  { key: 'authors', title: 'Авторы' }
] as const;

const statusLabels = {
  PUBLISHED: 'Опубликовано',
  DRAFT: 'Черновик',
  HIDDEN: 'Скрыто'
} as const;

const roleLabels = {
  ADMIN: 'Администратор',
  USER: 'Читатель'
} as const;

const commentTypeLabels = {
  'review-comments': 'Комментарии к рецензиям',
  'article-comments': 'Комментарии к статьям'
} as const;

type AdminTab = (typeof tabs)[number]['key'];
type AdminStatus = keyof typeof statusLabels;

type AdminBookFormState = {
  id: string | null;
  title: string;
  originalTitle: string;
  description: string;
  publicationYear: string;
  language: string;
  isbn13: string;
  coverUrl: string;
  catalogSection: string;
  catalogSectionSlug: string;
  series: string;
  publisher: string;
  editor: string;
  sourceSite: string;
  sourceUrl: string;
  ageRestriction: string;
  pageCount: string;
  readTimeHours: string;
  status: AdminStatus;
  authorIds: string[];
  genreIds: string[];
  tagIds: string[];
};

type AdminBookOptionalStringField =
  | 'originalTitle'
  | 'description'
  | 'language'
  | 'isbn13'
  | 'coverUrl'
  | 'catalogSection'
  | 'catalogSectionSlug'
  | 'series'
  | 'publisher'
  | 'editor'
  | 'sourceSite'
  | 'sourceUrl'
  | 'ageRestriction';

function createEmptyBookForm(): AdminBookFormState {
  return {
    id: null,
    title: '',
    originalTitle: '',
    description: '',
    publicationYear: '',
    language: '',
    isbn13: '',
    coverUrl: '',
    catalogSection: '',
    catalogSectionSlug: '',
    series: '',
    publisher: '',
    editor: '',
    sourceSite: '',
    sourceUrl: '',
    ageRestriction: '',
    pageCount: '',
    readTimeHours: '',
    status: 'PUBLISHED',
    authorIds: [],
    genreIds: [],
    tagIds: []
  };
}

function createBookFormFromItem(book: any): AdminBookFormState {
  return {
    id: book.id,
    title: book.title ?? '',
    originalTitle: book.originalTitle ?? '',
    description: book.description ?? '',
    publicationYear: book.publicationYear ? String(book.publicationYear) : '',
    language: book.language ?? '',
    isbn13: book.isbn13 ?? '',
    coverUrl: book.coverUrl ?? '',
    catalogSection: book.catalogSection ?? '',
    catalogSectionSlug: book.catalogSectionSlug ?? '',
    series: book.series ?? '',
    publisher: book.publisher ?? '',
    editor: book.editor ?? '',
    sourceSite: book.sourceSite ?? '',
    sourceUrl: book.sourceUrl ?? '',
    ageRestriction: book.ageRestriction ?? '',
    pageCount: book.pageCount ? String(book.pageCount) : '',
    readTimeHours: book.readTimeHours ? String(book.readTimeHours) : '',
    status: (book.status ?? 'PUBLISHED') as AdminStatus,
    authorIds: (book.authors ?? []).map((author: any) => author.id),
    genreIds: (book.genres ?? []).map((genre: any) => genre.id),
    tagIds: (book.tags ?? []).map((tag: any) => tag.id)
  };
}

function normalizeOptionalString(value: string) {
  const normalized = value.trim();
  return normalized || undefined;
}

function buildBookPayload(formState: AdminBookFormState) {
  const payload: Record<string, unknown> = {
    title: formState.title.trim(),
    status: formState.status,
    authorIds: formState.authorIds,
    genreIds: formState.genreIds,
    tagIds: formState.tagIds
  };

  const optionalFields: Array<[AdminBookOptionalStringField, string]> = [
    ['originalTitle', 'originalTitle'],
    ['description', 'description'],
    ['language', 'language'],
    ['isbn13', 'isbn13'],
    ['coverUrl', 'coverUrl'],
    ['catalogSection', 'catalogSection'],
    ['catalogSectionSlug', 'catalogSectionSlug'],
    ['series', 'series'],
    ['publisher', 'publisher'],
    ['editor', 'editor'],
    ['sourceSite', 'sourceSite'],
    ['sourceUrl', 'sourceUrl'],
    ['ageRestriction', 'ageRestriction']
  ];

  for (const [stateKey, payloadKey] of optionalFields) {
    const normalized = normalizeOptionalString(formState[stateKey]);
    if (normalized !== undefined) {
      payload[payloadKey] = normalized;
    }
  }

  if (formState.publicationYear.trim()) {
    payload.publicationYear = Number(formState.publicationYear);
  }

  if (formState.pageCount.trim()) {
    payload.pageCount = Number(formState.pageCount);
  }

  if (formState.readTimeHours.trim()) {
    payload.readTimeHours = Number(formState.readTimeHours);
  }

  return payload;
}

function toggleSelectedId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export default function AdminPage() {
  const isAuthenticated = Boolean(getAccessToken());
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [bookSearch, setBookSearch] = useState('');
  const [bookForm, setBookForm] = useState<AdminBookFormState>(createEmptyBookForm());
  const [isBookEditorOpen, setIsBookEditorOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<{ id: string; title: string } | null>(null);

  const currentUserQuery = useQuery({
    queryKey: ['me'],
    enabled: isAuthenticated,
    queryFn: getCurrentUser
  });

  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard'],
    enabled: currentUserQuery.data?.role === 'ADMIN',
    queryFn: async () => (await api.get('/admin/dashboard')).data
  });

  const booksQuery = useQuery({
    queryKey: ['admin-books', bookSearch],
    enabled: currentUserQuery.data?.role === 'ADMIN' && activeTab === 'books',
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', '30');
      if (bookSearch.trim()) {
        params.set('query', bookSearch.trim());
      }
      return (await api.get(`/admin/books?${params.toString()}`)).data;
    }
  });

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    enabled: currentUserQuery.data?.role === 'ADMIN' && activeTab === 'users',
    queryFn: async () => (await api.get('/admin/users?limit=30')).data
  });

  const reviewsQuery = useQuery({
    queryKey: ['admin-review-moderation'],
    enabled: currentUserQuery.data?.role === 'ADMIN' && activeTab === 'reviews',
    queryFn: async () => (await api.get('/admin/moderation/reviews?limit=30')).data
  });

  const articlesQuery = useQuery({
    queryKey: ['admin-article-moderation'],
    enabled: currentUserQuery.data?.role === 'ADMIN' && activeTab === 'articles',
    queryFn: async () => (await api.get('/admin/moderation/articles?limit=30')).data
  });

  const reviewCommentsQuery = useQuery({
    queryKey: ['admin-review-comment-moderation'],
    enabled: currentUserQuery.data?.role === 'ADMIN' && activeTab === 'comments',
    queryFn: async () => (await api.get('/admin/moderation/review-comments?limit=30')).data
  });

  const articleCommentsQuery = useQuery({
    queryKey: ['admin-article-comment-moderation'],
    enabled: currentUserQuery.data?.role === 'ADMIN' && activeTab === 'comments',
    queryFn: async () => (await api.get('/admin/moderation/article-comments?limit=30')).data
  });

  const authorsQuery = useQuery({
    queryKey: ['admin-authors'],
    enabled: currentUserQuery.data?.role === 'ADMIN' && activeTab === 'authors',
    queryFn: async () => (await api.get('/authors?limit=30')).data
  });

  const authorOptionsQuery = useQuery({
    queryKey: ['admin-book-authors'],
    enabled: currentUserQuery.data?.role === 'ADMIN' && activeTab === 'books',
    queryFn: async () => (await api.get('/authors?limit=50')).data
  });

  const genreOptionsQuery = useQuery({
    queryKey: ['admin-book-genres'],
    enabled: currentUserQuery.data?.role === 'ADMIN' && activeTab === 'books',
    queryFn: async () => (await api.get('/genres?limit=50')).data
  });

  const tagOptionsQuery = useQuery({
    queryKey: ['admin-book-tags'],
    enabled: currentUserQuery.data?.role === 'ADMIN' && activeTab === 'books',
    queryFn: async () => (await api.get('/tags?limit=50')).data
  });

  const bookStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AdminStatus }) =>
      api.patch(`/admin/books/${id}/status`, { status }),
    onSuccess: async () => {
      showToast({
        title: 'Статус книги обновлён',
        variant: 'success'
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-books'] });
    },
    onError: (error) => {
      showToast({
        title: 'Не удалось обновить статус книги',
        message: getApiErrorMessage(error),
        variant: 'error'
      });
    }
  });

  const reviewStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AdminStatus }) =>
      api.patch(`/admin/reviews/${id}/status`, { status }),
    onSuccess: async () => {
      showToast({
        title: 'Статус рецензии обновлён',
        variant: 'success'
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-review-moderation'] });
    },
    onError: (error) => {
      showToast({
        title: 'Не удалось обновить статус рецензии',
        message: getApiErrorMessage(error),
        variant: 'error'
      });
    }
  });

  const articleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AdminStatus }) =>
      api.patch(`/admin/articles/${id}/status`, { status }),
    onSuccess: async () => {
      showToast({
        title: 'Статус статьи обновлён',
        variant: 'success'
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-article-moderation'] });
    },
    onError: (error) => {
      showToast({
        title: 'Не удалось обновить статус статьи',
        message: getApiErrorMessage(error),
        variant: 'error'
      });
    }
  });

  const commentStatusMutation = useMutation({
    mutationFn: async ({
      id,
      type,
      status
    }: {
      id: string;
      type: 'review-comments' | 'article-comments';
      status: AdminStatus;
    }) => api.patch(`/admin/${type}/${id}/status`, { status }),
    onSuccess: async () => {
      showToast({
        title: 'Статус комментария обновлён',
        variant: 'success'
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-review-comment-moderation'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-article-comment-moderation'] })
      ]);
    },
    onError: (error) => {
      showToast({
        title: 'Не удалось обновить статус комментария',
        message: getApiErrorMessage(error),
        variant: 'error'
      });
    }
  });

  const saveBookMutation = useMutation({
    mutationFn: async () => {
      const payload = buildBookPayload(bookForm);

      if (bookForm.id) {
        return (await api.patch(`/books/${bookForm.id}`, payload)).data.item;
      }

      return (await api.post('/books', payload)).data.item;
    },
    onSuccess: async () => {
      showToast({
        title: bookForm.id ? 'Книга обновлена' : 'Книга добавлена',
        message: bookForm.title.trim(),
        variant: 'success'
      });
      setIsBookEditorOpen(false);
      setBookForm(createEmptyBookForm());
      await queryClient.invalidateQueries({ queryKey: ['admin-books'] });
    },
    onError: (error) => {
      showToast({
        title: 'Не удалось сохранить книгу',
        message: getApiErrorMessage(error),
        variant: 'error'
      });
    }
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/books/${id}`);
    },
    onSuccess: async () => {
      showToast({
        title: 'Книга удалена',
        variant: 'success'
      });
      setBookToDelete(null);
      if (bookForm.id === bookToDelete?.id) {
        setBookForm(createEmptyBookForm());
        setIsBookEditorOpen(false);
      }
      await queryClient.invalidateQueries({ queryKey: ['admin-books'] });
    },
    onError: (error) => {
      showToast({
        title: 'Не удалось удалить книгу',
        message: getApiErrorMessage(error),
        variant: 'error'
      });
    }
  });

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (currentUserQuery.isLoading) {
    return <div className="surface-card p-6 text-sm text-[color:var(--muted)]">Проверяем доступ...</div>;
  }

  if (currentUserQuery.data?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const dashboard = dashboardQuery.data?.stats;
  const books = booksQuery.data?.items ?? [];
  const users = usersQuery.data?.items ?? [];
  const reviews = reviewsQuery.data?.items ?? [];
  const articles = articlesQuery.data?.items ?? [];
  const reviewComments = reviewCommentsQuery.data?.items ?? [];
  const articleComments = articleCommentsQuery.data?.items ?? [];
  const authors = authorsQuery.data?.items ?? [];
  const authorOptions = authorOptionsQuery.data?.items ?? [];
  const genreOptions = genreOptionsQuery.data?.items ?? [];
  const tagOptions = tagOptionsQuery.data?.items ?? [];

  function openCreateBookForm() {
    setBookForm(createEmptyBookForm());
    setIsBookEditorOpen(true);
  }

  function openEditBookForm(book: any) {
    setBookForm(createBookFormFromItem(book));
    setIsBookEditorOpen(true);
  }

  function closeBookForm() {
    setBookForm(createEmptyBookForm());
    setIsBookEditorOpen(false);
  }

  function renderStatusButtons(
    currentStatus: AdminStatus,
    onSelect: (status: AdminStatus) => void,
    busy = false
  ) {
    return (['PUBLISHED', 'DRAFT', 'HIDDEN'] as AdminStatus[]).map((status) => (
      <button
        key={status}
        type="button"
        disabled={busy}
        onClick={() => onSelect(status)}
        className={currentStatus === status ? 'btn-primary disabled:opacity-70' : 'btn-soft disabled:opacity-70'}
      >
        {statusLabels[status]}
      </button>
    ));
  }

  return (
    <div className="space-y-8">
      <section className="surface-panel glow-shell p-6">
        <span className="section-kicker">Админка</span>
        <h1 className="section-title">Рабочий кабинет проекта</h1>
        <p className="section-subtitle">
          Здесь можно следить за каталогом, пользователями, рецензиями и состоянием контента.
        </p>
      </section>

      <section className="surface-card p-4">
        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`tab-pill ${activeTab === tab.key ? 'tab-pill-active' : ''}`}
            >
              {tab.title}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'dashboard' ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="metric-pill"><p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Пользователи</p><p className="mt-2 text-3xl font-semibold text-[color:var(--accent)]">{dashboard?.users ?? 0}</p></div>
          <div className="metric-pill"><p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Книги</p><p className="mt-2 text-3xl font-semibold text-[color:var(--accent)]">{dashboard?.books ?? 0}</p></div>
          <div className="metric-pill"><p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Рецензии</p><p className="mt-2 text-3xl font-semibold text-[color:var(--accent)]">{dashboard?.reviews ?? 0}</p></div>
          <div className="metric-pill"><p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Статьи</p><p className="mt-2 text-3xl font-semibold text-[color:var(--accent)]">{dashboard?.articles ?? 0}</p></div>
          <div className="metric-pill"><p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Комментарии</p><p className="mt-2 text-3xl font-semibold text-[color:var(--accent)]">{dashboard?.comments ?? 0}</p></div>
          <div className="metric-pill"><p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Коллекции</p><p className="mt-2 text-3xl font-semibold text-[color:var(--accent)]">{dashboard?.collections ?? 0}</p></div>
        </section>
      ) : null}

      {activeTab === 'books' ? (
        <div className="space-y-6">
          <section className="surface-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Управление каталогом</p>
                <h2 className="mt-2 text-2xl font-semibold">Добавление, редактирование и публикация книг</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  className="input-modern min-w-[16rem]"
                  value={bookSearch}
                  onChange={(event) => setBookSearch(event.target.value)}
                  placeholder="Поиск по названию, оригиналу или ISBN"
                />
                <button type="button" onClick={openCreateBookForm} className="btn-primary">
                  Добавить книгу
                </button>
              </div>
            </div>
          </section>

          {isBookEditorOpen ? (
            <section className="surface-panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="section-kicker">{bookForm.id ? 'Редактирование' : 'Новая книга'}</span>
                  <h2 className="text-3xl font-semibold">{bookForm.id ? 'Редактировать книгу' : 'Добавить книгу в каталог'}</h2>
                </div>
                <button type="button" onClick={closeBookForm} className="btn-soft">
                  Закрыть форму
                </button>
              </div>

              <div className="mt-6 admin-form-grid">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Название</span>
                  <input
                    className="input-modern"
                    value={bookForm.title}
                    onChange={(event) => setBookForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Название книги"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Оригинальное название</span>
                  <input
                    className="input-modern"
                    value={bookForm.originalTitle}
                    onChange={(event) => setBookForm((current) => ({ ...current, originalTitle: event.target.value }))}
                    placeholder="Название на языке оригинала"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Статус</span>
                  <select
                    className="select-modern"
                    value={bookForm.status}
                    onChange={(event) =>
                      setBookForm((current) => ({ ...current, status: event.target.value as AdminStatus }))
                    }
                  >
                    {(Object.keys(statusLabels) as AdminStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Год выхода</span>
                  <input
                    className="input-modern"
                    inputMode="numeric"
                    value={bookForm.publicationYear}
                    onChange={(event) => setBookForm((current) => ({ ...current, publicationYear: event.target.value }))}
                    placeholder="Например, 2024"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Язык</span>
                  <input
                    className="input-modern"
                    value={bookForm.language}
                    onChange={(event) => setBookForm((current) => ({ ...current, language: event.target.value }))}
                    placeholder="ru"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">ISBN</span>
                  <input
                    className="input-modern"
                    value={bookForm.isbn13}
                    onChange={(event) => setBookForm((current) => ({ ...current, isbn13: event.target.value }))}
                    placeholder="ISBN-13"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Обложка</span>
                  <input
                    className="input-modern"
                    value={bookForm.coverUrl}
                    onChange={(event) => setBookForm((current) => ({ ...current, coverUrl: event.target.value }))}
                    placeholder="https://..."
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Раздел каталога</span>
                  <input
                    className="input-modern"
                    value={bookForm.catalogSection}
                    onChange={(event) => setBookForm((current) => ({ ...current, catalogSection: event.target.value }))}
                    placeholder="Фантастика"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Слаг раздела</span>
                  <input
                    className="input-modern"
                    value={bookForm.catalogSectionSlug}
                    onChange={(event) => setBookForm((current) => ({ ...current, catalogSectionSlug: event.target.value }))}
                    placeholder="fantastika"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Серия</span>
                  <input
                    className="input-modern"
                    value={bookForm.series}
                    onChange={(event) => setBookForm((current) => ({ ...current, series: event.target.value }))}
                    placeholder="Серия книги"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Издательство</span>
                  <input
                    className="input-modern"
                    value={bookForm.publisher}
                    onChange={(event) => setBookForm((current) => ({ ...current, publisher: event.target.value }))}
                    placeholder="Издательство"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Редактор</span>
                  <input
                    className="input-modern"
                    value={bookForm.editor}
                    onChange={(event) => setBookForm((current) => ({ ...current, editor: event.target.value }))}
                    placeholder="Редактор"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Источник</span>
                  <input
                    className="input-modern"
                    value={bookForm.sourceSite}
                    onChange={(event) => setBookForm((current) => ({ ...current, sourceSite: event.target.value }))}
                    placeholder="eksmo"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Ссылка на источник</span>
                  <input
                    className="input-modern"
                    value={bookForm.sourceUrl}
                    onChange={(event) => setBookForm((current) => ({ ...current, sourceUrl: event.target.value }))}
                    placeholder="https://..."
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Возрастное ограничение</span>
                  <input
                    className="input-modern"
                    value={bookForm.ageRestriction}
                    onChange={(event) => setBookForm((current) => ({ ...current, ageRestriction: event.target.value }))}
                    placeholder="16+"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Страниц</span>
                  <input
                    className="input-modern"
                    inputMode="numeric"
                    value={bookForm.pageCount}
                    onChange={(event) => setBookForm((current) => ({ ...current, pageCount: event.target.value }))}
                    placeholder="320"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Время чтения, ч</span>
                  <input
                    className="input-modern"
                    inputMode="decimal"
                    value={bookForm.readTimeHours}
                    onChange={(event) => setBookForm((current) => ({ ...current, readTimeHours: event.target.value }))}
                    placeholder="8.5"
                  />
                </label>

                <label className="admin-form-grid--full space-y-2">
                  <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Описание</span>
                  <textarea
                    className="textarea-modern min-h-[180px]"
                    value={bookForm.description}
                    onChange={(event) => setBookForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Аннотация или краткое описание книги"
                  />
                </label>

                <div className="admin-form-grid--full space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Авторы</span>
                    <span className="warm-chip">{bookForm.authorIds.length} выбрано</span>
                  </div>
                  <div className="admin-picker-grid">
                    {authorOptions.map((author: any) => (
                      <button
                        key={author.id}
                        type="button"
                        onClick={() =>
                          setBookForm((current) => ({
                            ...current,
                            authorIds: toggleSelectedId(current.authorIds, author.id)
                          }))
                        }
                        className={`admin-picker-option ${bookForm.authorIds.includes(author.id) ? 'admin-picker-option--active' : ''}`}
                      >
                        {author.fullName}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-form-grid--full space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Жанры</span>
                    <span className="warm-chip">{bookForm.genreIds.length} выбрано</span>
                  </div>
                  <div className="admin-picker-grid">
                    {genreOptions.map((genre: any) => (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={() =>
                          setBookForm((current) => ({
                            ...current,
                            genreIds: toggleSelectedId(current.genreIds, genre.id)
                          }))
                        }
                        className={`admin-picker-option ${bookForm.genreIds.includes(genre.id) ? 'admin-picker-option--active' : ''}`}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-form-grid--full space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-[color:var(--muted-strong)]">Теги</span>
                    <span className="warm-chip">{bookForm.tagIds.length} выбрано</span>
                  </div>
                  <div className="admin-picker-grid">
                    {tagOptions.map((tag: any) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() =>
                          setBookForm((current) => ({
                            ...current,
                            tagIds: toggleSelectedId(current.tagIds, tag.id)
                          }))
                        }
                        className={`admin-picker-option ${bookForm.tagIds.includes(tag.id) ? 'admin-picker-option--active' : ''}`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => saveBookMutation.mutate()}
                  disabled={saveBookMutation.isPending || bookForm.title.trim().length < 1}
                  className="btn-primary disabled:opacity-70"
                >
                  {saveBookMutation.isPending
                    ? 'Сохраняем...'
                    : bookForm.id
                      ? 'Сохранить изменения'
                      : 'Добавить книгу'}
                </button>
                <button type="button" onClick={closeBookForm} className="btn-soft">
                  Отмена
                </button>
              </div>
            </section>
          ) : null}

          <section className="grid gap-4">
            {books.map((book: any) => (
              <article key={book.id} className="surface-card p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-xl font-semibold text-[color:var(--text)]">{book.title}</h2>
                      <p className="mt-2 text-sm text-[color:var(--muted)]">
                        {book.authors?.map((author: any) => author.fullName).join(', ') || 'Автор не указан'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="warm-chip">Статус: {statusLabels[book.status as AdminStatus]}</span>
                      {book.publicationYear ? <span className="warm-chip">Год: {book.publicationYear}</span> : null}
                      {book.language ? <span className="warm-chip">Язык: {book.language}</span> : null}
                    </div>

                    {book.genres?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {book.genres.map((genre: any) => (
                          <span key={genre.id} className="warm-chip">{genre.name}</span>
                        ))}
                      </div>
                    ) : null}

                    {book.tags?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {book.tags.map((tag: any) => (
                          <span key={tag.id} className="warm-chip">{tag.name}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openEditBookForm(book)} className="btn-soft">
                      Редактировать
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookToDelete({ id: book.id, title: book.title })}
                      className="btn-soft"
                    >
                      Удалить
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {renderStatusButtons(
                    book.status as AdminStatus,
                    (status) => bookStatusMutation.mutate({ id: book.id, status }),
                    bookStatusMutation.isPending
                  )}
                </div>
              </article>
            ))}

            {!books.length ? (
              <div className="surface-card p-6 text-sm text-[color:var(--muted)]">По текущему запросу книги не найдены.</div>
            ) : null}
          </section>
        </div>
      ) : null}

      {activeTab === 'users' ? (
        <section className="grid gap-4">
          {users.map((user: any) => (
            <article key={user.id} className="surface-card p-5">
              <h2 className="text-xl font-semibold text-[color:var(--text)]">@{user.username}</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{user.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="warm-chip">{roleLabels[user.role as keyof typeof roleLabels] ?? user.role}</span>
                <span className="warm-chip">{user._count?.ratings ?? 0} оценок</span>
                <span className="warm-chip">{user._count?.reviews ?? 0} рецензий</span>
                <span className="warm-chip">{user._count?.followers ?? 0} подписчиков</span>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {activeTab === 'reviews' ? (
        <section className="grid gap-4">
          {reviews.map((review: any) => (
            <article key={review.id} className="surface-card p-5">
              <h2 className="text-xl font-semibold text-[color:var(--text)]">{review.title}</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{statusLabels[review.status as AdminStatus]}</p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{review.body?.slice(0, 280)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {renderStatusButtons(
                  review.status as AdminStatus,
                  (status) => reviewStatusMutation.mutate({ id: review.id, status }),
                  reviewStatusMutation.isPending
                )}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {activeTab === 'articles' ? (
        <section className="grid gap-4">
          {articles.map((article: any) => (
            <article key={article.id} className="surface-card p-5">
              <h2 className="text-xl font-semibold text-[color:var(--text)]">{article.title}</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{statusLabels[article.status as AdminStatus]}</p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{article.body?.slice(0, 280)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {renderStatusButtons(
                  article.status as AdminStatus,
                  (status) => articleStatusMutation.mutate({ id: article.id, status }),
                  articleStatusMutation.isPending
                )}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {activeTab === 'comments' ? (
        <section className="grid gap-4 md:grid-cols-2">
          {[
            ...reviewComments.map((item: any) => ({ ...item, type: 'review-comments' as const })),
            ...articleComments.map((item: any) => ({ ...item, type: 'article-comments' as const }))
          ].map((comment: any & { type: keyof typeof commentTypeLabels }) => (
            <article key={`${comment.type}-${comment.id}`} className="surface-card p-5">
              <p className="text-sm text-[color:var(--muted)]">
                {commentTypeLabels[comment.type as keyof typeof commentTypeLabels]}
              </p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{statusLabels[comment.status as AdminStatus]}</p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{comment.body?.slice(0, 240)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {renderStatusButtons(
                  comment.status as AdminStatus,
                  (status) => commentStatusMutation.mutate({ id: comment.id, type: comment.type, status }),
                  commentStatusMutation.isPending
                )}
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {activeTab === 'authors' ? (
        <section className="grid gap-4">
          {authors.map((author: any) => (
            <article key={author.id} className="surface-card p-5">
              <h2 className="text-xl font-semibold text-[color:var(--text)]">{author.fullName}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="warm-chip">{author.booksCount ?? 0} книг</span>
                <span className="warm-chip">Средняя оценка {Number(author.averageScore ?? 0).toFixed(1)}/84</span>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      <ConfirmDialog
        open={Boolean(bookToDelete)}
        title="Удалить книгу"
        description={
          bookToDelete
            ? `Книга «${bookToDelete.title}» будет удалена из каталога. Действие нельзя отменить.`
            : ''
        }
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        busy={deleteBookMutation.isPending}
        onCancel={() => setBookToDelete(null)}
        onConfirm={() => {
          if (bookToDelete) {
            deleteBookMutation.mutate(bookToDelete.id);
          }
        }}
      />
    </div>
  );
}
