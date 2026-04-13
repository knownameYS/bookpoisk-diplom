import { Link } from 'react-router-dom';

type BookCardProps = {
  book: {
    id: string;
    title: string;
    description?: string;
    avg_final_score?: number;
    rating_count?: number;
    author_name?: string;
    cover_url?: string;
  };
};

export function BookCard({ book }: BookCardProps) {
  return (
    <Link to={`/books/${book.id}`} className="surface-card group block overflow-hidden p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
      <div className="flex gap-4">
        <div className="h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">Нет обложки</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-lg group-hover:text-indigo-600">{book.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{book.author_name || 'Неизвестный автор'}</p>
          <p className="mt-3 line-clamp-3 text-sm text-slate-600">{book.description || 'Описание пока отсутствует.'}</p>
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <div className="rounded-lg bg-indigo-50 px-2.5 py-1 text-sm font-semibold text-indigo-700">
              {(book.avg_final_score ?? 0).toFixed?.(1) ?? book.avg_final_score} / 84
            </div>
            <span className="text-xs text-slate-500">{book.rating_count ?? 0} оценок</span>
          </div>
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
    <Link to={to} className="surface-card block p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <span className="tag">{label}</span>
      <h3 className="mt-3 text-lg">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <p className="mt-3 line-clamp-3 text-sm text-slate-600">{excerpt}</p>
    </Link>
  );
}
