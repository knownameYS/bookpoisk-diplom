import fs from 'node:fs/promises';
import path from 'node:path';
import { ContentStatus, Prisma } from '@prisma/client';
import { ApiError } from '../../common/api-error.js';
import { normalizeBookSort } from '../../common/book-sort.js';
import { getPagination, toPageResponse } from '../../common/pagination.js';
import { ratingLabel } from '../../common/rating84.js';
import { prisma } from '../../lib/prisma.js';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const noveltyFeedPath = path.resolve(currentDir, '../../data/novelty-feed.json');
const fragmentCache = new Map();
const fragmentCacheTtlMs = 1000 * 60 * 60 * 12;
const remoteRequestTimeoutMs = 30000;
const searchStopWords = new Set(['и', 'в', 'во', 'на', 'по', 'с', 'со', 'к', 'ко', 'о', 'об', 'от', 'из', 'за', 'для', 'a', 'an', 'the', 'of']);

const bookListInclude = {
  bookAuthors: {
    include: {
      author: true
    },
    orderBy: {
      authorOrder: 'asc'
    }
  },
  bookGenres: {
    include: {
      genre: true
    }
  },
  bookTags: {
    include: {
      tag: true
    }
  }
};

function normalizeRemoteUrl(value, baseUrl = 'https://eksmo.ru') {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return null;
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  if (normalized.startsWith('//')) {
    return `https:${normalized}`;
  }

  return new URL(normalized, baseUrl).toString();
}

function getFragmentCache(cacheKey) {
  const cached = fragmentCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    fragmentCache.delete(cacheKey);
    return null;
  }

  return cached.value;
}

function setFragmentCache(cacheKey, value) {
  fragmentCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + fragmentCacheTtlMs
  });

  return value;
}

async function fetchRemoteText(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; BookpoiskFragmentResolver/1.0)',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'ru-RU,ru;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(remoteRequestTimeoutMs)
    });

    if (!response.ok) {
      throw new Error(`Request failed for ${url}: ${response.status}`);
    }

    return response.text();
  } catch (error) {
    if (attempt >= 3) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 600));
    return fetchRemoteText(url, attempt + 1);
  }
}

function extractFragmentPdfUrl(html) {
  const match = String(html ?? '').match(/data-pdf="([^"]+)"/i);
  return normalizeRemoteUrl(match?.[1] ?? null, 'https://eksmo.ru');
}

async function getFragmentBookById(id) {
  const book = await prisma.book.findFirst({
    where: {
      id,
      status: ContentStatus.PUBLISHED
    },
    select: {
      id: true,
      title: true,
      sourceSite: true,
      sourceUrl: true
    }
  });

  if (!book) {
    throw ApiError.notFound('Book not found');
  }

  return book;
}

async function resolveBookFragment(book) {
  const cacheKey = book.id;
  const cached = getFragmentCache(cacheKey);

  if (cached) {
    return cached;
  }

  const fallback = {
    available: false,
    provider: book.sourceSite ?? null,
    sourceUrl: book.sourceUrl ?? null,
    pdfUrl: null
  };

  if (book.sourceSite !== 'eksmo' || !book.sourceUrl) {
    return setFragmentCache(cacheKey, fallback);
  }

  try {
    const html = await fetchRemoteText(book.sourceUrl);
    const pdfUrl = extractFragmentPdfUrl(html);

    if (!pdfUrl) {
      return setFragmentCache(cacheKey, fallback);
    }

    return setFragmentCache(cacheKey, {
      ...fallback,
      available: true,
      pdfUrl
    });
  } catch {
    return setFragmentCache(cacheKey, fallback);
  }
}

