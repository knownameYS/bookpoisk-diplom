import { useForm } from 'react-hook-form';
import { api } from '../api/client';

export function LoginPage() {
  const { register, handleSubmit } = useForm<{ email: string; password: string }>();
  return (
    <form onSubmit={handleSubmit(async (v) => { await api.post('/auth/login', v); alert('ok'); })} className="max-w-sm space-y-2 rounded bg-white p-4 shadow">
      <input className="w-full rounded border p-2" placeholder="Email" {...register('email')} />
      <input type="password" className="w-full rounded border p-2" placeholder="Password" {...register('password')} />
      <button className="rounded bg-blue-600 px-3 py-2 text-white">Войти</button>
    </form>
  );
}

export function RegisterPage() {
  const { register, handleSubmit } = useForm<{ username: string; email: string; password: string }>();
  return (
    <form onSubmit={handleSubmit(async (v) => { await api.post('/auth/register', v); alert('created'); })} className="max-w-sm space-y-2 rounded bg-white p-4 shadow">
      <input className="w-full rounded border p-2" placeholder="Username" {...register('username')} />
      <input className="w-full rounded border p-2" placeholder="Email" {...register('email')} />
      <input type="password" className="w-full rounded border p-2" placeholder="Password" {...register('password')} />
      <button className="rounded bg-blue-600 px-3 py-2 text-white">Создать аккаунт</button>
    </form>
  );
}
