import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { RatingDrawer } from '../components/RatingDrawer';

export default function BookPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ['book', id], queryFn: async () => (await api.get(`/books/${id}`)).data });
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading book.</div>;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{data.title}</h1>
      <p className="text-slate-700">{data.description}</p>
      <div className="rounded bg-white p-4 shadow">
        <h2 className="font-semibold">Рейтинг</h2>
        <p>Средний итоговый рейтинг: {data.rating_stats.avg_final_score} / 84</p>
        <p>Количество оценок: {data.rating_stats.count}</p>
      </div>
      <RatingDrawer bookId={id} />
    </div>
  );
}
