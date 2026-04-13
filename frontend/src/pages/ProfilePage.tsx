import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function ProfilePage() {
  const ratings = useQuery({ queryKey: ['myRatings'], queryFn: async () => (await api.get('/ratings/my/list')).data });
  const favorites = useQuery({ queryKey: ['favorites'], queryFn: async () => (await api.get('/favorites')).data });
  const collections = useQuery({ queryKey: ['collections'], queryFn: async () => (await api.get('/collections')).data });

  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <h1 className="section-title">Профиль</h1>
        <p className="mt-2 text-sm text-slate-500">Личный кабинет с единым стилем для оценок, избранного и подборок.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link to="/profile/my-ratings" className="surface-card p-5 transition hover:shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-500">Мои оценки</p>
          <p className="mt-2 text-3xl font-bold text-indigo-700">{ratings.data?.length ?? 0}</p>
        </Link>
        <Link to="/profile/favorites" className="surface-card p-5 transition hover:shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-500">Избранное</p>
          <p className="mt-2 text-3xl font-bold text-pink-700">{favorites.data?.length ?? 0}</p>
        </Link>
        <Link to="/profile/collections" className="surface-card p-5 transition hover:shadow-md">
          <p className="text-xs uppercase tracking-wide text-slate-500">Подборки</p>
          <p className="mt-2 text-3xl font-bold text-violet-700">{collections.data?.length ?? 0}</p>
        </Link>
      </section>

      <section className="surface-card p-6">
        <h2 className="text-xl">Быстрые действия</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/reviews/new" className="btn-soft">Новая рецензия</Link>
          <Link to="/articles/new" className="btn-soft">Новая статья</Link>
          <Link to="/admin" className="btn-soft">Перейти в админку</Link>
        </div>
      </section>
    </div>
  );
}
