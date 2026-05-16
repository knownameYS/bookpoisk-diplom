import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

function PageShell({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return (
    <div className="space-y-6">
      <section className="surface-panel p-6">
        <span className="section-kicker">Редакционная страница</span>
        <h1 className="section-title">{title}</h1>
        <p className="section-subtitle">{subtitle}</p>
      </section>
      {children}
    </div>
  );
}

export const ArticlePage = () => (
  <PageShell
    title="Статья"
    subtitle="Здесь будет большое спокойное чтение с выразительной типографикой, связанными книгами и контекстом."
  >
    <article className="surface-card p-6 text-sm leading-8 text-[color:var(--muted)]">
      Страница статьи уже подготовлена как отдельный формат чтения. Следующим шагом сюда можно подключить полноценный текст, связанные книги и обсуждение.
    </article>
  </PageShell>
);

export const ReviewPage = () => (
  <PageShell
    title="Рецензия"
    subtitle="Здесь будет авторский разбор книги с крупными смысловыми блоками, комментариями и спокойным ритмом чтения."
  >
    <article className="surface-card p-6 text-sm leading-8 text-[color:var(--muted)]">
      Страница рецензии оформлена как отдельный читательский слой. Сюда можно вывести полный текст, комментарии и сопутствующие материалы по книге.
    </article>
  </PageShell>
);

export const NotFoundPage = () => (
  <PageShell title="404" subtitle="Эта страница не найдена или больше не используется.">
    <Link to="/" className="btn-primary">Вернуться на главную</Link>
  </PageShell>
);
