import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md">
      <div className="gradient-ring">
        <div className="rounded-2xl bg-white p-7 shadow-[var(--shadow-md)]">
          <h1 className="text-2xl">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6 space-y-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { register, handleSubmit } = useForm<{ email: string; password: string }>();
  return (
    <AuthShell title="Вход" subtitle="Продолжайте работу с библиотекой и вашими оценками.">
      <form onSubmit={handleSubmit(async (v) => { await api.post('/auth/login', v); alert('ok'); })} className="space-y-3">
        <input className="input-modern" placeholder="Email" {...register('email')} />
        <input type="password" className="input-modern" placeholder="Password" {...register('password')} />
        <button className="btn-primary w-full">Войти</button>
      </form>
      <p className="text-center text-sm text-slate-500">Нет аккаунта? <Link to="/register" className="text-indigo-600">Зарегистрироваться</Link></p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register, handleSubmit } = useForm<{ username: string; email: string; password: string }>();
  return (
    <AuthShell title="Регистрация" subtitle="Создайте профиль, чтобы вести рейтинг и подборки.">
      <form onSubmit={handleSubmit(async (v) => { await api.post('/auth/register', v); alert('created'); })} className="space-y-3">
        <input className="input-modern" placeholder="Username" {...register('username')} />
        <input className="input-modern" placeholder="Email" {...register('email')} />
        <input type="password" className="input-modern" placeholder="Password" {...register('password')} />
        <button className="btn-primary w-full">Создать аккаунт</button>
      </form>
      <p className="text-center text-sm text-slate-500">Уже есть аккаунт? <Link to="/login" className="text-indigo-600">Войти</Link></p>
    </AuthShell>
  );
}
