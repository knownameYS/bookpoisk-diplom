import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, getAccessToken, getApiErrorMessage } from '../api/client';
import { CitySelect, GenrePicker } from '../components/ProfilePreferenceInputs';
import { BookCard } from '../components/ContentCards';
import { RadarChart } from '../components/RadarChart';
import { joinFavoriteGenres, parseFavoriteGenres } from '../constants/profile-options';
import { resolveMediaUrl } from '../utils/media';
import { formatBirthDate } from '../utils/profile';
import { getFavorites } from '../features/library';
import {
  discoverProfiles,
  followProfile,
  getOwnProfile,
  type PublicProfile,
  unfollowProfile,
  uploadOwnAvatar,
  updateOwnProfile
} from '../features/profiles';

function initials(value: string) {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function Avatar({
  username,
  avatarUrl,
  size = 'large'
}: {
  username: string;
  avatarUrl?: string | null;
  size?: 'large' | 'small';
}) {
  const className = size === 'large' ? 'h-24 w-24 text-2xl' : 'h-12 w-12 text-sm';

  if (avatarUrl) {
    return (
      <img
        src={resolveMediaUrl(avatarUrl) ?? undefined}
        alt={username}
        className={`${className} rounded-3xl border border-[color:rgba(255,226,160,0.22)] object-cover shadow-[var(--shadow-sm)]`}
      />
    );
  }

  return (
    <div
      className={`${className} flex items-center justify-center rounded-3xl border border-[color:rgba(255,226,160,0.22)] bg-[color:rgba(255,248,238,0.08)] font-semibold text-[color:var(--text)] shadow-[var(--shadow-sm)]`}
    >
      {initials(username)}
    </div>
  );
}

function SettingToggle({
  checked,
  onChange,
  label,
  hint
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="surface-card flex items-start justify-between gap-4 p-4">
      <div>
        <p className="text-sm font-semibold text-[color:var(--text)]">{label}</p>
        <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{hint}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 accent-[color:var(--accent)]"
      />
    </label>
  );
}

function ProfileBackdrop({ profile }: { profile: PublicProfile }) {
  const covers = profile.featuredBooks.slice(0, 5);
  const coverLayoutClasses = [
    'profile-shelf-card--center',
    'profile-shelf-card--left-1',
    'profile-shelf-card--right-1',
    'profile-shelf-card--left-2',
    'profile-shelf-card--right-2'
  ];

  return (
    <div className="profile-backdrop absolute inset-0 overflow-hidden">
      <div className="profile-backdrop__mesh" />
      <div className="profile-backdrop__halo profile-backdrop__halo--left" />
      <div className="profile-backdrop__halo profile-backdrop__halo--right" />
      <div className="profile-backdrop__grain" />
      {covers.length ? (
        <div className="profile-shelf-stage" aria-hidden="true">
          {covers.map((book, index) => (
            <div key={book.id} className={`profile-shelf-card ${coverLayoutClasses[index] ?? 'profile-shelf-card--right-2'}`}>
              <div className="profile-shelf-card__inner">
                <div className="profile-shelf-card__sheen" />
                {book.coverUrl ? (
                  <img
                    src={resolveMediaUrl(book.coverUrl) ?? undefined}
                    alt={book.title}
                    className="profile-shelf-card__image"
                  />
                ) : (
                  <div className="profile-shelf-card__fallback">Нет обложки</div>
                )}
                <div className="profile-shelf-card__shadow" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {false ? (
        <>
        {covers.map((book, index) => (
          <div
            key={book.id}
            className="book-cover-frame relative aspect-[3/4] self-end opacity-70"
            style={{
              transform: `translateY(${index * 10}px)`
            }}
          >
            {book.coverUrl ? (
              <img src={resolveMediaUrl(book.coverUrl) ?? undefined} alt={book.title} className="book-cover-image" />
            ) : (
              <div className="book-cover-fallback">Нет обложки</div>
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,15,12,0.15),rgba(21,15,12,0.75))]" />
          </div>
        ))}
        </>
      ) : null}
      <div className="profile-backdrop__fade" />
    </div>
  );
}

function RatingOverview({ profile }: { profile: PublicProfile }) {
  const axes = [
    { label: 'Композиция', value: profile.ratingAverages.architecture },
    { label: 'Персонажи', value: profile.ratingAverages.characters },
    { label: 'Язык', value: profile.ratingAverages.language },
    { label: 'Идея', value: profile.ratingAverages.idea },
    { label: 'Атмосфера', value: profile.ratingAverages.vibe }
  ];

  return (
    <section className="surface-card p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Мой вкус</p>
      <h2 className="mt-2 text-2xl font-semibold">Средние оценки по всем прочитанным книгам</h2>
      <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr] xl:items-center">
        <RadarChart axes={axes} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="metric-pill">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Композиция</p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--accent)]">{profile.ratingAverages.architecture.toFixed(1)}</p>
          </div>
          <div className="metric-pill">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Персонажи</p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--accent)]">{profile.ratingAverages.characters.toFixed(1)}</p>
          </div>
          <div className="metric-pill">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Язык</p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--accent)]">{profile.ratingAverages.language.toFixed(1)}</p>
          </div>
          <div className="metric-pill">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Идея</p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--accent)]">{profile.ratingAverages.idea.toFixed(1)}</p>
          </div>
          <div className="metric-pill sm:col-span-2">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Общий балл пользователя</p>
            <p className="mt-2 text-2xl font-semibold text-[color:var(--accent)]">{profile.ratingAverages.finalScore.toFixed(1)}/84</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const isAuthenticated = Boolean(getAccessToken());
  const [formState, setFormState] = useState({
    username: '',
    email: '',
    fullName: '',
    birthDate: '',
    city: '',
    favoriteGenres: '',
    bio: '',
    showRatings: true,
    showReviews: true,
    showFavorites: true,
    showLibrary: true,
    featuredBookIds: [] as string[]
  });
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewDraft, setReviewDraft] = useState({ title: '', body: '' });
  const [isFeaturedBooksPickerOpen, setIsFeaturedBooksPickerOpen] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['myProfile'],
    queryFn: getOwnProfile,
    enabled: isAuthenticated
  });

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: isAuthenticated
  });

  const discoverQuery = useQuery({
    queryKey: ['discoverProfiles'],
    queryFn: () => discoverProfiles(''),
    enabled: isAuthenticated
  });

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setFormState({
      username: profileQuery.data.username,
      email: profileQuery.data.email ?? '',
      fullName: profileQuery.data.fullName ?? '',
      birthDate: profileQuery.data.birthDate ?? '',
      city: profileQuery.data.city ?? '',
      favoriteGenres: profileQuery.data.favoriteGenres ?? '',
      bio: profileQuery.data.bio ?? '',
      showRatings: profileQuery.data.settings?.showRatings ?? true,
      showReviews: profileQuery.data.settings?.showReviews ?? true,
      showFavorites: profileQuery.data.settings?.showFavorites ?? true,
      showLibrary: profileQuery.data.settings?.showLibrary ?? true,
      featuredBookIds: profileQuery.data.featuredBooks.map((book) => book.id)
    });
  }, [profileQuery.data]);

  const saveProfileMutation = useMutation({
    mutationFn: async () =>
      updateOwnProfile({
        username: formState.username.trim(),
        email: formState.email.trim(),
        fullName: formState.fullName.trim() || null,
        birthDate: formState.birthDate || null,
        city: formState.city.trim() || null,
        favoriteGenres: formState.favoriteGenres.trim() || null,
        bio: formState.bio.trim() || null,
        showRatings: formState.showRatings,
        showReviews: formState.showReviews,
        showFavorites: formState.showFavorites,
        showLibrary: formState.showLibrary,
        featuredBookIds: formState.featuredBookIds
      }),
    onSuccess: async () => {
      setSubmitMessage('Профиль обновлён');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['myProfile'] }),
        queryClient.invalidateQueries({ queryKey: ['me'] })
      ]);
    },
    onError: (error) => {
      setSubmitMessage(getApiErrorMessage(error, 'Не удалось сохранить профиль'));
    }
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAvatarFile) {
        throw new Error('Сначала выберите изображение');
      }

      return uploadOwnAvatar(selectedAvatarFile);
    },
    onSuccess: async () => {
      setSelectedAvatarFile(null);
      setSubmitMessage('Аватар обновлён');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['myProfile'] }),
        queryClient.invalidateQueries({ queryKey: ['me'] })
      ]);
    },
    onError: (error) => {
      setSubmitMessage(getApiErrorMessage(error, 'Не удалось загрузить аватар'));
    }
  });

  const followMutation = useMutation({
    mutationFn: async ({ username, isFollowing }: { username: string; isFollowing: boolean }) =>
      isFollowing ? unfollowProfile(username) : followProfile(username),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['discoverProfiles'] }),
        queryClient.invalidateQueries({ queryKey: ['myProfile'] })
      ]);
    }
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, title, body }: { id: string; title: string; body: string }) =>
      (await api.patch(`/reviews/${id}`, { title, body })).data,
    onSuccess: async () => {
      setEditingReviewId(null);
      setReviewDraft({ title: '', body: '' });
      setSubmitMessage('Рецензия обновлена');
      await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
    onError: (error) => {
      setSubmitMessage(getApiErrorMessage(error, 'Не удалось обновить рецензию'));
    }
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/reviews/${id}`);
    },
    onSuccess: async () => {
      if (editingReviewId) {
        setEditingReviewId(null);
        setReviewDraft({ title: '', body: '' });
      }
      setSubmitMessage('Рецензия удалена');
      await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
    onError: (error) => {
      setSubmitMessage(getApiErrorMessage(error, 'Не удалось удалить рецензию'));
    }
  });

  const profile = profileQuery.data;
  const favoriteBooks = (favoritesQuery.data ?? []).map((item: any) => item.book);
  const shelfSummary = useMemo(() => profile?.shelfSummary ?? [], [profile]);
  const formattedBirthDate = formatBirthDate(profile?.birthDate ?? null);
  const selectedGenres = useMemo(() => parseFavoriteGenres(formState.favoriteGenres), [formState.favoriteGenres]);
  const selectedFeaturedBooks = useMemo(
    () => favoriteBooks.filter((book: any) => formState.featuredBookIds.includes(book.id)),
    [favoriteBooks, formState.featuredBookIds]
  );
  const featuredBooksPreview = useMemo(() => selectedFeaturedBooks.slice(0, 4), [selectedFeaturedBooks]);

  function toggleFeaturedBookSelection(bookId: string) {
    setFormState((current) => {
      if (current.featuredBookIds.includes(bookId)) {
        return {
          ...current,
          featuredBookIds: current.featuredBookIds.filter((id) => id !== bookId)
        };
      }

      if (current.featuredBookIds.length >= 5) {
        return current;
      }

      return {
        ...current,
        featuredBookIds: [...current.featuredBookIds, bookId]
      };
    });
  }

  function toggleGenre(genre: string) {
    setFormState((current) => {
      const currentGenres = parseFavoriteGenres(current.favoriteGenres);
      const nextGenres = currentGenres.includes(genre)
        ? currentGenres.filter((item) => item !== genre)
        : [...currentGenres, genre];

      return {
        ...current,
        favoriteGenres: joinFavoriteGenres(nextGenres)
      };
    });
  }

  if (!isAuthenticated) {
    return (
      <section className="surface-panel p-6 md:p-8">
        <span className="section-kicker">Профиль</span>
        <h1 className="section-title">Читательский профиль</h1>
        <p className="section-subtitle">
          Войдите в аккаунт, чтобы редактировать профиль, собирать витрину любимых книг и следить за другими читателями
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/login" className="btn-primary">Войти</Link>
          <Link to="/register" className="btn-soft">Создать аккаунт</Link>
        </div>
      </section>
    );
  }

  if (!profile) {
    return <div className="surface-card p-6 text-sm text-[color:var(--muted)]">Загружаем профиль...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="surface-panel relative min-h-[21rem] overflow-hidden p-0 md:min-h-[24rem]">
        <ProfileBackdrop profile={profile} />
        <div className="relative z-10 grid gap-6 p-6 md:grid-cols-[auto_1fr] md:p-8">
          <Avatar username={profile.username} avatarUrl={profile.avatarUrl} />
          <div className="space-y-4 md:pr-[13rem] lg:pr-[18rem] xl:pr-[24rem]">
            <div>
              <span className="section-kicker">Мой профиль</span>
              <h1 className="section-title">{profile.username}</h1>
              {profile.fullName ? (
                <p className="mt-2 text-lg font-medium text-[color:var(--muted-strong)]">{profile.fullName}</p>
              ) : null}
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                {profile.bio || 'Пока без описания'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-[color:var(--muted-strong)]">
              {formattedBirthDate ? <span className="warm-chip">Дата рождения: {formattedBirthDate}</span> : null}
              {profile.city ? <span className="warm-chip">{profile.city}</span> : null}
              {profile.favoriteGenres ? <span className="warm-chip">Любимые жанры: {profile.favoriteGenres}</span> : null}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-[color:var(--muted-strong)]">
              <span className="warm-chip">{profile.email}</span>
              <span className="warm-chip">{profile.followersCount} подписчиков</span>
              <span className="warm-chip">{profile.followingCount} подписок</span>
              <span className="warm-chip">{profile.ratingsCount} оценок</span>
              <span className="warm-chip">{profile.reviewsCount} рецензий</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              {shelfSummary.map((shelf) => (
                <Link
                  key={shelf.key}
                  to={`/profile/library?tab=${shelf.key}`}
                  className="metric-pill hover:border-[color:rgba(255,220,120,0.24)]"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">{shelf.title}</p>
                  <p className="mt-2 text-2xl font-semibold text-[color:var(--accent)]">{shelf.bookCount}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <section className="surface-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Настройки профиля</p>
                <h2 className="mt-2 text-2xl font-semibold">Оформление и личные данные</h2>
              </div>
              <button
                type="button"
                onClick={() => saveProfileMutation.mutate()}
                disabled={saveProfileMutation.isPending}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saveProfileMutation.isPending ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </div>

            {submitMessage ? (
              <div className="mt-4 rounded-2xl border border-[color:rgba(255,220,120,0.2)] bg-[color:rgba(255,248,238,0.05)] px-4 py-3 text-sm text-[color:var(--muted-strong)]">
                {submitMessage}
              </div>
            ) : null}

            <div className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)] md:items-stretch">
                <div className="space-y-4">
                  <input
                    className="input-modern"
                    value={formState.username}
                    onChange={(event) => setFormState((current) => ({ ...current, username: event.target.value }))}
                    placeholder="Имя пользователя"
                  />
                  <input
                    className="input-modern"
                    value={formState.email}
                    onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                    placeholder="Email"
                  />
                  <input
                    className="input-modern"
                    value={formState.fullName}
                    onChange={(event) => setFormState((current) => ({ ...current, fullName: event.target.value }))}
                    placeholder="ФИО"
                  />
                  <CitySelect
                    value={formState.city}
                    onChange={(event) => setFormState((current) => ({ ...current, city: event.target.value }))}
                  />
                  <input
                    type="date"
                    className="input-modern"
                    value={formState.birthDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(event) => setFormState((current) => ({ ...current, birthDate: event.target.value }))}
                    aria-label="Дата рождения"
                  />
                </div>

                <textarea
                  className="textarea-modern min-h-[152px] md:h-full md:min-h-0"
                  maxLength={150}
                  value={formState.bio}
                  onChange={(event) => setFormState((current) => ({ ...current, bio: event.target.value.slice(0, 150) }))}
                  placeholder="Коротко о себе: до 150 символов"
                />
              </div>

              <GenrePicker
                selectedGenres={selectedGenres}
                onToggle={toggleGenre}
                hint="Выберите направления, по которым хотите показывать вкус в профиле."
              />

              <div className="surface-card space-y-3 p-4">
                <div className="flex items-center gap-4">
                  <Avatar username={profile.username} avatarUrl={profile.avatarUrl} size="small" />
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--text)]">Аватар профиля</p>
                    <p className="text-xs leading-6 text-[color:var(--muted)]">Загрузите JPG, PNG, WEBP или GIF до 5 МБ</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => setSelectedAvatarFile(event.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-[color:var(--muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[color:rgba(255,214,120,0.14)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[color:var(--accent)]"
                />
                <button
                  type="button"
                  onClick={() => uploadAvatarMutation.mutate()}
                  disabled={uploadAvatarMutation.isPending || !selectedAvatarFile}
                  className="btn-soft disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {uploadAvatarMutation.isPending ? 'Загружаем...' : selectedAvatarFile ? `Загрузить: ${selectedAvatarFile.name}` : 'Выберите файл'}
                </button>
              </div>
            </div>
          </section>

          <RatingOverview profile={profile} />

          <section className="surface-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Фон профиля</p>
            <h2 className="mt-2 text-2xl font-semibold">Любимые книги на витрине</h2>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm leading-7 text-[color:var(--muted)]">
                На витрину можно вывести до пяти книг из избранного.
              </p>
              {favoriteBooks.length ? (
                <button type="button" onClick={() => setIsFeaturedBooksPickerOpen(true)} className="btn-soft">
                  Выбрать книги
                </button>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--muted-strong)]">
              <span className="warm-chip">Выбрано: {formState.featuredBookIds.length}/5</span>
              {favoriteBooks.length ? <span className="warm-chip">В избранном: {favoriteBooks.length}</span> : null}
            </div>

            {!favoriteBooks.length ? (
              <div className="mt-5 rounded-[24px] border border-dashed border-[color:rgba(255,220,120,0.2)] p-5 text-sm leading-7 text-[color:var(--muted)]">
                Сначала добавьте книги в избранное
              </div>
            ) : !selectedFeaturedBooks.length ? (
              <div className="mt-5 rounded-[24px] border border-dashed border-[color:rgba(255,220,120,0.2)] p-5 text-sm leading-7 text-[color:var(--muted)]">
                Пока на витрину ничего не выбрано. Нажмите «Выбрать книги» и отметьте нужные книги во всплывающем окне.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {featuredBooksPreview.map((book: any) => (
                  <div key={book.id} className="surface-card overflow-hidden">
                    <div className="flex gap-4 p-4">
                      <div className="book-cover-frame book-cover-frame--compact">
                        {book.coverUrl ? <img src={resolveMediaUrl(book.coverUrl) ?? undefined} alt={book.title} className="book-cover-image" /> : <div className="book-cover-fallback">Нет обложки</div>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[color:var(--text)]">{book.title}</p>
                        <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                          {book.authors?.map((author: any) => author.fullName).join(', ') || 'Автор не указан'}
                        </p>
                        <span className="mt-3 inline-flex rounded-full border px-3 py-1 text-xs text-[color:var(--accent)]">
                          На витрине
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedFeaturedBooks.length > featuredBooksPreview.length ? (
              <p className="mt-4 text-sm text-[color:var(--muted)]">
                И ещё {selectedFeaturedBooks.length - featuredBooksPreview.length} книг на витрине.
              </p>
            ) : null}
          </section>
        </div>

        <div className="space-y-6">
          <section className="surface-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Приватность</p>
            <h2 className="mt-2 text-2xl font-semibold">Что видно другим</h2>
            <div className="mt-5 grid gap-3">
              <SettingToggle
                checked={formState.showRatings}
                onChange={(value) => setFormState((current) => ({ ...current, showRatings: value }))}
                label="Показывать оценённые книги"
                hint="Если выключить, другие не увидят ваши оценки и рейтинг по книгам"
              />
              <SettingToggle
                checked={formState.showReviews}
                onChange={(value) => setFormState((current) => ({ ...current, showReviews: value }))}
                label="Показывать рецензии"
                hint="Если выключить, ваши рецензии пропадут из публичного профиля и со страниц книг"
              />
              <SettingToggle
                checked={formState.showFavorites}
                onChange={(value) => setFormState((current) => ({ ...current, showFavorites: value }))}
                label="Показывать избранное"
                hint="Разрешает другим видеть ваши любимые книги"
              />
              <SettingToggle
                checked={formState.showLibrary}
                onChange={(value) => setFormState((current) => ({ ...current, showLibrary: value }))}
                label="Показывать полки чтения"
                hint="Управляет видимостью полок «Буду читать», «Прочитано» и «Перестал читать»"
              />
            </div>
          </section>

          <section className="surface-card p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Читатели</p>
            <h2 className="mt-2 text-2xl font-semibold">Кого можно читать рядом</h2>
            <div className="mt-5 grid gap-4">
              {(discoverQuery.data ?? []).map((reader) => (
                <div key={reader.id} className="surface-card overflow-hidden">
                  <div
                    className="h-20 w-full bg-[linear-gradient(135deg,rgba(255,212,139,0.14),rgba(242,133,63,0.18))]"
                    style={
                      reader.featuredCoverUrl
                        ? {
                            backgroundImage: `linear-gradient(135deg, rgba(20,14,11,0.18), rgba(20,14,11,0.5)), url(${resolveMediaUrl(reader.featuredCoverUrl) ?? ''})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }
                        : undefined
                    }
                  />
                  <div className="p-4">
                    <div className="-mt-10 flex items-end justify-between gap-3">
                      <Avatar username={reader.username} avatarUrl={reader.avatarUrl} size="small" />
                      <button
                        type="button"
                        disabled={followMutation.isPending}
                        onClick={() => followMutation.mutate({ username: reader.username, isFollowing: reader.isFollowing })}
                        className={`${reader.isFollowing ? 'btn-soft' : 'btn-primary'} disabled:cursor-not-allowed disabled:opacity-70`}
                      >
                        {reader.isFollowing ? 'Отписаться' : 'Подписаться'}
                      </button>
                    </div>
                    <Link to={`/people/${reader.username}`} className="mt-3 block text-lg font-semibold text-[color:var(--text)] hover:text-[color:var(--accent)]">
                      @{reader.username}
                    </Link>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      {reader.bio || 'Пока без описания'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Мои оценки</p>
            <h2 className="text-2xl font-semibold">Книги, которые я уже оценил</h2>
          </div>
          <Link to="/profile/my-ratings" className="btn-soft">Открыть список</Link>
        </div>
        <div className="grid gap-4">
          {profile.ratedBooks.length ? (
            profile.ratedBooks.map((item) => (
              <BookCard key={item.book.id} book={{ ...item.book, avgFinalScore: item.finalScore, ratingCount: 1 }} />
            ))
          ) : (
            <div className="surface-card p-6 text-sm text-[color:var(--muted)]">Пока нет оценённых книг</div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Мои рецензии</p>
          <h2 className="text-2xl font-semibold">Что я написал о книгах</h2>
        </div>
        <div className="grid gap-4">
          {profile.reviews.length ? (
            profile.reviews.map((review) => (
              <article key={review.id} className="surface-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[color:var(--text)]">{review.title}</h3>
                    {review.book ? (
                      <Link to={`/books/${review.book.id}`} className="mt-2 inline-flex text-sm text-[color:var(--accent)] hover:text-[color:var(--text)]">
                        {review.book.title}
                      </Link>
                    ) : null}
                  </div>
                  <span className="text-sm text-[color:var(--muted)]">{new Date(review.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingReviewId(review.id);
                      setReviewDraft({
                        title: review.title,
                        body: review.body
                      });
                    }}
                    className="btn-soft"
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReviewMutation.mutate(review.id)}
                    disabled={deleteReviewMutation.isPending}
                    className="btn-soft disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Удалить
                  </button>
                </div>

                {editingReviewId === review.id ? (
                  <div className="mt-4 space-y-3">
                    <input
                      className="input-modern"
                      value={reviewDraft.title}
                      maxLength={200}
                      onChange={(event) => setReviewDraft((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Заголовок рецензии"
                    />
                    <textarea
                      className="textarea-modern min-h-[180px]"
                      value={reviewDraft.body}
                      maxLength={10000}
                      onChange={(event) => setReviewDraft((current) => ({ ...current, body: event.target.value }))}
                      placeholder="Текст рецензии"
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          updateReviewMutation.mutate({
                            id: review.id,
                            title: reviewDraft.title.trim(),
                            body: reviewDraft.body.trim()
                          })
                        }
                        disabled={updateReviewMutation.isPending || reviewDraft.title.trim().length < 3 || reviewDraft.body.trim().length < 20}
                        className="btn-primary disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {updateReviewMutation.isPending ? 'Сохраняем...' : 'Сохранить'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReviewId(null);
                          setReviewDraft({ title: '', body: '' });
                        }}
                        className="btn-soft"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 whitespace-pre-line text-sm leading-8 text-[color:var(--muted)]">{review.body}</p>
                )}
              </article>
            ))
          ) : (
            <div className="surface-card p-6 text-sm text-[color:var(--muted)]">Пока нет рецензий</div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Избранное</p>
            <h2 className="text-2xl font-semibold">Любимые книги</h2>
          </div>
          <Link to="/profile/library?tab=favorites" className="btn-soft">Открыть библиотеку</Link>
        </div>
        <div className="grid gap-4">
          {profile.favoriteBooks.length ? (
            profile.favoriteBooks.map((book) => <BookCard key={book.id} book={book} />)
          ) : (
            <div className="surface-card p-6 text-sm text-[color:var(--muted)]">Пока нет избранных книг</div>
          )}
        </div>
      </section>

      {isFeaturedBooksPickerOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[color:rgba(8,6,5,0.72)] p-4 backdrop-blur-md"
          onClick={() => setIsFeaturedBooksPickerOpen(false)}
        >
          <div
            className="surface-panel flex max-h-[85vh] w-full max-w-5xl flex-col p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Витрина</p>
                <h3 className="mt-2 text-2xl font-semibold text-[color:var(--text)]">Выбор книг для витрины</h3>
                <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                  Выберите до пяти книг из избранного. Сейчас выбрано {formState.featuredBookIds.length}/5.
                </p>
              </div>
              <button type="button" onClick={() => setIsFeaturedBooksPickerOpen(false)} className="btn-soft">
                Закрыть
              </button>
            </div>

            <div className="mt-5 grid flex-1 gap-4 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
              {favoriteBooks.map((book: any) => {
                const isSelected = formState.featuredBookIds.includes(book.id);
                const selectionLimitReached = formState.featuredBookIds.length >= 5 && !isSelected;

                return (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => toggleFeaturedBookSelection(book.id)}
                    disabled={selectionLimitReached}
                    className={`surface-card overflow-hidden text-left transition ${
                      isSelected ? 'border-[color:rgba(255,220,120,0.32)]' : ''
                    } ${selectionLimitReached ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <div className="flex gap-4 p-4">
                      <div className="book-cover-frame book-cover-frame--compact">
                        {book.coverUrl ? (
                          <img src={resolveMediaUrl(book.coverUrl) ?? undefined} alt={book.title} className="book-cover-image" />
                        ) : (
                          <div className="book-cover-fallback">Нет обложки</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[color:var(--text)]">{book.title}</p>
                        <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                          {book.authors?.map((author: any) => author.fullName).join(', ') || 'Автор не указан'}
                        </p>
                        <span className="mt-3 inline-flex rounded-full border px-3 py-1 text-xs text-[color:var(--accent)]">
                          {isSelected ? 'На витрине' : selectionLimitReached ? 'Лимит достигнут' : 'Добавить в витрину'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
