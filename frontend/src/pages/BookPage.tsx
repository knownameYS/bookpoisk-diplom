import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { RatingDrawer } from '../components/RatingDrawer';

export default function BookPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ['book', id], queryFn: async () => (await api.get(`/books/${id}`)).data });

  if (isLoading) return <div className="surface-card p-6">Загрузка книги…</div>;
  if (error || !data) return <div className="surface-card p-6">Ошибка загрузки книги.</div>;

  const stats = data.rating_stats ?? { avg_final_score: 0, count: 0 };

  return (
    <div className="space-y-6">
      <section className="gradient-ring">
        <div className="grid gap-6 rounded-2xl bg-white p-6 lg:grid-cols-[240px_1fr]">
          <div className="overflow-hidden rounded-2xl bg-slate-100">
            {data.cover_url ? (
              <img src={data.cover_url} alt={data.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-80 items-center justify-center text-sm text-slate-400">Нет обложки</div>
            )}
          </div>

          <div>
            <p className="tag">Страница книги</p>
            <h1 className="mt-3 text-4xl">{data.title}</h1>
            <p className="mt-2 text-slate-600">{data.description || 'Описание отсутствует.'}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to={`/authors/${data.author_id ?? 'unknown'}`} className="btn-soft">Перейти к автору</Link>
              <button className="btn-soft">Добавить в избранное</button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="surface-card p-6">
          <h2 className="text-xl">Рейтинг сообщества</h2>
          <p className="mt-2 text-sm text-slate-500">Ниже сохраняется исходная бизнес-логика: средний finalScore и количество оценок.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-indigo-50 p-4">
              <p className="text-xs uppercase tracking-wide text-indigo-500">Средний рейтинг</p>
              <p className="mt-1 text-3xl font-bold text-indigo-700">{stats.avg_final_score} <span className="text-base text-indigo-400">/84</span></p>
            </div>
            <div className="rounded-2xl bg-pink-50 p-4">
              <p className="text-xs uppercase tracking-wide text-pink-500">Оценок</p>
              <p className="mt-1 text-3xl font-bold text-pink-700">{stats.count}</p>
            </div>
          </div>
        </div>

        <div className="surface-card p-6">
          <h3 className="text-lg">Ваша оценка</h3>
          <p className="mt-2 text-sm text-slate-500">Откройте модальное drawer-окно с визуальным breakdown системы «84».</p>
          <div className="mt-4"><RatingDrawer bookId={id} /></div>
        </div>
      </section>
    </div>
  );
}
