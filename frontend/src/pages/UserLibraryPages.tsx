import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { BookCard } from '../components/ContentCards';

function ListShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="surface-card p-6">
        <h1 className="text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function MyRatingsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['myRatings'], queryFn: async () => (await api.get('/ratings/my/list')).data });
  return (
    <ListShell title="Мои оценки" subtitle="Ваши последние оценки по алгоритму 84.">
      {isLoading ? <div className="surface-card p-6">Загрузка…</div> : (
        <div className="surface-card p-6 text-sm text-slate-600">Записей: {data?.length ?? 0}</div>
      )}
    </ListShell>
  );
}

export function FavoritesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['favorites'], queryFn: async () => (await api.get('/favorites')).data });
  return (
    <ListShell title="Избранное" subtitle="Книги, которые вы сохранили в личный список.">
      {isLoading ? <div className="surface-card p-6">Загрузка…</div> : (
        <div className="grid gap-4">{(data ?? []).map((b: any) => <BookCard key={b.id} book={b} />)}</div>
      )}
    </ListShell>
  );
}

export function MyCollectionsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['myCollections'], queryFn: async () => (await api.get('/collections')).data });
  return (
    <ListShell title="Мои подборки" subtitle="Ваши приватные и публичные коллекции.">
      {isLoading ? <div className="surface-card p-6">Загрузка…</div> : (
        <div className="grid gap-3">{(data ?? []).map((c: any) => <div key={c.id} className="surface-card p-4">{c.title ?? `Подборка #${c.id}`}</div>)}</div>
      )}
    </ListShell>
  );
}

function EditorForm({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="surface-card p-6">
        <h1 className="text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Единый UI для создания/редактирования контента.</p>
      </div>
      <form className="surface-card space-y-4 p-6">
        <input className="input-modern" placeholder="Заголовок" />
        <input className="input-modern" placeholder="Краткое описание" />
        <textarea className="input-modern min-h-44" placeholder="Основной текст" />
        <div className="flex gap-2">
          <button type="button" className="btn-primary">Сохранить</button>
          <button type="button" className="btn-soft">Черновик</button>
        </div>
      </form>
    </div>
  );
}

export const CreateReviewPage = () => <EditorForm title="Новая рецензия" />;
export const EditReviewPage = () => <EditorForm title="Редактирование рецензии" />;
export const CreateArticlePage = () => <EditorForm title="Новая статья" />;
export const EditArticlePage = () => <EditorForm title="Редактирование статьи" />;
