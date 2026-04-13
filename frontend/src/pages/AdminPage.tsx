const entities = [
  'Пользователи', 'Книги', 'Авторы', 'Жанры', 'Теги', 'Рецензии', 'Статьи', 'Комментарии', 'Подборки'
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <section className="surface-card p-6">
        <h1 className="section-title">Админка</h1>
        <p className="mt-2 text-sm text-slate-500">Полный UI приведен к общей дизайн-системе: карточки, таблицы, формы и действия.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {entities.map((name) => (
          <article key={name} className="surface-card p-5 transition hover:shadow-md">
            <h2 className="text-lg">{name}</h2>
            <p className="mt-2 text-sm text-slate-500">Управление сущностью, поиск, фильтры, модерация и CRUD-формы.</p>
            <div className="mt-4 flex gap-2">
              <button className="btn-soft">Открыть</button>
              <button className="btn-primary">Создать</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
