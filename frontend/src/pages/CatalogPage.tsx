import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api, getAccessToken } from '../api/client';
import { AiSearchPanel } from '../components/AiSearchPanel';
import { BookCard } from '../components/ContentCards';

const PAGE_SIZE = 24;
const catalogSections = [
  { slug: 'fantastika', title: 'Фантастика' },
  { slug: 'detektivy', title: 'Детективы' },
  { slug: 'mistika-i-uzhasy', title: 'Мистика и ужасы' },
  { slug: 'sovremennaya-proza', title: 'Современная проза' },
  { slug: 'lyubov', title: 'Любовь' },
  { slug: 'klassika', title: 'Классика' }
] as const;

const catalogSortOptions = [
  {
    value: 'rating_desc',
    title: 'Рейтинг: высокий -> низкий',
    description: 'Сначала книги с самым сильным средним баллом по системе 84'
  },
  {
    value: 'rating_asc',
    title: 'Рейтинг: низкий -> высокий',
    description: 'Если хочется посмотреть каталог от самых слабых оценок к лучшим'
  },
  {
    value: 'newest_desc',
    title: 'Добавление: новые -> старые',
    description: 'Сначала всё, что появилось в каталоге последним'
  },
  {
    value: 'newest_asc',
    title: 'Добавление: старые -> новые',
    description: 'Сначала книги, которые давно лежат в каталоге'
  },
  {
    value: 'title_asc',
    title: 'Название: А -> Я',
    description: 'Аккуратный алфавитный порядок для ручного просмотра'
  },
  {
    value: 'title_desc',
    title: 'Название: Я -> А',
    description: 'Обратный алфавит, если удобнее листать с конца'
  }
] as const;

type CatalogSort = (typeof catalogSortOptions)[number]['value'];

const legacyCatalogSortMap = {
  rating: 'rating_desc',
  year: 'newest_desc',
  newest: 'newest_desc',
  oldest: 'newest_asc',
  title: 'title_asc'
} as const;

const catalogSortValueSet = new Set(catalogSortOptions.map((item) => item.value));

