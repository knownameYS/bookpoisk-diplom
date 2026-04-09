import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { BookCard } from '../components/ContentCards';

export default function CatalogPage() {
  const { data, isLoading } = useQuery({ queryKey: ['books'], queryFn: async () => (await api.get('/books')).data });

  return (
    <div className="space-y-6">
      <section className="surface-card p-5 sm:p-6">
        <h1 className="text-3xl">Каталог книг</h1>
        <p className="mt-2 text-sm text-slate-500">Единый visual language: чистая сетка, светлая типографика, аккуратные фильтры и акценты.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input className="input-modern" placeholder="Поиск по названию" />
          <select className="input-modern"><option>Любой жанр</option></select>
          <select className="input-modern"><option>Сортировка: популярные</option></select>
        </div>
      </section>

      {isLoading && <div className="surface-card p-6 text-sm text-slate-500">Загружаем книги…</div>}
      {!isLoading && !(data?.length) && <div className="surface-card p-6 text-sm text-slate-500">Книги пока не найдены.</div>}

      <div className="grid gap-4">
        {(data ?? []).map((b: any) => <BookCard key={b.id} book={b} />)}
      </div>
    </div>
  );
}
