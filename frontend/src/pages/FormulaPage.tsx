export default function FormulaPage() {
  return (
    <div className="space-y-6">
      <section className="surface-panel p-6 md:p-8">
        <span className="section-kicker">Оценивание</span>
        <h1 className="section-title">Формула оценивания</h1>
        <p className="section-subtitle">
          Система «84» собирает итоговую оценку из четырёх основных критериев и одного личного ощущения от книги
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <article className="surface-card p-6">
          <h2 className="text-2xl font-semibold text-[color:var(--text)]">Как считается итог</h2>
          <div className="mt-5 space-y-4 text-sm leading-8 text-[color:var(--muted)]">
            <p>Сначала складываются оценки за композицию, персонажей, язык и идею</p>
            <p>Полученная сумма усиливается коэффициентом 1,4</p>
            <p>Затем результат умножается на поправку атмосферы</p>
            <p>Если атмосфера ниже пяти, итог немного снижается</p>
            <p>Если атмосфера выше пяти, итог немного растёт</p>
            <p>Максимальная итоговая оценка всегда ограничена значением 84</p>
          </div>
        </article>

        <article className="surface-card p-6">
          <h2 className="text-2xl font-semibold text-[color:var(--text)]">Что означают критерии</h2>
          <div className="mt-5 grid gap-3">
            <div className="metric-pill">
              <p className="text-sm font-semibold text-[color:var(--text)]">Композиция</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">Структура, ритм и цельность повествования</p>
            </div>
            <div className="metric-pill">
              <p className="text-sm font-semibold text-[color:var(--text)]">Персонажи</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">Глубина, развитие и убедительность героев</p>
            </div>
            <div className="metric-pill">
              <p className="text-sm font-semibold text-[color:var(--text)]">Язык</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">Стиль, точность и выразительность текста</p>
            </div>
            <div className="metric-pill">
              <p className="text-sm font-semibold text-[color:var(--text)]">Идея</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">Сила замысла и то, насколько книга держит смысл</p>
            </div>
            <div className="metric-pill">
              <p className="text-sm font-semibold text-[color:var(--text)]">Атмосфера</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">Личное впечатление, послевкусие и эмоциональный отклик</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
