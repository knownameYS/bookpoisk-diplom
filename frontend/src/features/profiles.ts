import { api } from '../api/client';

export type ProfileBook = {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  authors?: Array<{ id: string; fullName: string }>;
};

export type PublicProfile = {
  id: string;
  username: string;
  email?: string;
  fullName?: string | null;
  birthDate?: string | null;
  city?: string | null;
  favoriteGenres?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  followersCount: number;
  followingCount: number;
  ratingsCount: number;
  reviewsCount: number;
  favoritesCount: number;
  isFollowing: boolean;
  featuredBooks: ProfileBook[];
  favoriteBooks: ProfileBook[];
  ratedBooks: Array<{
    architecture: number;
    characters: number;
    language: number;
    idea: number;
    vibe: number;
    finalScore: number;
    updatedAt: string;
    book: ProfileBook;
  }>;
  reviews: Array<{
    id: string;
    title: string;
    body: string;
    createdAt: string;
    book?: { id: string; title: string; coverUrl?: string | null };
  }>;
  followingPreview: Array<{
    id: string;
    username: string;
    avatarUrl?: string | null;
    bio?: string | null;
  }>;
  settings?: {
    showRatings: boolean;
    showReviews: boolean;
    showFavorites: boolean;
    showLibrary: boolean;
  };
  shelfSummary: Array<{
    key: string;
    title: string;
    bookCount: number;
  }>;
  ratingAverages: {
    architecture: number;
    characters: number;
    language: number;
    idea: number;
    vibe: number;
    finalScore: number;
  };
};

export type DiscoverUser = {
  id: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  featuredCoverUrl?: string | null;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
};

export type CurrentUser = {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  birthDate?: string | null;
  city?: string | null;
  favoriteGenres?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  settings: {
    showRatings: boolean;
    showReviews: boolean;
    showFavorites: boolean;
    showLibrary: boolean;
  };
};

export async function getCurrentUser() {
  return (await api.get('/auth/me')).data.user as CurrentUser;
}

export async function getOwnProfile() {
  return (await api.get('/users/me')).data.user as PublicProfile;
}

export async function updateOwnProfile(payload: {
  username?: string;
  email?: string;
  fullName?: string | null;
  birthDate?: string | null;
  city?: string | null;
  favoriteGenres?: string | null;
  bio?: string | null;
  featuredBookIds?: string[];
  showRatings?: boolean;
  showReviews?: boolean;
  showFavorites?: boolean;
  showLibrary?: boolean;
}) {
  return (await api.patch('/users/me', payload)).data.user as PublicProfile;
}

export async function uploadOwnAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);

  return (
    await api.post('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  ).data.user as PublicProfile;
}

export async function getPublicProfile(username: string) {
  return (await api.get(`/users/${username}`)).data.user as PublicProfile;
}

export async function followProfile(username: string) {
  return (await api.post(`/users/${username}/follow`)).data.user as PublicProfile;
}

export async function unfollowProfile(username: string) {
  return (await api.delete(`/users/${username}/follow`)).data.user as PublicProfile;
}

export async function discoverProfiles(query = '') {
  const params = new URLSearchParams();
  if (query.trim()) {
    params.set('query', query.trim());
  }

  return (await api.get(`/users/discover?${params.toString()}`)).data.items as DiscoverUser[];
}
