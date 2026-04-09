import { useState } from 'react';
import { calculateRating84 } from '../features/rating/rating84';
import { api } from '../api/client';

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
    <div>
      <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={() => setOpen(true)}>Оценить книгу</button>
      {open && (
        <div className="fixed inset-0 bg-black/40 p-8">
          <div className="mx-auto max-w-xl rounded bg-white p-4">
            <h3 className="mb-3 text-lg font-semibold">Алгоритм 84</h3>
            {Object.keys(vals).map((k) => (
              <label key={k} className="mb-2 block text-sm">
                {k}: {vals[k as keyof typeof vals]}
                <input type="range" min={1} max={10} value={vals[k as keyof typeof vals]}
                  onChange={(e) => setVals((prev) => ({ ...prev, [k]: Number(e.target.value) }))}
                  className="w-full" />
              </label>
            ))}
            <div className="rounded bg-slate-50 p-3 text-sm">
              <div>objectiveScore: {calc.objectiveScore}</div>
              <div>multiplier: {calc.multiplier}</div>
              <div className="font-semibold">finalScore: {calc.finalScore}/84</div>
            </div>
            <p className="mt-2 text-xs text-slate-600">finalScore = min(84, round((A+C+L+I)*1.4*vibeMultiplier))</p>
            <div className="mt-4 flex gap-2">
              <button onClick={submit} className="rounded bg-blue-600 px-3 py-2 text-white">Сохранить</button>
              <button onClick={() => setOpen(false)} className="rounded border px-3 py-2">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
