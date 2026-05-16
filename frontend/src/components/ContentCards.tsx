import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../utils/media';

type BookCardProps = {
  book: {
    id: string;
    title: string;
    description?: string | null;
    avgFinalScore?: number;
    ratingCount?: number;
    authors?: Array<{ id: string; fullName: string }>;
    bookAuthors?: Array<{ author: { id: string; fullName: string } }>;
    coverUrl?: string | null;
    genres?: Array<{ id: string; name: string }> | string[];
    bookGenres?: Array<{ genre: { id: string; name: string } }>;
  };
};

export function BookCard({ book }: BookCardProps) {
  const hasRatings = (book.ratingCount ?? 0) > 0;
  const authorLine =
    book.authors?.map((author) => author.fullName).join(', ') ||
    book.bookAuthors?.map((item) => item.author.fullName).join(', ') ||
    'Автор не указан';

  const normalizedGenres = book.genres?.length ? book.genres : book.bookGenres?.map((item) => item.genre) ?? [];
  const genres = Array.isArray(normalizedGenres)
    ? normalizedGenres.map((genre) => (typeof genre === 'string' ? genre : genre.name)).slice(0, 3)
    : [];
  const coverUrl = resolveMediaUrl(book.coverUrl);
  const description = book.description?.trim();

  return (
    <Link
      to={`/books/${book.id}`}
      className="surface-panel group block overflow-hidden p-4 hover:-translate-y-0.5 hover:border-[color:rgba(255,209,102,0.24)]"
    >
      <div className="grid gap-4 sm:grid-cols-[132px_1fr]">
        <div className="book-cover-frame book-cover-frame--card">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={book.title}
              className="book-cover-image transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="book-cover-fallback">Нет обложки</div>
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <div className="min-w-0">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Книга</p>
              <h3 className="line-clamp-2 text-2xl font-semibold text-[color:var(--text)]">{book.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{authorLine}</p>
            </div>

            <div className="metric-pill min-w-[110px] self-start text-right">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">Оценка</p>
              <p className="mt-1 text-2xl font-semibold text-[color:var(--accent)]">
                {hasRatings ? (book.avgFinalScore ?? 0).toFixed(1) : '—'}
              </p>
              <p className="text-xs text-[color:var(--muted)]">
                {hasRatings ? `${book.ratingCount ?? 0} оценок` : 'Пока нет оценок'}
              </p>
            </div>
          </div>

          {genres.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {genres.map((genre) => (
                <span key={genre} className="warm-chip">{genre}</span>
              ))}
            </div>
          ) : null}

          <p className="mt-4 line-clamp-3 text-sm leading-7 text-[color:var(--muted)]">
            {description || 'Аннотация пока не добавлена'}
          </p>
        </div>
      </div>
    </Link>
  );
}

type TextCardProps = {
  title: string;
  subtitle: string;
  excerpt: string;
  to: string;
  label: string;
};

export function TextCard({ title, subtitle, excerpt, to, label }: TextCardProps) {
  return (
    <Link to={to} className="surface-card block p-5 hover:border-[color:rgba(255,209,102,0.22)]">
      <span className="tag">{label}</span>
      <h3 className="mt-4 text-2xl font-semibold text-[color:var(--text)]">{title}</h3>
      <p className="mt-2 text-sm uppercase tracking-[0.16em] text-[color:var(--muted)]">{subtitle}</p>
      <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">{excerpt}</p>
    </Link>
  );
}
