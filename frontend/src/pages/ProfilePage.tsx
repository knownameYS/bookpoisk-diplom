import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export default function ProfilePage() {
  const ratings = useQuery({ queryKey: ['myRatings'], queryFn: async () => (await api.get('/ratings/my/list')).data });
  const favorites = useQuery({ queryKey: ['favorites'], queryFn: async () => (await api.get('/favorites')).data });
  const collections = useQuery({ queryKey: ['collections'], queryFn: async () => (await api.get('/collections')).data });

  return (
    <div className="space-y-4">
      <div className="rounded bg-white p-4 shadow">Мои оценки: {ratings.data?.length ?? 0}</div>
      <div className="rounded bg-white p-4 shadow">Избранное: {favorites.data?.length ?? 0}</div>
      <div className="rounded bg-white p-4 shadow">Подборки: {collections.data?.length ?? 0}</div>
    </div>
  );
}
