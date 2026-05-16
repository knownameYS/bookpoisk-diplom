import { z } from 'zod';
import { createBookSortSchema } from '../../common/book-sort.js';

const searchQuerySchema = z.object({
  query: z.string().trim().optional(),
  author: z.string().trim().optional(),
  section: z.string().trim().optional(),
  origin: z.enum(['foreign', 'russian']).optional(),
  genres: z.array(z.string().trim()).default([]),
  tags: z.array(z.string().trim()).default([]),
  language: z.string().trim().optional(),
  yearFrom: z.number().int().optional(),
  yearTo: z.number().int().optional(),
  minRating: z.number().min(0).max(84).optional(),
  maxRating: z.number().min(0).max(84).optional(),
  sort: createBookSortSchema('newest_desc'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(8)
});

export const searchSchema = {
  query: z.object({
    query: z.string().trim().optional(),
    author: z.string().trim().optional(),
    section: z.string().trim().optional(),
    origin: z.enum(['foreign', 'russian']).optional(),
    genres: z
      .string()
      .optional()
      .transform((value) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [])),
    tags: z
      .string()
      .optional()
      .transform((value) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [])),
    language: z.string().trim().optional(),
    yearFrom: z.coerce.number().int().optional(),
    yearTo: z.coerce.number().int().optional(),
    minRating: z.coerce.number().min(0).max(84).optional(),
    maxRating: z.coerce.number().min(0).max(84).optional(),
    sort: createBookSortSchema('newest_desc'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(8)
  })
};

export const aiSearchSchema = {
  body: z.object({
    prompt: z.string().trim().min(3).max(1000),
    filters: searchQuerySchema.partial().optional()
  })
};

export const normalizedSearchSchema = searchQuerySchema;
