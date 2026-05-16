import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPromptProfile,
  heuristicInterpretSearchPrompt,
  inferBookOriginStable,
  resolveAiSearchFilters,
  scoreBookAgainstPrompt
} from '../src/modules/search/service.js';

test('ai search keeps provider filters but strips rating-based preferences', async () => {
  const interpreted = await resolveAiSearchFilters(
    'Need philosophical modern prose in Russian',
    { limit: 5 },
    {
      query: 'philosophical modern prose',
      genres: ['Современная проза'],
      tags: ['философская'],
      language: 'ru',
      sort: 'rating_desc'
    }
  );

  assert.equal(interpreted.source, 'ai');
  assert.equal(interpreted.filters.query, 'philosophical modern prose');
  assert.deepEqual(interpreted.filters.genres, ['Современная проза']);
  assert.deepEqual(interpreted.filters.tags, ['философская']);
  assert.equal(interpreted.filters.language, 'ru');
  assert.equal(interpreted.filters.sort, 'newest_desc');
  assert.equal(interpreted.filters.limit, 5);
  assert.equal(interpreted.filters.minRating, undefined);
  assert.equal(interpreted.filters.maxRating, undefined);
  assert.equal(interpreted.warning, null);
});

test('ai search falls back to local interpretation when provider is unavailable', async () => {
  const interpreted = await resolveAiSearchFilters(
    'Need philosophical modern prose in Russian after 2015',
    {},
    null,
    { code: 'AI_ASSISTANT_UNAVAILABLE' }
  );

  assert.equal(interpreted.source, 'fallback');
  assert.equal(interpreted.filters.language, 'ru');
  assert.equal(interpreted.filters.yearFrom, 2015);
  assert.equal(interpreted.filters.sort, 'newest_desc');
  assert.equal(interpreted.filters.minRating, undefined);
  assert.equal(interpreted.warning?.code, 'AI_ASSISTANT_UNAVAILABLE');
});

test('heuristic fallback extracts useful structured filters from natural language', () => {
  const interpreted = heuristicInterpretSearchPrompt('Need philosophical modern prose in Russian after 2015');

  assert.deepEqual(interpreted.genres, ['Философия', 'Современная проза']);
  assert.deepEqual(interpreted.tags, ['философская']);
  assert.equal(interpreted.language, 'ru');
  assert.equal(interpreted.yearFrom, 2015);
  assert.equal(interpreted.sort, 'newest_desc');
  assert.ok(interpreted.query);
  assert.equal(interpreted.minRating, undefined);
});

test('heuristic fallback detects foreign classics separately from russian classics', async () => {
  const interpreted = heuristicInterpretSearchPrompt('foreign classic');

  assert.equal(interpreted.origin, 'foreign');
  assert.deepEqual(interpreted.genres, ['Классика']);

  const resolved = await resolveAiSearchFilters('foreign classic', {}, null, null);
  assert.equal(resolved.filters.origin, 'foreign');
  assert.equal(resolved.filters.limit, 8);
});

test('prompt profile marks atmospheric requests as vibe and idea driven', () => {
  const profile = buildPromptProfile('Need atmospheric philosophical prose with a strong idea');

  assert.equal(profile.dimensionWeights.vibe, 1);
  assert.equal(profile.dimensionWeights.idea, 1);
  assert.ok(profile.tokens.includes('atmospheric'));
  assert.ok(profile.tokens.includes('philosophical'));
});

