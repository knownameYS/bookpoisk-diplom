import { api } from '../api/client';

export const readingShelves = [
  { key: 'want-to-read', title: 'Буду читать' },
  { key: 'read', title: 'Прочитано' },
  { key: 'stopped-reading', title: 'Перестал читать' }
] as const;

export type ReadingShelfKey = (typeof readingShelves)[number]['key'];

export type ReadingShelf = {
  id: string;
  key: ReadingShelfKey;
  title: string;
  description?: string | null;
  bookCount: number;
  books: any[];
};

export async function getFavorites() {
  return (await api.get('/favorites')).data.items;
}

export async function getFavoriteStatus(bookId: string) {
  return (await api.get(`/favorites/${bookId}`)).data.item as { bookId: string; isFavorite: boolean };
}

export async function addFavorite(bookId: string) {
  return (await api.post(`/favorites/${bookId}`)).data.item;
}

export async function removeFavorite(bookId: string) {
  await api.delete(`/favorites/${bookId}`);
}

export async function getReadingShelves() {
  return (await api.get('/collections/shelves/mine')).data.items as ReadingShelf[];
}

export async function getReadingShelfState(bookId: string) {
  return (await api.get(`/collections/shelves/books/${bookId}`)).data.item as {
    bookId: string;
    shelfKey: ReadingShelfKey | null;
  };
}

export async function setReadingShelf(bookId: string, shelfKey: ReadingShelfKey) {
  return (await api.put(`/collections/shelves/${shelfKey}/books/${bookId}`)).data.item as {
    bookId: string;
    shelfKey: ReadingShelfKey | null;
  };
}

export async function clearReadingShelf(bookId: string) {
  return (await api.delete(`/collections/shelves/books/${bookId}`)).data.item as {
    bookId: string;
    shelfKey: null;
  };
}
