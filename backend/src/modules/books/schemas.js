import { z } from 'zod';
import { createBookSortSchema } from '../../common/book-sort.js';

function parseArray(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

const idParam = z.object({
  id: z.string().uuid()
});

const ratingScore = z.coerce.number().min(0).max(84);

export const listBooksSchema = {
  query: z.object({
    query: z.string().trim().optional(),
    author: z.string().trim().optional(),
    section: z.string().trim().optional(),
    genres: z.preprocess(parseArray, z.array(z.string().trim()).default([])),
    tags: z.preprocess(parseArray, z.array(z.string().trim()).default([])),
    language: z.string().trim().optional(),
    yearFrom: z.coerce.number().int().optional(),
    yearTo: z.coerce.number().int().optional(),
    minRating: ratingScore.optional(),
    maxRating: ratingScore.optional(),
    sort: createBookSortSchema('newest_desc'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(12)
  })
};

const relationIds = z.array(z.string().uuid()).default([]);

export const createBookSchema = {
  body: z.object({
    title: z.string().trim().min(1).max(240),
    originalTitle: z.string().trim().max(240).optional(),
    description: z.string().trim().max(5000).optional(),
    isbn13: z.string().trim().max(32).optional(),
    catalogSection: z.string().trim().max(120).optional(),
    catalogSectionSlug: z.string().trim().max(120).optional(),
    publicationYear: z.number().int().min(0).max(3000).optional(),
    language: z.string().trim().max(64).optional(),
    coverUrl: z.string().trim().url().optional(),
    sourceSite: z.string().trim().max(64).optional(),
    sourceUrl: z.string().trim().url().max(1000).optional(),
    series: z.string().trim().max(240).optional(),
    publisher: z.string().trim().max(240).optional(),
    editor: z.string().trim().max(240).optional(),
    ageRestriction: z.string().trim().max(32).optional(),
    binding: z.string().trim().max(120).optional(),
    pageCount: z.number().int().min(1).max(10000).optional(),
    weightGrams: z.number().int().min(1).max(100000).optional(),
    thicknessMm: z.number().int().min(1).max(10000).optional(),
    bookFormat: z.string().trim().max(120).optional(),
    paperMaterial: z.string().trim().max(120).optional(),
    readTimeHours: z.number().min(0).max(10000).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).default('PUBLISHED'),
    authorIds: relationIds,
    genreIds: relationIds,
    tagIds: relationIds
  })
};

export const updateBookSchema = {
  params: idParam,
  body: createBookSchema.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  })
};

export const bookIdSchema = {
  params: idParam
};

export const updateBookStatusSchema = {
  params: idParam,
  body: z.object({
    status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN'])
  })
};
