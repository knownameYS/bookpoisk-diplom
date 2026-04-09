import { Link, Outlet } from 'react-router-dom';

const links = [
  ['/', 'Главная'],
  ['/catalog', 'Каталог'],
  ['/login', 'Вход'],
  ['/register', 'Регистрация'],
  ['/profile', 'Профиль'],
  ['/admin', 'Админ']
];

export function Layout() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-6xl gap-4 p-4">
          {links.map(([to, label]) => (
            <Link key={to} to={to} className="text-sm font-medium text-slate-700 hover:text-blue-600">{label}</Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl p-6"><Outlet /></main>
    </div>
  );
}
