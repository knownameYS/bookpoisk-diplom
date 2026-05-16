import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, unwrapItems } from '../api/client';
import { AiSearchPanel } from '../components/AiSearchPanel';
import { BookCard } from '../components/ContentCards';
import { resolveMediaUrl } from '../utils/media';

type NoveltyItem = {
  title: string;
  authors: string[];
  coverUrl?: string | null;
  avgFinalScore: number;
  ratingLabel?: string;
  bookId?: string | null;
};

const quotes = [
  { text: 'Чтобы дойти до цели, нужно прежде всего идти', author: 'Оноре де Бальзак' },
  { text: 'Даже в самые тёмные времена можно найти свет', author: 'Джоан Роулинг' },
  { text: 'Знание — единственное, что невозможно отнять', author: 'Рэй Брэдбери' },
  { text: 'Прыгай — и сеть появится', author: 'Джулия Кэмерон' }
];

function wrapIndex(index: number, total: number) {
  return ((index % total) + total) % total;
}

export default function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);

  const books = useQuery({
    queryKey: ['home-books'],
    queryFn: async () => unwrapItems((await api.get('/books?sort=rating_desc&limit=6')).data)
  });

  const noveltyQuery = useQuery({
    queryKey: ['home-novelty'],
    queryFn: async () => (await api.get('/books/novelty-feed')).data.items as NoveltyItem[]
  });

  useEffect(() => {
    if (!noveltyQuery.data?.length) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) => wrapIndex(current + 1, noveltyQuery.data.length));
    }, 5200);

    return () => window.clearInterval(interval);
  }, [noveltyQuery.data]);

  const noveltyItems = noveltyQuery.data ?? [];
  const currentNovelty = noveltyItems[activeIndex] ?? null;
  const noveltyHasRatings = (currentNovelty?.avgFinalScore ?? 0) > 0;

  const noveltySlots = useMemo(() => {
    if (!noveltyItems.length) {
      return [];
    }

    const slotDefinitions = [
      { offset: -2, className: 'novelty-card--left-2' },
      { offset: -1, className: 'novelty-card--left-1' },
      { offset: 0, className: 'novelty-card--center' },
      { offset: 1, className: 'novelty-card--right-1' },
      { offset: 2, className: 'novelty-card--right-2' }
    ];

    return slotDefinitions.map((slot) => {
      const index = wrapIndex(activeIndex + slot.offset, noveltyItems.length);

      return {
        ...slot,
        index,
        item: noveltyItems[index]
      };
    });
  }, [activeIndex, noveltyItems]);

  return (
    <div className="space-y-10 md:space-y-14">
      <section className="hero-gradient glow-shell relative overflow-hidden rounded-[34px] border border-[color:rgba(255,224,154,0.18)] px-6 py-8 shadow-[var(--shadow-lg)] sm:px-8 md:px-10 md:py-10">
        <div className="pointer-events-none absolute -left-10 top-8 h-32 w-32 rounded-full bg-[color:rgba(255,218,129,0.12)] blur-3xl float-gentle" />
        <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 rounded-full bg-[color:rgba(255,162,118,0.14)] blur-3xl drift-slow" />

        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <span className="section-kicker">Книжный сервис</span>
              <span className="warm-chip border border-[color:rgba(255,255,255,0.16)] bg-white/10 text-white">Рейтинг 84</span>
              <span className="warm-chip border border-[color:rgba(255,255,255,0.16)] bg-white/10 text-white">Живые профили</span>
            </div>

            <div>
              <h1 className="max-w-3xl text-3xl font-semibold leading-[1.08] text-white md:text-4xl xl:text-[3.45rem]">
                КНИГОПОИСК помогает находить книги под ваше настроение и интересы.
              </h1>
              <p className="mt-5 max-w-2xl text-[15px] leading-8 text-orange-50/92 md:text-base">
                Ищите книги по названию или автору, сохраняйте их на свои полки, ставьте оценки и пишите рецензии.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link className="btn-primary" to="/catalog">Открыть каталог</Link>
              <Link className="btn-soft border-white/20 bg-white/10 text-white hover:bg-white/16" to="/profile/library">
                Моя библиотека
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {quotes.map((quote, index) => (
              <article
                key={quote.text}
                className={`surface-card quote-card p-5 ${index % 2 === 0 ? 'float-gentle' : 'drift-slow'}`}
              >
                <p className="text-lg leading-8 text-[color:var(--text)]">«{quote.text}»</p>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[color:var(--accent)]">{quote.author}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-panel overflow-hidden p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="section-kicker">Новинки</span>
            <h2 className="section-title">Книжные новинки</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => noveltyItems.length && setActiveIndex((current) => wrapIndex(current - 1, noveltyItems.length))}
              className="btn-soft h-11 w-11 rounded-full px-0"
              disabled={!noveltyItems.length}
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => noveltyItems.length && setActiveIndex((current) => wrapIndex(current + 1, noveltyItems.length))}
              className="btn-soft h-11 w-11 rounded-full px-0"
              disabled={!noveltyItems.length}
            >
              →
            </button>
          </div>
        </div>

        {noveltySlots.length && currentNovelty ? (
          <>
            <div className="novelty-stage mt-8">
              {noveltySlots.map(({ item, className, index }) => {
                const coverUrl = resolveMediaUrl(item.coverUrl);
                const isCenter = className === 'novelty-card--center';

                return (
                  <button
                    key={`${item.title}-${index}`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`novelty-card ${className}`}
                    aria-label={`Показать книгу ${item.title}`}
                  >
                    <div className="novelty-card__media">
                      {coverUrl ? <img src={coverUrl} alt={item.title} className="novelty-card__image" /> : <div className="book-cover-fallback">Нет обложки</div>}
                    </div>
                    <div className="novelty-card__glow" />
                    {isCenter ? <div className="novelty-card__focus-ring" /> : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[28px] border border-[color:rgba(255,220,120,0.16)] bg-[color:rgba(255,248,238,0.04)] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--accent)]">Сейчас в центре</p>
              <h3 className="mt-3 text-2xl font-semibold text-[color:var(--text)]">{currentNovelty.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--muted)]">
                {currentNovelty.authors?.join(', ') || 'Автор не указан'}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="warm-chip">{noveltyHasRatings ? `${currentNovelty.avgFinalScore}/84` : 'Пока нет оценок'}</span>
                {currentNovelty.ratingLabel ? <span className="warm-chip">{currentNovelty.ratingLabel}</span> : null}
              </div>
              {currentNovelty.bookId ? (
                <div className="mt-5">
                  <Link to={`/books/${currentNovelty.bookId}`} className="btn-primary">
                    Открыть книгу
                  </Link>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="surface-card mt-6 p-6 text-sm text-[color:var(--muted)]">
            Новинки ещё загружаются
          </div>
        )}
      </section>

      <AiSearchPanel
        compact
        title="AI-поиск без сложных настроек"
        subtitle="Напишите, что хочется почитать, и получите короткую понятную подборку"
      />

      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="section-kicker">Подборка</span>
            <h2 className="section-title">Книги с высоким рейтингом</h2>
            <p className="section-subtitle">
              Здесь собраны книги, у которых высокий рейтинг и хороший шанс стать вашей следующей находкой
            </p>
          </div>
          <Link to="/catalog" className="btn-soft self-start">Смотреть весь каталог</Link>
        </div>
        <div className="grid gap-4">
          {(books.data ?? []).slice(0, 4).map((book: any) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>
    </div>
  );
}
