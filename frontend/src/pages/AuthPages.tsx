import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api, getAccessToken, getApiErrorMessage, setAccessToken } from '../api/client';
import { GenrePicker, CitySelect } from '../components/ProfilePreferenceInputs';
import { joinFavoriteGenres, SUPPORT_EMAIL } from '../constants/profile-options';

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  wide?: boolean;
};

type LoginValues = {
  email: string;
  password: string;
};

type RegisterValues = {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  birthDate?: string;
  city?: string;
  favoriteGenres?: string;
};

function AuthShell({ title, subtitle, children, wide = false }: AuthShellProps) {
  return (
    <div className={`auth-shell mx-auto w-full ${wide ? 'max-w-4xl' : 'max-w-xl'}`}>
      <div className="gradient-ring">
        <div className="auth-shell__panel glow-shell rounded-[32px] p-7 shadow-[var(--shadow-lg)] md:p-9">
          <span className="section-kicker">Доступ</span>
          <h1 className="auth-shell__title">{title}</h1>
          <p className="auth-shell__subtitle">{subtitle}</p>
          <div className="mt-8 space-y-5">{children}</div>
          <div className="auth-shell__support">
            <span>Есть вопросы?</span>{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="support-link">
              {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<LoginValues>();

  if (getAccessToken()) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <AuthShell
      title="Возвращение в КнигоПоиск"
      subtitle="Войдите в профиль, чтобы продолжить собирать свою библиотеку, сохранять сильные находки и вести читательский маршрут."
    >
      <form
        onSubmit={handleSubmit(async (values) => {
          setSubmitError(null);

          try {
            const response = await api.post('/auth/login', values);
            setAccessToken(response.data.accessToken ?? null);
            navigate('/profile');
          } catch (error) {
            setSubmitError(getApiErrorMessage(error, 'Не удалось войти. Проверьте email и пароль.'));
          }
        })}
        className="auth-shell__form auth-shell__form--compact"
      >
        {submitError ? (
          <div
            role="alert"
            className="rounded-2xl border border-[color:rgba(255,107,107,0.35)] bg-[color:rgba(255,107,107,0.08)] px-4 py-3 text-sm text-[color:#ffb3b3]"
          >
            {submitError}
          </div>
        ) : null}
        <input className="input-modern" placeholder="Email" autoComplete="email" {...register('email')} />
        <input
          type="password"
          className="input-modern"
          placeholder="Пароль"
          autoComplete="current-password"
          {...register('password')}
        />
        <button disabled={isSubmitting} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70">
          {isSubmitting ? 'Проверяем данные...' : 'Войти'}
        </button>
      </form>
      <p className="text-center text-sm text-[color:var(--muted)]">
        Нет аккаунта?{' '}
        <Link to="/register" className="font-semibold text-[color:var(--accent)]">
          Зарегистрироваться
        </Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting }
  } = useForm<RegisterValues>();
  const maxBirthDate = new Date().toISOString().slice(0, 10);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  function toggleGenre(genre: string) {
    setSelectedGenres((current) => {
      const next = current.includes(genre) ? current.filter((item) => item !== genre) : [...current, genre];
      setValue('favoriteGenres', joinFavoriteGenres(next), { shouldDirty: true });
      return next;
    });
  }

  if (getAccessToken()) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <AuthShell
      wide
      title="Создайте живой читательский профиль"
      subtitle="Кроме логина и пароля можно сразу добавить личные детали: как вас зовут, из какого вы города и какие жанры вы ищете в книгах чаще всего."
    >
      <form
        onSubmit={handleSubmit(async (values) => {
          setSubmitError(null);

          try {
            await api.post('/auth/register', values);
            const loginResponse = await api.post('/auth/login', { email: values.email, password: values.password });
            setAccessToken(loginResponse.data.accessToken ?? null);
            navigate('/profile');
          } catch (error) {
            setSubmitError(getApiErrorMessage(error, 'Не удалось создать аккаунт. Попробуйте ещё раз.'));
          }
        })}
        className="auth-shell__form auth-shell__form--wide"
      >
        {submitError ? (
          <div
            role="alert"
            className="rounded-2xl border border-[color:rgba(255,107,107,0.35)] bg-[color:rgba(255,107,107,0.08)] px-4 py-3 text-sm text-[color:#ffb3b3] md:col-span-2"
          >
            {submitError}
          </div>
        ) : null}
        <input
          className="input-modern"
          placeholder="Имя пользователя"
          autoComplete="username"
          maxLength={30}
          {...register('username')}
        />
        <input className="input-modern" placeholder="Email" autoComplete="email" {...register('email')} />
        <input
          className="input-modern"
          placeholder="ФИО"
          autoComplete="name"
          maxLength={120}
          {...register('fullName')}
        />
        <CitySelect autoComplete="address-level2" {...register('city')} />
        <input
          type="date"
          className="input-modern"
          max={maxBirthDate}
          aria-label="Дата рождения"
          {...register('birthDate')}
        />
        <input
          type="password"
          className="input-modern md:col-span-2"
          placeholder="Пароль"
          autoComplete="new-password"
          {...register('password')}
        />
        <input type="hidden" {...register('favoriteGenres')} />
        <GenrePicker
          className="md:col-span-2"
          selectedGenres={selectedGenres}
          onToggle={toggleGenre}
          hint="Выберите несколько направлений, которые вам интересны больше всего."
        />
        <p className="auth-shell__hint md:col-span-2">
          Эти поля можно будет изменить позже в профиле. Пароль должен содержать минимум 8 символов, заглавную букву и цифру.
        </p>
        <button
          disabled={isSubmitting}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70 md:col-span-2"
        >
          {isSubmitting ? 'Создаём аккаунт...' : 'Создать аккаунт'}
        </button>
      </form>
      <p className="text-center text-sm text-[color:var(--muted)]">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="font-semibold text-[color:var(--accent)]">
          Войти
        </Link>
      </p>
    </AuthShell>
  );
}
