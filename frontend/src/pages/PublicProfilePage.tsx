import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getAccessToken, getApiErrorMessage } from '../api/client';
import { BookCard } from '../components/ContentCards';
import { RadarChart } from '../components/RadarChart';
import { resolveMediaUrl } from '../utils/media';
import { formatBirthDate } from '../utils/profile';
import { getOwnProfile, getPublicProfile, followProfile, unfollowProfile } from '../features/profiles';

function initials(value: string) {
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function Avatar({ username, avatarUrl }: { username: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return <img src={resolveMediaUrl(avatarUrl) ?? undefined} alt={username} className="h-24 w-24 rounded-3xl border border-[color:rgba(255,226,160,0.22)] object-cover shadow-[var(--shadow-sm)]" />;
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-[color:rgba(255,226,160,0.22)] bg-[color:rgba(255,248,238,0.08)] text-2xl font-semibold text-[color:var(--text)] shadow-[var(--shadow-sm)]">
      {initials(username)}
    </div>
  );
}

export default function PublicProfilePage() {
  const { username = '' } = useParams();
  const queryClient = useQueryClient();
  const isAuthenticated = Boolean(getAccessToken());

  const meQuery = useQuery({
    queryKey: ['myProfile'],
    queryFn: getOwnProfile,
    enabled: isAuthenticated
  });

  const profileQuery = useQuery({
    queryKey: ['publicProfile', username],
    queryFn: () => getPublicProfile(username),
    enabled: Boolean(username)
  });

  const followMutation = useMutation({
    mutationFn: async (isFollowing: boolean) => (isFollowing ? unfollowProfile(username) : followProfile(username)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['publicProfile', username] }),
        queryClient.invalidateQueries({ queryKey: ['myProfile'] }),
        queryClient.invalidateQueries({ queryKey: ['discoverProfiles'] })
      ]);
    }
  });

  const profile = profileQuery.data;
  const formattedBirthDate = formatBirthDate(profile?.birthDate ?? null);
  const isOwnProfile = meQuery.data?.username === profile?.username;
  const followButtonLabel = profile?.isFollowing ? 'Отписаться' : 'Подписаться';

  const visibleSections = useMemo(() => {
    if (!profile) {
      return [];
    }

    return [
      { key: 'favorites', title: 'Любимые книги', items: profile.favoriteBooks },
      { key: 'ratings', title: 'Последние оценки', items: profile.ratedBooks },
      { key: 'reviews', title: 'Последние рецензии', items: profile.reviews }
    ];
  }, [profile]);

  if (profileQuery.isLoading) {
    return <div className="surface-card p-6 text-sm text-[color:var(--muted)]">Загружаем профиль читателя...</div>;
  }

  if (profileQuery.isError || !profile) {
    return (
      <div className="surface-card p-6 text-sm text-[color:var(--muted)]">
        {getApiErrorMessage(profileQuery.error, 'Не удалось открыть профиль читателя')}
      </div>
    );
  }

  const axes = [
    { label: 'Композиция', value: profile.ratingAverages.architecture },
    { label: 'Персонажи', value: profile.ratingAverages.characters },
    { label: 'Язык', value: profile.ratingAverages.language },
    { label: 'Идея', value: profile.ratingAverages.idea },
    { label: 'Атмосфера', value: profile.ratingAverages.vibe }
  ];

  return (
    <div className="space-y-8">
      <section className="surface-panel relative overflow-hidden p-6 md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,226,160,0.06),transparent_42%,rgba(242,133,63,0.08))]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-5 md:flex-row md:items-end">
            <Avatar username={profile.username} avatarUrl={profile.avatarUrl} />
            <div>
              <span className="section-kicker">Публичный профиль</span>
              <h1 className="section-title">@{profile.username}</h1>
              {profile.fullName ? <p className="mt-2 text-lg font-medium text-[color:var(--muted-strong)]">{profile.fullName}</p> : null}
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                {profile.bio || 'Пока без описания'}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--muted-strong)]">
                {formattedBirthDate ? <span className="warm-chip">Дата рождения: {formattedBirthDate}</span> : null}
                {profile.city ? <span className="warm-chip">{profile.city}</span> : null}
                {profile.favoriteGenres ? <span className="warm-chip">Любимые жанры: {profile.favoriteGenres}</span> : null}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--muted-strong)]">
                <span className="warm-chip">{profile.followersCount} подписчиков</span>
                <span className="warm-chip">{profile.followingCount} подписок</span>
                <span className="warm-chip">{profile.ratingsCount} оценок</span>
                <span className="warm-chip">{profile.reviewsCount} рецензий</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isOwnProfile && isAuthenticated ? (
              <button
                type="button"
                disabled={followMutation.isPending}
                onClick={() => followMutation.mutate(profile.isFollowing)}
                className={`${profile.isFollowing ? 'btn-soft' : 'btn-primary'} disabled:cursor-not-allowed disabled:opacity-70`}
              >
                {followMutation.isPending ? 'Обновляем...' : followButtonLabel}
              </button>
            ) : null}
            {!isAuthenticated ? <Link to="/login" className="btn-primary">Войти, чтобы подписаться</Link> : null}
            {isOwnProfile ? <Link to="/profile" className="btn-soft">Перейти в мой профиль</Link> : null}
          </div>
        </div>
      </section>

      {profile.featuredBooks.length ? (
        <section className="surface-card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Витрина</p>
          <h2 className="mt-2 text-2xl font-semibold">Любимые книги на фоне профиля</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {profile.featuredBooks.map((book) => (
              <Link key={book.id} to={`/books/${book.id}`} className="group overflow-hidden rounded-[24px] border border-[color:rgba(255,220,120,0.16)] p-3">
                <div className="book-cover-frame aspect-[3/4]">
                  {book.coverUrl ? <img src={resolveMediaUrl(book.coverUrl) ?? undefined} alt={book.title} className="book-cover-image transition duration-300 group-hover:scale-[1.03]" /> : <div className="book-cover-fallback">Нет обложки</div>}
                </div>
                <div className="pt-3">
                  <p className="text-sm font-semibold text-[color:var(--text)]">{book.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {profile.ratedBooks.length ? (
        <section className="surface-card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Оценки</p>
          <h2 className="mt-2 text-2xl font-semibold">Средний читательский профиль</h2>
          <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr] xl:items-center">
            <RadarChart axes={axes} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="metric-pill"><p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Композиция</p><p className="mt-2 text-2xl font-semibold text-[color:var(--accent)]">{profile.ratingAverages.architecture.toFixed(1)}</p></div>
              <div className="metric-pill"><p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Персонажи</p><p className="mt-2 text-2xl font-semibold text-[color:var(--accent)]">{profile.ratingAverages.characters.toFixed(1)}</p></div>
              <div className="metric-pill"><p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Язык</p><p className="mt-2 text-2xl font-semibold text-[color:var(--accent)]">{profile.ratingAverages.language.toFixed(1)}</p></div>
              <div className="metric-pill"><p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Идея</p><p className="mt-2 text-2xl font-semibold text-[color:var(--accent)]">{profile.ratingAverages.idea.toFixed(1)}</p></div>
              <div className="metric-pill sm:col-span-2"><p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">Общий балл пользователя</p><p className="mt-2 text-2xl font-semibold text-[color:var(--accent)]">{profile.ratingAverages.finalScore.toFixed(1)}/84</p></div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {visibleSections.map((section) => {
            if (!section.items.length) {
              return null;
            }

            if (section.key === 'favorites') {
              return (
                <section key={section.key} className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">{section.title}</p>
                  </div>
                  <div className="grid gap-4">
                    {(section.items as typeof profile.favoriteBooks).map((book) => (
                      <BookCard key={book.id} book={book} />
                    ))}
                  </div>
                </section>
              );
            }

            if (section.key === 'ratings') {
              return (
                <section key={section.key} className="surface-card p-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">{section.title}</p>
                  <div className="mt-5 grid gap-4">
                    {(section.items as typeof profile.ratedBooks).map((item) => (
                      <BookCard key={item.book.id} book={{ ...item.book, avgFinalScore: item.finalScore, ratingCount: 1 }} />
                    ))}
                  </div>
                </section>
              );
            }

            return (
              <section key={section.key} className="surface-card p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">{section.title}</p>
                <div className="mt-5 grid gap-4">
                  {(section.items as typeof profile.reviews).map((review) => (
                    <article key={review.id} className="surface-card p-4">
                      <h3 className="text-base font-semibold text-[color:var(--text)]">{review.title}</h3>
                      {review.book ? <Link to={`/books/${review.book.id}`} className="mt-2 inline-flex text-sm text-[color:var(--accent)] hover:text-[color:var(--text)]">{review.book.title}</Link> : null}
                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[color:var(--muted)]">{review.body}</p>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="space-y-6">
          {profile.shelfSummary.length ? (
            <section className="surface-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Полки чтения</p>
              <div className="mt-5 grid gap-3">
                {profile.shelfSummary.map((shelf) => (
                  <div key={shelf.key} className="metric-pill">
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">{shelf.title}</p>
                    <p className="mt-2 text-2xl font-semibold text-[color:var(--accent)]">{shelf.bookCount}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {profile.followingPreview.length ? (
            <section className="surface-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">Подписки</p>
              <div className="mt-5 grid gap-3">
                {profile.followingPreview.map((reader) => (
                  <Link key={reader.id} to={`/people/${reader.username}`} className="surface-card flex items-center gap-3 p-3 hover:border-[color:rgba(255,220,120,0.22)]">
                    <div className="h-10 w-10 overflow-hidden rounded-2xl bg-[color:rgba(255,248,238,0.05)]">
                      {reader.avatarUrl ? <img src={resolveMediaUrl(reader.avatarUrl) ?? undefined} alt={reader.username} className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[color:var(--text)]">@{reader.username}</p>
                      <p className="truncate text-xs text-[color:var(--muted)]">{reader.bio || 'Без описания'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