function mapBookCard(book, statsByBookId) {
  const stats = statsByBookId.get(book.id) ?? { avgFinalScore: 0, ratingCount: 0 };

  return {
    id: book.id,
    title: book.title,
    originalTitle: book.originalTitle,
    description: book.description,
    isbn13: book.isbn13,
    catalogSection: book.catalogSection,
    catalogSectionSlug: book.catalogSectionSlug,
    publicationYear: book.publicationYear,
    language: book.language,
    coverUrl: book.coverUrl,
    sourceSite: book.sourceSite,
    sourceUrl: book.sourceUrl,
    series: book.series,
    publisher: book.publisher,
    editor: book.editor,
    ageRestriction: book.ageRestriction,
    binding: book.binding,
    pageCount: book.pageCount,
    weightGrams: book.weightGrams,
    thicknessMm: book.thicknessMm,
    bookFormat: book.bookFormat,
    paperMaterial: book.paperMaterial,
    readTimeHours: book.readTimeHours,
    status: book.status,
    authors: book.bookAuthors.map((item) => ({
      id: item.author.id,
      fullName: item.author.fullName,
      role: item.role,
      authorOrder: item.authorOrder
    })),
    genres: book.bookGenres.map((item) => item.genre),
    tags: book.bookTags.map((item) => item.tag),
    avgFinalScore: stats.avgFinalScore,
    avgArchitecture: stats.avgArchitecture ?? 0,
    avgCharacters: stats.avgCharacters ?? 0,
    avgLanguage: stats.avgLanguage ?? 0,
    avgIdea: stats.avgIdea ?? 0,
    avgVibe: stats.avgVibe ?? 0,
    ratingCount: stats.ratingCount,
    ratingLabel: ratingLabel(stats.avgFinalScore)
  };
}

async function getRatingStatsMap(bookIds) {
  if (!bookIds.length) {
    return new Map();
  }

  const grouped = await prisma.rating.groupBy({
    by: ['bookId'],
    where: {
      bookId: { in: bookIds }
    },
    _avg: {
      finalScore: true,
      architecture: true,
      characters: true,
      language: true,
      idea: true,
      vibe: true
    },
    _count: {
      _all: true
    }
  });

  return new Map(
    grouped.map((item) => [
      item.bookId,
      {
        ratingCount: item._count._all,
        avgFinalScore: Number((item._avg.finalScore ?? 0).toFixed(2)),
        avgArchitecture: Number((item._avg.architecture ?? 0).toFixed(2)),
        avgCharacters: Number((item._avg.characters ?? 0).toFixed(2)),
        avgLanguage: Number((item._avg.language ?? 0).toFixed(2)),
        avgIdea: Number((item._avg.idea ?? 0).toFixed(2)),
        avgVibe: Number((item._avg.vibe ?? 0).toFixed(2))
      }
    ])
  );
}

function normalizeSearchText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeSearchText(value) {
  return normalizeSearchText(value)
    .split(' ')
    .filter((token) => token && (token.length > 1 || /^\d+$/.test(token)) && !searchStopWords.has(token));
}

function countTokenHits(text, tokens) {
  if (!text || !tokens.length) {
    return 0;
  }

  return tokens.reduce((count, token) => count + (text.includes(token) ? 1 : 0), 0);
}

function includesAllTokens(text, tokens) {
  return Boolean(text) && tokens.length > 0 && tokens.every((token) => text.includes(token));
}

function createBookSearchSignals(book) {
  return {
    title: normalizeSearchText(book.title),
    originalTitle: normalizeSearchText(book.originalTitle),
    authors: normalizeSearchText((book.authors ?? []).map((author) => author.fullName).join(' ')),
    genres: normalizeSearchText((book.genres ?? []).map((genre) => genre.name).join(' ')),
    tags: normalizeSearchText((book.tags ?? []).map((tag) => tag.name).join(' ')),
    section: normalizeSearchText(book.catalogSection),
    series: normalizeSearchText(book.series),
    publisher: normalizeSearchText(book.publisher),
    editor: normalizeSearchText(book.editor),
    description: normalizeSearchText(book.description)
  };
}

