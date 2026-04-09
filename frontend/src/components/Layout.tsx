import { Link, NavLink, Outlet } from 'react-router-dom';

const nav = [
  ['/', 'Главная'],
  ['/catalog', 'Каталог'],
  ['/collections', 'Подборки'],
  ['/profile', 'Профиль'],
  ['/admin', 'Админка']
];

export function Layout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/80 backdrop-blur-xl">
        <div className="container-shell flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-pink-500 text-sm font-bold text-white">84</div>
            <div>
              <p className="text-sm font-semibold">Bookpoisk</p>
              <p className="text-xs text-slate-500">literary intelligence</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `tab-pill ${isActive ? 'tab-pill-active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link className="btn-soft" to="/login">Войти</Link>
            <Link className="btn-primary" to="/register">Регистрация</Link>
          </div>
        </div>
      </header>

      <main className="container-shell py-8"><Outlet /></main>

      <footer className="mt-12 border-t bg-white/80">
        <div className="container-shell grid gap-8 py-10 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold">Bookpoisk · Rating 84</p>
            <p className="mt-2 text-sm text-slate-500">Современный сервис оценки книг с прозрачной методологией.</p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Разделы</p>
            <div className="grid gap-2 text-sm text-slate-600">
              <Link to="/catalog">Каталог книг</Link>
              <Link to="/collections">Публичные подборки</Link>
              <Link to="/profile/my-ratings">Мои оценки</Link>
            </div>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold">Контур продукта</p>
            <p className="text-sm text-slate-500">Интерфейс приведен к единой дизайн-системе с индиго-пурпурной палитрой, карточками и акцентной типографикой.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
