import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { calculateRating84 } from '../features/rating/rating84';
import { api, getApiErrorMessage } from '../api/client';
import { useToast } from './ToastProvider';

const criteria = [
  { key: 'architecture', title: 'Композиция', helper: 'Структура, ритм и цельность повествования' },
  { key: 'characters', title: 'Персонажи', helper: 'Глубина, развитие и убедительность героев' },
  { key: 'language', title: 'Язык', helper: 'Стиль, точность и выразительность текста' },
  { key: 'idea', title: 'Идея', helper: 'Сила замысла и то, насколько книга держит смысл' },
  { key: 'vibe', title: 'Атмосфера', helper: 'Личное впечатление, послевкусие и эмоциональный отклик' }
] as const;

const MIN_REVIEW_LENGTH = 150;

export function RatingDrawer({ bookId }: { bookId: string }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewBody, setReviewBody] = useState('');
  const [vals, setVals] = useState({ architecture: 7, characters: 7, language: 7, idea: 7, vibe: 7 });
  const calc = calculateRating84(vals.architecture, vals.characters, vals.language, vals.idea, vals.vibe);

  const trimmedReview = reviewBody.trim();
  const reviewLength = trimmedReview.length;
  const hasReview = reviewLength > 0;
  const reviewTooShort = hasReview && reviewLength < MIN_REVIEW_LENGTH;

  const summaryCards = useMemo(
    () => [
      { label: 'Объективный балл', value: calc.objectiveScore.toString(), accent: false },
      { label: 'Множитель атмосферы', value: `× ${calc.multiplier}`, accent: true }
    ],
    [calc.multiplier, calc.objectiveScore]
  );

  async function submit() {
    if (reviewTooShort) {
      setErrorMessage(`Если вы добавляете рецензию, в ней должно быть не меньше ${MIN_REVIEW_LENGTH} символов`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.put(`/ratings/books/${bookId}/rating`, {
        ...vals,
        ...(hasReview ? { reviewBody: trimmedReview } : {})
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['book', bookId] }),
        queryClient.invalidateQueries({ queryKey: ['bookReviews', bookId] }),
        queryClient.invalidateQueries({ queryKey: ['myProfile'] }),
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['favorites'] }),
        queryClient.invalidateQueries({ queryKey: ['libraryShelves'] })
      ]);

      showToast({
        title: hasReview ? 'Оценка и рецензия сохранены' : 'Оценка сохранена',
        message: hasReview
          ? 'Новая рецензия уже появилась в блоке отзывов к книге.'
          : 'Средний балл книги обновился по системе 84.',
        variant: 'success'
      });
      setOpen(false);
      setReviewBody('');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Не удалось сохранить оценку'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>Оценить книгу</button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 backdrop-blur-sm sm:p-8">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[34px] border border-[color:rgba(255,209,102,0.14)] bg-[color:var(--background-soft)] shadow-[var(--shadow-lg)]">
            <div className="hero-gradient px-6 py-6 text-white md:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-3 text-xs uppercase tracking-[0.18em] text-orange-100/80">Редактор оценки</p>
                  <h3 className="text-3xl font-semibold">Оцените книгу по системе «84»</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-orange-100/78">
                    Выставьте баллы по пяти критериям и при желании добавьте короткую рецензию
                  </p>
                </div>
                <button className="btn-soft border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => setOpen(false)}>
                  Закрыть
                </button>
              </div>
            </div>

            <div className="grid flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="space-y-4">
                {criteria.map((item) => {
                  const key = item.key;
                  const value = vals[key];

                  return (
                    <div key={key} className="surface-card p-4">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-lg font-semibold text-[color:var(--text)]">{item.title}</h4>
                          <p className="mt-1 text-sm leading-7 text-[color:var(--muted)]">{item.helper}</p>
                        </div>
                        <span className="rounded-2xl bg-[color:var(--primary-soft)] px-3 py-1 text-sm font-semibold text-[color:var(--accent)]">
                          {value}
                        </span>
                      </div>

                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={value}
                        onChange={(event) => setVals((prev) => ({ ...prev, [key]: Number(event.target.value) }))}
                        className="w-full accent-[color:var(--primary)]"
                      />
                    </div>
                  );
                })}

                <div className="surface-card p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-[color:var(--text)]">Рецензия</h4>
                      <p className="mt-1 text-sm leading-7 text-[color:var(--muted)]">
                        Необязательно, но если пишете, то не меньше 150 символов
                      </p>
                    </div>
                    <span className={`rounded-2xl px-3 py-1 text-sm font-semibold ${reviewTooShort ? 'bg-[color:rgba(164,52,39,0.18)] text-[color:#ffbfaf]' : 'bg-[color:var(--primary-soft)] text-[color:var(--accent)]'}`}>
                      {reviewLength}
                    </span>
                  </div>

                  <textarea
                    value={reviewBody}
                    onChange={(event) => setReviewBody(event.target.value)}
                    className="textarea-modern mt-4 min-h-[180px]"
                    maxLength={5000}
                    placeholder="Напишите, что вас зацепило в книге, что сработало или не сработало, какие остались ощущения 🙂"
                  />
                </div>
              </section>

              <aside className="space-y-4">
                <div className="surface-panel space-y-4 p-5">
                  {summaryCards.map((card) => (
                    <div key={card.label} className="metric-pill">
                      <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">{card.label}</p>
                      <p className={`mt-2 text-3xl font-semibold ${card.accent ? 'text-[color:var(--accent)]' : 'text-[color:var(--text)]'}`}>
                        {card.value}
                      </p>
                    </div>
                  ))}

                  <div className="rounded-[28px] border border-[color:rgba(255,209,102,0.14)] bg-[linear-gradient(135deg,rgba(240,103,42,0.16),rgba(255,209,102,0.08))] p-6 text-center">
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Итоговый балл</p>
                    <p className="mt-2 text-5xl font-semibold text-[color:var(--text)]">
                      {calc.finalScore}
                      <span className="ml-1 text-base text-[color:var(--muted)]">/84</span>
                    </p>
                  </div>
                </div>

                {errorMessage ? (
                  <div className="rounded-2xl border border-[color:rgba(255,107,107,0.35)] bg-[color:rgba(255,107,107,0.08)] px-4 py-3 text-sm text-[color:#ffb3b3]">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  onClick={submit}
                  disabled={isSubmitting}
                  className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Сохраняем...' : hasReview ? 'Сохранить оценку и рецензию' : 'Сохранить оценку'}
                </button>
              </aside>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
