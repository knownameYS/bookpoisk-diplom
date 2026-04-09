import { useState } from 'react';
import { calculateRating84 } from '../features/rating/rating84';
import { api } from '../api/client';

const criteria = [
  { key: 'architecture', title: 'Architecture', helper: 'Композиция, структура, ритм.' },
  { key: 'characters', title: 'Characters', helper: 'Глубина и развитие персонажей.' },
  { key: 'lang_style', title: 'Language', helper: 'Стиль, выразительность и точность.' },
  { key: 'idea', title: 'Idea', helper: 'Сила и новизна концепции.' },
  { key: 'vibe', title: 'Vibe', helper: 'Личное эмоциональное вовлечение.' }
] as const;

export function RatingDrawer({ bookId }: { bookId: string }) {
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState({ architecture: 7, characters: 7, lang_style: 7, idea: 7, vibe: 7 });
  const calc = calculateRating84(vals.architecture, vals.characters, vals.lang_style, vals.idea, vals.vibe);

  const submit = async () => {
    await api.post('/ratings', { book_id: bookId, ...vals });
    alert('Оценка сохранена');
    setOpen(false);
  };

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>Оценить по системе 84</button>
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 p-4 backdrop-blur-sm sm:p-8">
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="hero-gradient p-6 text-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold">Rating 84 Breakdown</h3>
                  <p className="mt-1 text-sm text-indigo-100">Сначала objectiveScore, затем vibe multiplier, затем финальный итог до 84.</p>
                </div>
                <button className="btn-soft border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => setOpen(false)}>Закрыть</button>
              </div>
            </div>

            <div className="grid flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[1.25fr_.9fr]">
              <section className="space-y-5">
                {criteria.map((item) => {
                  const key = item.key;
                  const value = vals[key];
                  return (
                    <div key={key} className="surface-card p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold">{item.title}</h4>
                          <p className="text-xs text-slate-500">{item.helper}</p>
                        </div>
                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-sm font-semibold text-indigo-700">{value}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={value}
                        onChange={(e) => setVals((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  );
                })}
              </section>

              <aside className="space-y-4">
                <div className="surface-card p-5">
                  <h4 className="text-sm font-semibold text-slate-900">Формула</h4>
                  <p className="mt-2 text-xs text-slate-600">objectiveScore = (Architecture + Characters + Language + Idea) × 1.4</p>
                  <p className="mt-1 text-xs text-slate-600">finalScore = min(84, round(objectiveScore × multiplier))</p>
                </div>

                <div className="surface-card space-y-3 p-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">objectiveScore</span>
                    <span className="font-semibold text-indigo-700">{calc.objectiveScore}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">multiplier</span>
                    <span className="font-semibold text-purple-700">× {calc.multiplier}</span>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-pink-50 p-4 text-center">
                    <p className="text-xs uppercase tracking-wide text-slate-500">finalScore</p>
                    <p className="mt-1 text-4xl font-bold text-slate-900">{calc.finalScore}<span className="text-base text-slate-400">/84</span></p>
                  </div>
                </div>

                <button onClick={submit} className="btn-primary w-full">Сохранить оценку</button>
              </aside>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
