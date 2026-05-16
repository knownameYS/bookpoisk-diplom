import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { BookCard } from '../components/ContentCards';

export default function AuthorPage() {
  const { id = '' } = useParams();

  const authorQuery = useQuery({
    queryKey: ['author', id],
    queryFn: async () => (await api.get(`/authors/${id}`)).data.item,
    enabled: Boolean(id)
  });

  const author = authorQuery.data;

  if (authorQuery.isLoading) {
    return <div className="surface-card p-6 text-sm text-[color:var(--muted)]">Загружаем страницу автора...</div>;
  }

  if (!author) {
    return <div className="surface-card p-6 text-sm text-[color:var(--muted)]">Не удалось открыть страницу автора</div>;
  }

  return (
    <div className="space-y-8">
      <section className="surface-panel p-6 md:p-8">
        <span className="section-kicker">Автор</span>
        <h1 className="section-title">{author.fullName}</h1>
        <p className="section-subtitle">
          {author.bio || 'Биография пока не добавлена'}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="warm-chip">{author.booksCount ?? 0} книг в каталоге</span>
          <span className="warm-chip">Средняя оценка {Number(author.averageScore ?? 0).toFixed(1)}/84</span>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="section-kicker">Книги</span>
            <h2 className="text-3xl font-semibold">Все книги автора</h2>
          </div>
          <span className="text-sm text-[color:var(--muted)]">{author.books?.length ?? 0} найдено</span>
        </div>

        <div className="grid gap-4">
          {(author.books ?? []).map((book: any) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      <section className="surface-card p-6">
        <span className="section-kicker">Материалы</span>
        <h2 className="text-2xl font-semibold">Рецензии и статьи</h2>
        <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
          Для книг этого автора можно открывать рецензии, оценки и связанные материалы прямо со страниц книг
        </p>
        <div className="mt-5">
          <Link to="/catalog" className="btn-soft">Перейти в каталог</Link>
        </div>
      </section>
    </div>
  );
}