export function scoreBookTextMatch(book, query) {
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = tokenizeSearchText(query);

  if (!normalizedQuery || !queryTokens.length) {
    return { score: 0, strength: 0 };
  }

  const signals = createBookSearchSignals(book);
  const contextualText = [signals.genres, signals.tags, signals.section, signals.series].filter(Boolean).join(' ');
  let score = 0;
  let strength = 0;

  const mark = (condition, points, nextStrength) => {
    if (!condition) {
      return;
    }

    score += points;
    strength = Math.max(strength, nextStrength);
  };

  mark(signals.title === normalizedQuery, 5000, 3);
  mark(Boolean(signals.originalTitle) && signals.originalTitle === normalizedQuery, 4300, 3);
  mark(Boolean(signals.authors) && signals.authors === normalizedQuery, 3900, 3);
  mark(Boolean(signals.title) && signals.title.startsWith(normalizedQuery) && signals.title !== normalizedQuery, 3200, 3);
  mark(Boolean(signals.originalTitle) && signals.originalTitle.startsWith(normalizedQuery) && signals.originalTitle !== normalizedQuery, 2800, 3);
  mark(Boolean(signals.authors) && signals.authors.includes(normalizedQuery), 2500, 3);
  mark(Boolean(signals.title) && signals.title.includes(normalizedQuery), 2400, 3);
  mark(Boolean(signals.originalTitle) && signals.originalTitle.includes(normalizedQuery), 2200, 3);
  mark(Boolean(signals.series) && signals.series.includes(normalizedQuery), 1100, 2);
  mark(Boolean(signals.section) && signals.section.includes(normalizedQuery), 960, 2);
  mark(Boolean(signals.genres) && signals.genres.includes(normalizedQuery), 920, 2);
  mark(Boolean(signals.tags) && signals.tags.includes(normalizedQuery), 860, 2);
  mark(Boolean(signals.publisher) && signals.publisher.includes(normalizedQuery), 340, 1);
  mark(Boolean(signals.editor) && signals.editor.includes(normalizedQuery), 260, 1);
  mark(Boolean(signals.description) && signals.description.includes(normalizedQuery), 120, 1);

  score += countTokenHits(signals.title, queryTokens) * 180;
  score += countTokenHits(signals.originalTitle, queryTokens) * 150;
  score += countTokenHits(signals.authors, queryTokens) * 135;
  score += countTokenHits(contextualText, queryTokens) * 72;
  score += countTokenHits(signals.publisher, queryTokens) * 24;
  score += countTokenHits(signals.editor, queryTokens) * 18;
  score += countTokenHits(signals.description, queryTokens) * 10;

  if (includesAllTokens(signals.title, queryTokens)) {
    score += 1450;
    strength = Math.max(strength, 3);
  } else if (includesAllTokens(signals.originalTitle, queryTokens)) {
    score += 1200;
    strength = Math.max(strength, 3);
  } else if (includesAllTokens(signals.authors, queryTokens)) {
    score += 1120;
    strength = Math.max(strength, 3);
  } else if (includesAllTokens(contextualText, queryTokens)) {
    score += 520;
    strength = Math.max(strength, 2);
  } else if (includesAllTokens(signals.description, queryTokens)) {
    score += 80;
    strength = Math.max(strength, 1);
  }

  return { score, strength };
}

function buildBookQueryFieldConditions(query) {
  return [
    {
      title: {
        contains: query,
        mode: 'insensitive'
      }
    },
    {
      originalTitle: {
        contains: query,
        mode: 'insensitive'
      }
    },
    {
      description: {
        contains: query,
        mode: 'insensitive'
      }
    },
    {
      catalogSection: {
        contains: query,
        mode: 'insensitive'
      }
    },
    {
      series: {
        contains: query,
        mode: 'insensitive'
      }
    },
    {
      publisher: {
        contains: query,
        mode: 'insensitive'
      }
    },
    {
      editor: {
        contains: query,
        mode: 'insensitive'
      }
    },
    {
      bookAuthors: {
        some: {
          author: {
            fullName: {
              contains: query,
              mode: 'insensitive'
            }
          }
        }
      }
    },
    {
      bookGenres: {
        some: {
          genre: {
            name: {
              contains: query,
              mode: 'insensitive'
            }
          }
        }
      }
    },
    {
      bookTags: {
        some: {
          tag: {
            name: {
              contains: query,
              mode: 'insensitive'
            }
          }
        }
      }
    }
  ];
}

function buildBookQueryCondition(query) {
  const normalizedQuery = String(query ?? '').trim();
  const queryTokens = tokenizeSearchText(normalizedQuery);
  const phraseConditions = buildBookQueryFieldConditions(normalizedQuery);

  if (!queryTokens.length) {
    return {
      OR: phraseConditions
    };
  }

  const tokenConditions = queryTokens.map((token) => ({
    OR: buildBookQueryFieldConditions(token)
  }));

  if (queryTokens.length === 1 && queryTokens[0] === normalizeSearchText(normalizedQuery)) {
    return {
      OR: phraseConditions
    };
  }

  return {
    OR: [
      {
        OR: phraseConditions
      },
      {
        AND: tokenConditions
      }
    ]
  };
}