test('prompt scoring prefers books that match mood and theme over unrelated books', () => {
  const profile = buildPromptProfile('Need atmospheric philosophical prose with a strong idea');
  const filters = {
    genres: [],
    tags: [],
    sort: 'newest_desc'
  };
  const closeMatch = {
    id: '1',
    title: 'Quiet Night',
    originalTitle: null,
    description: 'An atmospheric philosophical prose novel with a strong idea and lingering aftertaste.',
    authors: [{ fullName: 'Author One' }],
    genres: [{ name: 'Современная проза' }],
    tags: [{ name: 'атмосферная' }, { name: 'философская' }],
    language: 'ru',
    publicationYear: 2023
  };
  const weakMatch = {
    id: '2',
    title: 'Routine Handbook',
    originalTitle: null,
    description: 'A practical handbook about routines and productivity.',
    authors: [{ fullName: 'Author Two' }],
    genres: [{ name: 'Бизнес' }],
    tags: [{ name: 'сатирическая' }],
    language: 'ru',
    publicationYear: 2023
  };

  assert.ok(scoreBookAgainstPrompt(closeMatch, profile, filters) > scoreBookAgainstPrompt(weakMatch, profile, filters));
});

test('prompt scoring strongly penalizes russian classics for foreign-classic requests', () => {
  const profile = buildPromptProfile('foreign classic');
  const filters = {
    origin: 'foreign',
    genres: ['Классика'],
    tags: [],
    sort: 'newest_desc'
  };
  const foreignClassic = {
    id: '1',
    title: 'The Picture of Dorian Gray',
    originalTitle: 'The Picture of Dorian Gray',
    description: 'A classic novel about beauty, corruption, and conscience.',
    authors: [{ fullName: 'Oscar Wilde' }],
    genres: [{ name: 'Классика' }],
    tags: [],
    language: 'ru',
    publicationYear: 1890,
    catalogSection: 'Классика',
    catalogSectionSlug: 'klassika'
  };
  const russianClassic = {
    id: '2',
    title: 'Евгений Онегин',
    originalTitle: null,
    description: 'Classic Russian verse novel.',
    authors: [{ fullName: 'Александр Пушкин' }],
    genres: [{ name: 'Классика' }],
    tags: [],
    language: 'ru',
    publicationYear: 1833,
    catalogSection: 'Классика',
    catalogSectionSlug: 'klassika'
  };

  assert.ok(scoreBookAgainstPrompt(foreignClassic, profile, filters) > scoreBookAgainstPrompt(russianClassic, profile, filters));
});

test('origin detection keeps russian classics out of foreign-classic requests', () => {
  const russianClassic = {
    id: 'ru-1',
    title: '\u0417\u0430\u043f\u0438\u0441\u043a\u0438 \u043e\u0445\u043e\u0442\u043d\u0438\u043a\u0430',
    originalTitle: null,
    description: '\u041a\u043b\u0430\u0441\u0441\u0438\u0447\u0435\u0441\u043a\u0430\u044f \u0440\u0443\u0441\u0441\u043a\u0430\u044f \u043f\u0440\u043e\u0437\u0430.',
    authors: [{ fullName: '\u0418\u0432\u0430\u043d \u0422\u0443\u0440\u0433\u0435\u043d\u0435\u0432' }],
    genres: [{ name: '\u041a\u043b\u0430\u0441\u0441\u0438\u043a\u0430' }],
    tags: [],
    catalogSection: '\u041a\u043b\u0430\u0441\u0441\u0438\u043a\u0430',
    catalogSectionSlug: 'klassika'
  };
  const foreignClassic = {
    id: 'for-1',
    title: '451',
    originalTitle: null,
    description: 'Classic foreign dystopian novel.',
    authors: [{ fullName: '\u0420\u044d\u0439 \u0411\u0440\u044d\u0434\u0431\u0435\u0440\u0438' }],
    genres: [{ name: '\u041a\u043b\u0430\u0441\u0441\u0438\u043a\u0430' }],
    tags: [],
    catalogSection: '\u041a\u043b\u0430\u0441\u0441\u0438\u043a\u0430',
    catalogSectionSlug: 'klassika'
  };

  assert.equal(inferBookOriginStable(russianClassic), 'russian');
  assert.equal(inferBookOriginStable(foreignClassic), 'foreign');
});
