import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { BookCard, TextCard } from '../components/ContentCards';

export default function HomePage() {
  const books = useQuery({ queryKey: ['home-books'], queryFn: async () => (await api.get('/books')).data });

  return (
    <div className="space-y-10">
      <section className="hero-gradient overflow-hidden rounded-2xl px-6 py-14 text-white shadow-[var(--shadow-lg)] sm:px-12">
        <div className="max-w-3xl">
          <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs">Новая литературная экосистема</p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Оценивайте книги честно: мастерство + эмоция по алгоритму «84».</h1>
          <p className="mt-4 text-indigo-100">Единый UX для каталога, карточек и профильных разделов. Объективная структура оценки и визуально ясный breakdown.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="btn-soft border-none bg-white text-indigo-700 hover:bg-indigo-50" to="/catalog">Открыть каталог</Link>
            <Link className="btn-soft border-white/25 bg-white/10 text-white hover:bg-white/20" to="/collections">Смотреть подборки</Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-3xl">Книги недели</h2>
            <p className="text-sm text-slate-500">Карточки полностью в новом стиле референса.</p>
          </div>
          <Link to="/catalog" className="btn-soft">Все книги</Link>
        </div>
        <div className="grid gap-4">
          {(books.data ?? []).slice(0, 4).map((book: any) => <BookCard key={book.id} book={book} />)}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <TextCard title="Как работает рейтинг 84" subtitle="Методология" excerpt="Architecture, Characters, Language, Idea формируют objectiveScore, а Vibe задает multiplier для finalScore." to="/articles/84-method" label="Статья" />
        <TextCard title="Глубокие рецензии" subtitle="Редакция" excerpt="Структурированные критические материалы с единой визуальной подачей и акцентом на критерии." to="/reviews/spotlight" label="Рецензия" />
        <TextCard title="Публичные подборки" subtitle="Комьюнити" excerpt="Собирайте и публикуйте списки книг: для старта в жанре, для сезона или по авторским темам." to="/collections" label="Подборка" />
      </section>
    </div>
  );
}