export function buildBookWhere(filters) {
  const andConditions = [];

  andConditions.push({
    status: ContentStatus.PUBLISHED
  });

  if (filters.query) {
    andConditions.push(buildBookQueryCondition(filters.query));
  }

  if (filters.author) {
    andConditions.push({
      bookAuthors: {
        some: {
          author: {
            fullName: {
              contains: filters.author,
              mode: 'insensitive'
            }
          }
        }
      }
    });
  }

  if (filters.section) {
    andConditions.push({
      OR: [
        {
          catalogSectionSlug: {
            equals: filters.section,
            mode: 'insensitive'
          }
        },
        {
          catalogSection: {
            equals: filters.section,
            mode: 'insensitive'
          }
        }
      ]
    });
  }

  if (filters.genres.length) {
    andConditions.push({
      bookGenres: {
        some: {
          genre: {
            name: {
              in: filters.genres
            }
          }
        }
      }
    });
  }

  if (filters.tags.length) {
    andConditions.push({
      bookTags: {
        some: {
          tag: {
            name: {
              in: filters.tags
            }
          }
        }
      }
    });
  }

  if (filters.language) {
    andConditions.push({
      language: {
        equals: filters.language,
        mode: 'insensitive'
      }
    });
  }

  if (filters.yearFrom || filters.yearTo) {
    andConditions.push({
      publicationYear: {
        gte: filters.yearFrom,
        lte: filters.yearTo
      }
    });
  }

  return { AND: andConditions };
}

function compareBooksBySort(left, right, sort) {
  const normalizedSort = normalizeBookSort(sort, 'newest_desc');
  const leftCreatedAt = new Date(left.createdAt).getTime();
  const rightCreatedAt = new Date(right.createdAt).getTime();

  if (normalizedSort === 'title_asc') {
    return left.title.localeCompare(right.title, 'ru') || rightCreatedAt - leftCreatedAt;
  }

  if (normalizedSort === 'title_desc') {
    return right.title.localeCompare(left.title, 'ru') || rightCreatedAt - leftCreatedAt;
  }

  if (normalizedSort === 'year_desc') {
    return (right.publicationYear ?? 0) - (left.publicationYear ?? 0) || left.title.localeCompare(right.title, 'ru');
  }

  if (normalizedSort === 'year_asc') {
    return (left.publicationYear ?? 0) - (right.publicationYear ?? 0) || left.title.localeCompare(right.title, 'ru');
  }

  if (normalizedSort === 'rating_desc') {
    return right.avgFinalScore - left.avgFinalScore || right.ratingCount - left.ratingCount || left.title.localeCompare(right.title, 'ru');
  }

  if (normalizedSort === 'rating_asc') {
    return left.avgFinalScore - right.avgFinalScore || right.ratingCount - left.ratingCount || left.title.localeCompare(right.title, 'ru');
  }

  if (normalizedSort === 'newest_asc') {
    return leftCreatedAt - rightCreatedAt || left.title.localeCompare(right.title, 'ru');
  }

  return rightCreatedAt - leftCreatedAt || left.title.localeCompare(right.title, 'ru');
}

function sortBooks(items, sort) {
  return [...items].sort((left, right) => compareBooksBySort(left, right, sort));
}

function getBooksOrderBy(sort) {
  const normalizedSort = normalizeBookSort(sort, 'newest_desc');

  if (normalizedSort === 'title_asc') {
    return [{ title: 'asc' }, { createdAt: 'desc' }];
  }

  if (normalizedSort === 'title_desc') {
    return [{ title: 'desc' }, { createdAt: 'desc' }];
  }

  if (normalizedSort === 'year_desc') {
    return [{ publicationYear: { sort: 'desc', nulls: 'last' } }, { title: 'asc' }, { createdAt: 'desc' }];
  }

  if (normalizedSort === 'year_asc') {
    return [{ publicationYear: { sort: 'asc', nulls: 'last' } }, { title: 'asc' }, { createdAt: 'desc' }];
  }

  if (normalizedSort === 'newest_asc') {
    return [{ createdAt: 'asc' }, { title: 'asc' }];
  }

  return [{ createdAt: 'desc' }, { title: 'asc' }];
}

export function rankBooksByQuery(items, query, sort = 'newest') {
  const rankedItems = items.map((book) => ({
    ...book,
    _searchMatch: scoreBookTextMatch(book, query)
  }));
  const hasStrongMatches = rankedItems.some((book) => book._searchMatch.strength >= 3);
  const hasContextMatches = rankedItems.some((book) => book._searchMatch.strength >= 2);

  const filteredItems = rankedItems.filter((book) => {
    if (book._searchMatch.score <= 0) {
      return false;
    }

    if (hasStrongMatches) {
      return book._searchMatch.strength >= 2 || book._searchMatch.score >= 900;
    }

    if (hasContextMatches) {
      return book._searchMatch.strength >= 1 || book._searchMatch.score >= 180;
    }

    return true;
  });

  return filteredItems
    .sort(
      (left, right) =>
        right._searchMatch.score - left._searchMatch.score ||
        right._searchMatch.strength - left._searchMatch.strength ||
        compareBooksBySort(left, right, sort)
    )
    .map(({ _searchMatch, ...book }) => book);
}

