import { z } from 'zod';

export const canonicalBookSortValues = [
  'rating_desc',
  'rating_asc',
  'year_desc',
  'year_asc',
  'newest_desc',
  'newest_asc',
  'title_asc',
  'title_desc'
];

const legacyBookSortAliases = {
  rating: 'rating_desc',
  year: 'year_desc',
  newest: 'newest_desc',
  oldest: 'newest_asc',
  title: 'title_asc'
};

export function normalizeBookSort(value, fallback = 'newest_desc') {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (canonicalBookSortValues.includes(normalized)) {
    return normalized;
  }

  return legacyBookSortAliases[normalized] ?? fallback;
}

export function createBookSortSchema(defaultValue = 'newest_desc') {
  return z.preprocess(
    (value) => normalizeBookSort(value, defaultValue),
    z.enum(canonicalBookSortValues).default(defaultValue)
  );
}
