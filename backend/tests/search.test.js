import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBookWhere, rankBooksByQuery } from '../src/modules/books/service.js';
import { matchAiSuggestionsToCatalog, normalizeSearchFilters } from '../src/modules/search/service.js';

test('ordinary search normalizes filters for db query execution', () => {
  const filters = normalizeSearchFilters({
    query: 'moody philosophical books',
    genres: ['Philosophy'],
    tags: ['dark', 'existential'],
    language: 'ru',
    yearFrom: 1950,
    yearTo: 2000,
    minRating: 60,
    sort: 'rating_desc'
  });

  assert.equal(filters.query, 'moody philosophical books');
  assert.deepEqual(filters.genres, ['Philosophy']);
  assert.deepEqual(filters.tags, ['dark', 'existential']);
  assert.equal(filters.language, 'ru');
  assert.equal(filters.sort, 'rating_desc');
});

test('ordinary search builds postgres-friendly where conditions', () => {
  const where = buildBookWhere({
    query: 'earthsea',
    author: 'Le Guin',
    genres: ['Fantasy'],
    tags: ['worldbuilding'],
    language: 'ru',
    yearFrom: 1960,
    yearTo: 1980
  });

  assert.equal(Array.isArray(where.AND), true);
  assert.equal(where.AND[0].status, 'PUBLISHED');
  assert.equal(where.AND.some((item) => item.OR), true);
  assert.equal(where.AND.some((item) => item.bookAuthors), true);
  assert.equal(where.AND.some((item) => item.bookGenres), true);
  assert.equal(where.AND.some((item) => item.bookTags), true);
});

test('ordinary search splits multiword queries into reusable token filters', () => {
  const where = buildBookWhere({
    query: 'master bulgakov',
    genres: [],
    tags: []
  });

  const queryCondition = where.AND[1];

  assert.equal(Array.isArray(queryCondition.OR), true);
  assert.equal(Array.isArray(queryCondition.OR[1].AND), true);
  assert.equal(queryCondition.OR[1].AND.length, 2);
});

test('ordinary search ranks exact title matches above description mentions', () => {
  const ranked = rankBooksByQuery(
    [
      {
        id: 'described-hit',
        title: 'Angel of the Western Window',
        originalTitle: null,
        description: 'Fans of Master and Margarita often compare this novel to Bulgakov.',
        authors: [{ fullName: 'Gustav Meyrink' }],
        genres: [{ name: 'Mysticism' }],
        tags: [],
        catalogSection: 'mistika-i-uzhasy',
        series: null,
        publisher: null,
        editor: null,
        avgFinalScore: 71,
        ratingCount: 48,
        publicationYear: 1927,
        createdAt: '2026-05-01T00:00:00.000Z'
      },
      {
        id: 'exact-title-hit',
        title: 'Master and Margarita',
        originalTitle: null,
        description: 'A surreal and philosophical novel set in Moscow.',
        authors: [{ fullName: 'Mikhail Bulgakov' }],
        genres: [{ name: 'Classics' }],
        tags: [{ name: 'philosophical' }],
        catalogSection: 'klassika',
        series: null,
        publisher: null,
        editor: null,
        avgFinalScore: 84,
        ratingCount: 150,
        publicationYear: 1967,
        createdAt: '2026-04-20T00:00:00.000Z'
      }
    ],
    'master and margarita',
    'rating_desc'
  );

  assert.equal(ranked[0]?.id, 'exact-title-hit');
  assert.equal(ranked.some((book) => book.id === 'described-hit'), false);
});

test('ai suggested titles can be matched back to books from the local catalog', () => {
  const books = [
    {
      id: 'master',
      title: 'Мастер и Маргарита',
      originalTitle: null,
      description: 'Роман о Москве, Воланде и силе авторского замысла.',
      authors: [{ fullName: 'Михаил Булгаков' }],
      genres: [{ name: 'Классика' }],
      tags: [{ name: 'философская' }],
      catalogSection: 'Классика',
      catalogSectionSlug: 'klassika',
      series: null,
      publisher: null,
      editor: null,
      ageRestriction: null,
      language: 'ru',
      publicationYear: 1967,
      avgFinalScore: 84,
      avgArchitecture: 8.4,
      avgCharacters: 8.8,
      avgLanguage: 9.1,
      avgIdea: 9.4,
      avgVibe: 9,
      ratingCount: 240
    },
    {
      id: 'random',
      title: 'Случайный роман',
      originalTitle: null,
      description: 'Совсем другая книга без нужного названия.',
      authors: [{ fullName: 'Другой Автор' }],
      genres: [{ name: 'Современная проза' }],
      tags: [{ name: 'атмосферная' }],
      catalogSection: 'Современная проза',
      catalogSectionSlug: 'sovremennaya-proza',
      series: null,
      publisher: null,
      editor: null,
      ageRestriction: null,
      language: 'ru',
      publicationYear: 2015,
      avgFinalScore: 62,
      avgArchitecture: 6,
      avgCharacters: 6.2,
      avgLanguage: 6.1,
      avgIdea: 5.7,
      avgVibe: 6.4,
      ratingCount: 24
    }
  ];

  const matches = matchAiSuggestionsToCatalog(
    [
      { title: 'Мастер и Маргарита', author: 'Михаил Булгаков' },
      { title: 'Несуществующая книга', author: 'Неизвестный автор' }
    ],
    books,
    { language: 'ru' }
  );

  assert.deepEqual(matches.map((item) => item.book.id), ['master']);
});