export async function listBooks(filters) {
  const normalizedSort = normalizeBookSort(filters.sort, 'newest_desc');
  const where = buildBookWhere(filters);
  const needsFullScan =
    Boolean(filters.query) ||
    filters.minRating !== undefined ||
    filters.maxRating !== undefined ||
    normalizedSort === 'rating_desc' ||
    normalizedSort === 'rating_asc';
  const { page, limit, skip } = getPagination(filters);

  if (!needsFullScan) {
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: bookListInclude,
        skip,
        take: limit,
        orderBy: getBooksOrderBy(normalizedSort)
      }),
      prisma.book.count({ where })
    ]);
    const statsByBookId = await getRatingStatsMap(books.map((book) => book.id));
    const items = books.map((book) => ({
      ...book,
      ...mapBookCard(book, statsByBookId)
    }));

    return toPageResponse({
      items,
      total,
      page,
      limit
    });
  }

  const books = await prisma.book.findMany({
    where,
    include: bookListInclude
  });
  const statsByBookId = await getRatingStatsMap(books.map((book) => book.id));

  let items = books.map((book) => ({
    ...book,
    ...mapBookCard(book, statsByBookId)
  }));

  if (filters.minRating !== undefined || filters.maxRating !== undefined) {
    items = items.filter((book) => {
      if (filters.minRating !== undefined && book.avgFinalScore < filters.minRating) {
        return false;
      }

      if (filters.maxRating !== undefined && book.avgFinalScore > filters.maxRating) {
        return false;
      }

      return true;
    });
  }

  items = filters.query ? rankBooksByQuery(items, filters.query, normalizedSort) : sortBooks(items, normalizedSort);

  const total = items.length;
  const pagedItems = items.slice(skip, skip + limit);

  return toPageResponse({
    items: pagedItems,
    total,
    page,
    limit
  });
}

