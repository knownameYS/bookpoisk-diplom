import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api, getAccessToken, setAccessToken } from '../api/client';
import { ConfirmDialog } from './ConfirmDialog';
import { getCurrentUser } from '../features/profiles';

export function Layout() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(getAccessToken());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const deferredSearchValue = useDeferredValue(searchValue);

  const currentUserQuery = useQuery({
    queryKey: ['me'],
    enabled: isAuthenticated,
    queryFn: getCurrentUser
  });

  const searchResultsQuery = useQuery({
    queryKey: ['headerSearch', deferredSearchValue],
    enabled: deferredSearchValue.trim().length >= 2,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('query', deferredSearchValue.trim());
      params.set('limit', '6');
      params.set('sort', 'rating_desc');

      return (await api.get(`/books?${params.toString()}`)).data.items as Array<{
        id: string;
        title: string;
        authors?: Array<{ id: string; fullName: string }>;
      }>;
    }
  });

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await api.post('/auth/logout');
    } catch {
      // If the session is already gone, clearing local auth is still enough.
    } finally {
      setAccessToken(null);
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
      navigate('/');
    }
  }

  function submitSearch() {
    const query = searchValue.trim();

    if (!query) {
      navigate('/catalog');
      return;
    }

    navigate(`/catalog?q=${encodeURIComponent(query)}`);
    setSearchValue('');
  }

  const isAdmin = currentUserQuery.data?.role === 'ADMIN';
  const showSearchDropdown = deferredSearchValue.trim().length >= 2;
  const searchResults = searchResultsQuery.data ?? [];
  const navItems: Array<[string, string]> = [
    ['/', 'Главная'],
    ['/catalog', 'Каталог'],
    ['/profile', 'Профиль'],
    ...(isAdmin ? [['/admin', 'Админ'] as [string, string]] : [])
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[color:rgba(255,204,120,0.14)] bg-[color:rgba(20,14,11,0.78)] backdrop-blur-2xl">
        <div className="container-shell py-4">
          <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <Link to="/" className="group flex items-center gap-3">
              <div className="float-gentle flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:rgba(255,224,154,0.26)] bg-[linear-gradient(135deg,#a13a1f,#ee8746_62%,#ffd86f)] text-sm font-bold text-white shadow-[var(--shadow-sm)]">
                84
              </div>
              <div>
                <p className="text-lg font-semibold uppercase tracking-[0.12em] text-[color:var(--text)]">КНИГОПОИСК</p>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">книжный навигатор</p>
              </div>
            </Link>

            <div className="flex flex-col gap-4 lg:items-center lg:justify-between xl:flex-row">
              <nav className="hidden items-center gap-2 md:flex">
                {navItems.map(([to, label]) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => `tab-pill ${isActive ? 'tab-pill-active' : ''}`}
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>

              <div className="relative w-full max-w-2xl xl:ml-auto">
                <form
                  className="relative"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitSearch();
                  }}
                >
                  <input
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    className="input-modern min-h-12 pr-28"
                    placeholder="Поиск по названию и автору"
                  />
                  <button type="submit" className="btn-primary absolute right-1.5 top-1.5 px-4 py-2">
                    Найти
                  </button>
                </form>

                {showSearchDropdown ? (
                  <div className="surface-card absolute left-0 right-0 top-[calc(100%+10px)] z-50 overflow-hidden border-[color:rgba(255,220,120,0.18)]">
                    {searchResultsQuery.isLoading ? (
                      <div className="p-4 text-sm text-[color:var(--muted)]">Ищем книги...</div>
                    ) : searchResults.length ? (
                      <div className="grid">
                        {searchResults.map((book) => (
                          <Link
                            key={book.id}
                            to={`/books/${book.id}`}
                            onClick={() => setSearchValue('')}
                            className="border-b border-[color:rgba(255,220,120,0.08)] px-4 py-3 last:border-b-0 hover:bg-[color:rgba(255,248,238,0.05)]"
                          >
                            <p className="text-sm font-semibold text-[color:var(--text)]">{book.title}</p>
                            <p className="mt-1 text-xs text-[color:var(--muted)]">
                              {book.authors?.map((author) => author.fullName).join(', ') || 'Автор не указан'}
                            </p>
                          </Link>
                        ))}
                        <button
                          type="button"
                          onClick={submitSearch}
                          className="px-4 py-3 text-left text-sm text-[color:var(--accent)] hover:bg-[color:rgba(255,248,238,0.05)]"
                        >
                          Показать все результаты по запросу «{deferredSearchValue.trim()}»
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 text-sm text-[color:var(--muted)]">По этому запросу пока ничего не найдено</div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              {isAuthenticated ? (
                <>
                  <Link className="btn-soft" to="/profile">Профиль</Link>
                  <button
                    type="button"
                    onClick={() => setShowLogoutDialog(true)}
                    disabled={isLoggingOut}
                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isLoggingOut ? 'Выходим...' : 'Выйти'}
                  </button>
                </>
              ) : (
                <>
                  <Link className="btn-soft" to="/login">Войти</Link>
                  <Link className="btn-primary" to="/register">Регистрация</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container-shell page-reveal py-8 md:py-10">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-[color:rgba(255,204,120,0.12)] bg-[color:rgba(15,11,9,0.62)]">
        <div className="container-shell grid gap-10 py-10 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-lg font-semibold uppercase tracking-[0.12em] text-[color:var(--text)]">КНИГОПОИСК · 84</p>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[color:var(--muted)]">
              Тёплый книжный сервис с каталогом, личными полками и понятной системой оценивания
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">Разделы</p>
            <div className="mt-3 grid gap-2 text-sm text-[color:var(--muted)]">
              <Link to="/catalog">Каталог книг</Link>
              <Link to="/profile/library">Моя библиотека</Link>
              <Link to="/profile/my-ratings">Мои оценки</Link>
              <Link to="/formula-84">Формула оценивания</Link>
            </div>
          </div>
        </div>
      </footer>

      <ConfirmDialog
        open={showLogoutDialog}
        title="Выйти из профиля"
        description="Вы точно хотите выйти из аккаунта?"
        confirmLabel="Выйти"
        onCancel={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
        busy={isLoggingOut}
      />
    </div>
  );
}
