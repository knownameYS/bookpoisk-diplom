import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api, apiBaseUrl, getApiErrorMessage } from '../api/client';
import { resolveMediaUrl } from '../utils/media';

const minZoom = 80;
const maxZoom = 185;
const zoomStep = 15;

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="fragment-control-icon">
      <path d="M12.5 4.5L7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="fragment-control-icon">
      <path d="M7.5 4.5L13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconZoomIn() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="fragment-control-icon">
      <circle cx="8.5" cy="8.5" r="4.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 6.3v4.4M6.3 8.5h4.4M12.4 12.4l3.4 3.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconZoomOut() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="fragment-control-icon">
      <circle cx="8.5" cy="8.5" r="4.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.3 8.5h4.4M12.4 12.4l3.4 3.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function BookFragmentPage() {
  const { id = '' } = useParams();
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(110);

  const bookQuery = useQuery({
    queryKey: ['book', id],
    queryFn: async () => (await api.get(`/books/${id}`)).data.item
  });

  const fragmentQuery = useQuery({
    queryKey: ['bookFragment', id],
    queryFn: async () => (await api.get(`/books/${id}/fragment`)).data.item,
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 60
  });

  if (bookQuery.isLoading || fragmentQuery.isLoading) {
    return <div className="surface-card p-6 text-sm text-[color:var(--muted)]">Подготавливаем фрагмент для чтения...</div>;
  }

  if (bookQuery.error || !bookQuery.data) {
    return <div className="surface-card p-6 text-sm text-[color:var(--muted)]">Не удалось открыть страницу фрагмента</div>;
  }

  const book = bookQuery.data;
  const fragment = fragmentQuery.data;
  const coverUrl = resolveMediaUrl(book.coverUrl);
  const fragmentViewerUrl = `${apiBaseUrl}/books/${id}/fragment/file#toolbar=0&navpanes=0&scrollbar=0&page=${page}&zoom=${zoom}`;
  const fragmentError = fragmentQuery.error ? getApiErrorMessage(fragmentQuery.error, 'Не удалось проверить доступность фрагмента') : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-[color:var(--muted)]">
        <Link to={`/books/${id}`} className="inline-flex items-center gap-2 hover:text-[color:var(--accent)]">
          ← Вернуться к книге
        </Link>
        <span className="text-[color:rgba(255,242,221,0.28)]">•</span>
        <Link to="/catalog" className="hover:text-[color:var(--accent)]">
          Каталог
        </Link>
      </div>

      <section className="gradient-ring">
        <div className="fragment-hero grid gap-6 rounded-[30px] bg-[color:var(--background-soft)] p-5 md:grid-cols-[220px_1fr] md:p-7">
          <div className="book-cover-frame book-cover-frame--hero fragment-hero__cover">
            {coverUrl ? <img src={coverUrl} alt={book.title} className="book-cover-image" /> : <div className="book-cover-fallback">Нет обложки</div>}
          </div>

          <div className="flex flex-col">
            <span className="section-kicker">Фрагмент книги</span>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">{book.title}</h1>

            <div className="mt-5 flex flex-wrap gap-2">
              {(book.authors ?? []).map((author: any) => (
                <Link key={author.id} to={`/authors/${author.id}`} className="warm-chip">
                  {author.fullName}
                </Link>
              ))}
              {(book.genres ?? []).map((genre: any) => (
                <span key={genre.id} className="warm-chip">
                  {genre.name}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {fragment?.available ? (
                <a href={fragment.pdfUrl} target="_blank" rel="noreferrer" className="btn-primary">
                  Открыть PDF отдельно
                </a>
              ) : null}
              {fragment?.sourceUrl ? (
                <a href={fragment.sourceUrl} target="_blank" rel="noreferrer" className="btn-soft">
                  Карточка на Eksmo
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {fragmentError ? (
        <section className="surface-card p-5 text-sm text-[color:#ffb3b3]">
          {fragmentError}
        </section>
      ) : null}

      {fragment?.available ? (
        <section className="surface-panel overflow-hidden p-0">
          <div className="fragment-reader-toolbar">
            <div className="fragment-reader-toolbar__actions">
              <button
                type="button"
                className="fragment-control-button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={page <= 1}
                aria-label="Предыдущая страница"
                title="Предыдущая страница"
              >
                <IconChevronLeft />
              </button>
              <div className="fragment-control-indicator">Стр. {page}</div>
              <button
                type="button"
                className="fragment-control-button"
                onClick={() => setPage((value) => value + 1)}
                aria-label="Следующая страница"
                title="Следующая страница"
              >
                <IconChevronRight />
              </button>
            </div>

            <div className="fragment-reader-toolbar__actions">
              <button
                type="button"
                className="fragment-control-button"
                onClick={() => setZoom((value) => Math.max(minZoom, value - zoomStep))}
                disabled={zoom <= minZoom}
                aria-label="Уменьшить масштаб"
                title="Уменьшить масштаб"
              >
                <IconZoomOut />
              </button>
              <div className="fragment-control-indicator">{zoom}%</div>
              <button
                type="button"
                className="fragment-control-button"
                onClick={() => setZoom((value) => Math.min(maxZoom, value + zoomStep))}
                disabled={zoom >= maxZoom}
                aria-label="Увеличить масштаб"
                title="Увеличить масштаб"
              >
                <IconZoomIn />
              </button>
              <a href={fragment.pdfUrl} target="_blank" rel="noreferrer" className="btn-soft">
                Скачать или открыть
              </a>
            </div>
          </div>

          <div className="fragment-viewer-shell">
            <iframe key={`${page}-${zoom}`} src={fragmentViewerUrl} title={`Фрагмент книги ${book.title}`} className="fragment-viewer-frame" />
          </div>
        </section>
      ) : (
        <section className="surface-panel p-6">
          <span className="section-kicker">Фрагмент недоступен</span>
          <h2 className="text-3xl font-semibold">У этой книги источник не отдал PDF-фрагмент</h2>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-[color:var(--muted)]">
            Это ограничение самой карточки на стороне источника. Если нужно, можно перейти на оригинальную страницу книги и проверить, появился ли фрагмент позже.
          </p>
          {fragment?.sourceUrl ? (
            <div className="mt-6">
              <a href={fragment.sourceUrl} target="_blank" rel="noreferrer" className="btn-soft">
                Открыть карточку источника
              </a>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