export async function getBookById(id) {
  const book = await prisma.book.findFirst({
    where: {
      id,
      status: ContentStatus.PUBLISHED
    },
    include: {
      ...bookListInclude,
      reviews: {
        where: {
          status: ContentStatus.PUBLISHED,
          user: {
            showReviews: true
          }
        },
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true }
          },
          comments: {
            where: { status: ContentStatus.PUBLISHED },
            include: {
              user: {
                select: { id: true, username: true }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      articles: {
        where: { status: ContentStatus.PUBLISHED },
        include: {
          user: {
            select: { id: true, username: true }
          },
          comments: {
            where: { status: ContentStatus.PUBLISHED },
            include: {
              user: {
                select: { id: true, username: true }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!book) {
    throw ApiError.notFound('Book not found');
  }

  const stats = (await getRatingStatsMap([book.id])).get(book.id) ?? {
    ratingCount: 0,
    avgFinalScore: 0,
    avgArchitecture: 0,
    avgCharacters: 0,
    avgLanguage: 0,
    avgIdea: 0,
    avgVibe: 0
  };

  return {
    ...mapBookCard(book, new Map([[book.id, stats]])),
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
    reviews: book.reviews,
    articles: book.articles,
    ratingStats: stats
  };
}

export async function getBookFragment(id) {
  const book = await getFragmentBookById(id);
  const fragment = await resolveBookFragment(book);

  return {
    bookId: book.id,
    title: book.title,
    ...fragment
  };
}

export async function getBookFragmentFile(id) {
  const fragment = await getBookFragment(id);

  if (!fragment.available || !fragment.pdfUrl) {
    throw ApiError.notFound('Fragment not available');
  }

  const response = await fetch(fragment.pdfUrl, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; BookpoiskFragmentProxy/1.0)',
      accept: 'application/pdf',
      'accept-language': 'ru-RU,ru;q=0.9,en;q=0.8'
    },
    signal: AbortSignal.timeout(remoteRequestTimeoutMs)
  });

  if (!response.ok || !response.body) {
    throw new ApiError(502, 'Failed to load fragment');
  }

  return {
    body: response.body,
    contentType: response.headers.get('content-type') ?? 'application/pdf',
    contentLength: response.headers.get('content-length'),
    lastModified: response.headers.get('last-modified')
  };
}

async function replaceBookRelations(tx, bookId, payload) {
  if (payload.authorIds) {
    await tx.bookAuthor.deleteMany({ where: { bookId } });
    if (payload.authorIds.length) {
      await tx.bookAuthor.createMany({
        data: payload.authorIds.map((authorId, index) => ({
          bookId,
          authorId,
          authorOrder: index + 1
        }))
      });
    }
  }

  if (payload.genreIds) {
    await tx.bookGenre.deleteMany({ where: { bookId } });
    if (payload.genreIds.length) {
      await tx.bookGenre.createMany({
        data: payload.genreIds.map((genreId) => ({
          bookId,
          genreId
        }))
      });
    }
  }

  if (payload.tagIds) {
    await tx.bookTag.deleteMany({ where: { bookId } });
    if (payload.tagIds.length) {
      await tx.bookTag.createMany({
        data: payload.tagIds.map((tagId) => ({
          bookId,
          tagId
        }))
      });
    }
  }
}

function extractBookData(payload, userId) {
  return {
    title: payload.title,
    originalTitle: payload.originalTitle,
    description: payload.description,
    isbn13: payload.isbn13,
    catalogSection: payload.catalogSection,
    catalogSectionSlug: payload.catalogSectionSlug,
    publicationYear: payload.publicationYear,
    language: payload.language,
    coverUrl: payload.coverUrl,
    sourceSite: payload.sourceSite,
    sourceUrl: payload.sourceUrl,
    series: payload.series,
    publisher: payload.publisher,
    editor: payload.editor,
    ageRestriction: payload.ageRestriction,
    binding: payload.binding,
    pageCount: payload.pageCount,
    weightGrams: payload.weightGrams,
    thicknessMm: payload.thicknessMm,
    bookFormat: payload.bookFormat,
    paperMaterial: payload.paperMaterial,
    readTimeHours: payload.readTimeHours,
    status: payload.status,
    addedByUserId: userId
  };
}

export async function createBook(payload, userId) {
  return prisma.$transaction(async (tx) => {
    const book = await tx.book.create({
      data: extractBookData(payload, userId)
    });

    await replaceBookRelations(tx, book.id, payload);

    return tx.book.findUnique({
      where: { id: book.id },
      include: bookListInclude
    });
  });
}

export async function updateBook(id, payload, userId) {
  return prisma.$transaction(async (tx) => {
    await tx.book.update({
      where: { id },
      data: {
        ...extractBookData(
          {
            ...payload,
            status: payload.status
          },
          userId
        )
      }
    });

    await replaceBookRelations(tx, id, payload);

    return tx.book.findUnique({
      where: { id },
      include: bookListInclude
    });
  });
}

export async function updateBookStatus(id, status) {
  return prisma.book.update({
    where: { id },
    data: { status }
  });
}

export async function deleteBook(id) {
  await prisma.book.delete({
    where: { id }
  });
}

export async function getNoveltyFeed() {
  try {
    const raw = await fs.readFile(noveltyFeedPath, 'utf8');
    const items = JSON.parse(raw);

    if (!Array.isArray(items)) {
      return [];
    }

    const bookIds = items.map((item) => item.bookId).filter(Boolean);
    const existingBookIds = new Set(
      (
        await prisma.book.findMany({
          where: {
            id: {
              in: bookIds
            }
          },
          select: {
            id: true
          }
        })
      ).map((book) => book.id)
    );
    const filteredItems = items.filter((item) => {
      const normalizedTitle = String(item?.title ?? '').toLowerCase();

      if (/\u043a\u043e\u043c\u043f\u043b\u0435\u043a\u0442/u.test(normalizedTitle)) {
        return false;
      }

      if (item?.bookId && !existingBookIds.has(item.bookId)) {
        return false;
      }

      return true;
    });
    const statsByBookId = await getRatingStatsMap(filteredItems.map((item) => item.bookId).filter(Boolean));

    return filteredItems.map((item) => {
      const stats = item.bookId ? statsByBookId.get(item.bookId) : null;
      const avgFinalScore = stats?.avgFinalScore ?? 0;
      const ratingCount = stats?.ratingCount ?? 0;

      return {
        ...item,
        avgFinalScore,
        ratingLabel: ratingCount ? ratingLabel(avgFinalScore) : null
      };
    });
  } catch {
    return [];
  }
}
