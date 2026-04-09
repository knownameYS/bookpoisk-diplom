import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function CatalogPage() {
  const { data, isLoading } = useQuery({ queryKey: ['books'], queryFn: async () => (await api.get('/books')).data });
  if (isLoading) return <div>Loading skeleton...</div>;
  if (!data?.length) return <div>Empty state: книг не найдено.</div>;
  return (
    <div className="grid gap-3">
      {data.map((b: any) => (
        <Link key={b.id} to={`/books/${b.id}`} className="rounded bg-white p-4 shadow hover:shadow-md">
          <div className="font-semibold">{b.title}</div>
          <div className="text-sm text-slate-600">Средний рейтинг: {b.avg_final_score} / 84 · {b.rating_count} оценок</div>
        </Link>
      ))}
    </div>
  );
}