function normalizeCatalogSort(value: string | null): CatalogSort {
  if (!value) {
    return 'rating_desc';
  }

  if (value === 'year_desc' || value === 'year_asc') {
    return 'newest_desc';
  }

  if (catalogSortValueSet.has(value as CatalogSort)) {
    return value as CatalogSort;
  }

  return legacyCatalogSortMap[value as keyof typeof legacyCatalogSortMap] ?? 'rating_desc';
}

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const section = searchParams.get('section') ?? '';
  const sort = normalizeCatalogSort(searchParams.get('sort'));
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const [draftQuery, setDraftQuery] = useState(query);
  const isAuthenticated = Boolean(getAccessToken());
  const activeSection = catalogSections.find((item) => item.slug === section) ?? null;
  const activeSort = catalogSortOptions.find((item) => item.value === sort) ?? catalogSortOptions[0];

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  const booksQuery = useQuery({
    queryKey: ['books', query, section, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('sort', sort);
      params.set('limit', String(PAGE_SIZE));
      params.set('page', String(page));

      if (query.trim()) {
        params.set('query', query.trim());
      }

      if (section) {
        params.set('section', section);
      }

      return (await api.get(`/books?${params.toString()}`)).data as {
        items: any[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    }
  });

  const books = booksQuery.data?.items ?? [];
  const meta = booksQuery.data?.meta ?? {
    total: 0,
    page,
    limit: PAGE_SIZE,
    totalPages: 1
  };
  const totalRatings = useMemo(
    () => books.reduce((sum: number, book: any) => sum + (book.ratingCount ?? 0), 0),
    [books]
  );

  function updateSearch(nextQuery: string, nextPage = 1, nextSection = section, nextSort = sort) {
    const params = new URLSearchParams();

    if (nextQuery.trim()) {
      params.set('q', nextQuery.trim());
    }

    if (nextSection) {
      params.set('section', nextSection);
    }

    if (nextSort) {
      params.set('sort', nextSort);
    }

    if (nextPage > 1) {
      params.set('page', String(nextPage));
    }

    setSearchParams(params);
  }

  return (
    <div className="space-y-8">
      <section className="surface-panel overflow-hidden p-6 md:p-8">
        <div className="editorial-grid items-end">
          <div className="md:col-span-8">
            <span className="section-kicker">Каталог</span>
            <h1 className="section-title">Ищите книги по названию, автору или ключевым словам</h1>
          </div>
          <div className="md:col-span-4 md:justify-self-end">
            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              <div className="metric-pill">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Всего в каталоге</p>
                <p className="mt-2 text-3xl font-semibold text-[color:var(--accent)]">{meta.total}</p>
              </div>
              <div className="metric-pill">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Оценок на странице</p>
                <p className="mt-2 text-3xl font-semibold text-[color:var(--text)]">{totalRatings}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hairline my-6" />

        <div className="mt-1">
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              updateSearch(draftQuery);
            }}
          >
            <label className="text-sm font-semibold text-[color:var(--muted-strong)]">Поиск по базе</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="input-modern"
                placeholder="Например: Булгаков, философия, уютный роман"
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
              />
              <button className="btn-primary shrink-0" type="submit">
                Найти
              </button>
            </div>
          </form>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateSearch(query, 1, '', sort)}
            className={section ? 'tab-pill' : 'tab-pill tab-pill-active'}
          >
            Все разделы
          </button>
          {catalogSections.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => updateSearch(query, 1, item.slug, sort)}
              className={section === item.slug ? 'tab-pill tab-pill-active' : 'tab-pill'}
            >
              {item.title}
            </button>
          ))}
        </div>

        <div className="mt-5 sort-panel">
          <div className="sort-panel__header">
            <div>
              <p className="sort-panel__title">Сортировка выдачи</p>
              <p className="sort-panel__hint">Сейчас активно: {activeSort.title.toLowerCase()}</p>
            </div>
            <span className="warm-chip">{activeSort.title}</span>
          </div>
          <div className="sort-panel__grid">
            {catalogSortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateSearch(query, 1, section, option.value)}
                className={`sort-tile ${sort === option.value ? 'sort-tile--active' : ''}`}
              >
                <span className="sort-tile__title">{option.title}</span>
                <span className="sort-tile__description">{option.description}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <AiSearchPanel
        title="AI-поиск для более сложных запросов"
        subtitle={
          isAuthenticated
            ? 'Опишите настроение, идею или ощущение, а помощник подберёт книги из каталога.'
            : 'AI-поиск доступен после входа в аккаунт. Обычный поиск по каталогу работает всегда.'
        }
      />

      <section className="space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="section-kicker">Результаты</span>
            <h2 className="text-3xl font-semibold text-[color:var(--text)]">
              {query ? `Книги по запросу «${query}»` : activeSection ? activeSection.title : 'Все книги каталога'}
            </h2>
          </div>
          <div className="text-sm text-[color:var(--muted)]">
            {meta.total} результатов, страница {meta.page} из {meta.totalPages}
          </div>
        </div>

        {!booksQuery.isLoading ? (
          <div className="flex flex-wrap gap-2">
            <span className="warm-chip">Сортировка: {activeSort.title}</span>
            {section ? <span className="warm-chip">Раздел: {activeSection?.title}</span> : null}
            {query ? <span className="warm-chip">Поиск: {query}</span> : null}
          </div>
        ) : null}

        {booksQuery.isLoading ? (
          <div className="surface-card p-6 text-sm text-[color:var(--muted)]">Каталог загружается...</div>
        ) : null}

        {!booksQuery.isLoading && !books.length ? (
          <div className="surface-card p-6 text-sm text-[color:var(--muted)]">
            По этому запросу книги не найдены. Попробуйте изменить формулировку или воспользоваться AI-поиском.
          </div>
        ) : null}

        <div className="grid gap-4">
          {books.map((book: any) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>

        {meta.totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => updateSearch(query, page - 1, section, sort)}
              disabled={page <= 1}
              className="btn-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              Назад
            </button>
            <div className="warm-chip">
              Страница {page} из {meta.totalPages}
            </div>
            <button
              type="button"
              onClick={() => updateSearch(query, page + 1, section, sort)}
              disabled={page >= meta.totalPages}
              className="btn-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              Вперёд
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
