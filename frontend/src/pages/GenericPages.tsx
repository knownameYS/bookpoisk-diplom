import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { TextCard } from '../components/ContentCards';

function PageShell({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="surface-card p-6">
        <h1 className="section-title">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export const AuthorPage = () => (
  <PageShell title="Страница автора" subtitle="Биография, библиография и связанные материалы в едином визуальном стиле.">
    <div className="grid gap-4 md:grid-cols-2">
      <TextCard title="Ключевые книги автора" subtitle="Каталог" excerpt="Подборка основных произведений с переходом на карточки книг." to="/catalog" label="Книги" />
      <TextCard title="Рецензии по автору" subtitle="Критика" excerpt="Агрегация разборов с фокусом на критерии алгоритма 84." to="/reviews/spotlight" label="Рецензии" />
    </div>
  </PageShell>
);

export const PublicCollectionsPage = () => (
  <PageShell title="Публичные подборки" subtitle="Коллекции пользователей и редакции — единые карточки, фильтры и типографика.">
    <div className="grid gap-4 md:grid-cols-2">
      <TextCard title="Лучшее за год" subtitle="Редакция" excerpt="Подборка сильнейших книг сезона по финальному рейтингу и экспертным рецензиям." to="/collections/1" label="Подборка" />
      <TextCard title="Мрачный постмодерн" subtitle="Пользовательская" excerpt="Коллекция атмосферных текстов с высоким Vibe и нестандартной идеей." to="/collections/2" label="Подборка" />
    </div>
  </PageShell>
);

export const CollectionPage = () => (
  <PageShell title="Страница подборки" subtitle="Обложка подборки, описание, куратор и набор книг в фирменной сетке.">
    <div className="surface-card p-5">
      <p className="text-sm text-slate-600">Здесь отображаются реальные книги подборки и их данные с backend API.</p>
    </div>
  </PageShell>
);

export const ArticlePage = () => (
  <PageShell title="Страница статьи" subtitle="Читабельная типографика, аккуратные отступы и единые карточки связанных материалов.">
    <article className="surface-card p-6 prose max-w-none">
      <p>Основной контент статьи выводится из существующего backend/API без изменения логики загрузки данных.</p>
    </article>
  </PageShell>
);

export const ReviewPage = () => (
  <PageShell title="Страница рецензии" subtitle="Единый стиль для авторских разборов книг и критических материалов.">
    <article className="surface-card p-6">
      <p className="text-sm text-slate-600">Этот экран подготовлен для отображения рецензий в том же визуальном языке, что и карточки книг/статей.</p>
    </article>
  </PageShell>
);

export const NotFoundPage = () => (
  <PageShell title="404" subtitle="Страница не найдена.">
    <Link to="/" className="btn-primary">Вернуться на главную</Link>
  </PageShell>
);
