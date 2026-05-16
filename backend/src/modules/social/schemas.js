import { z } from 'zod';

const id = z.string().uuid();
const readingShelfKey = z.enum(['want-to-read', 'read', 'stopped-reading']);

export const favoriteBookSchema = {
  params: z.object({
    bookId: id
  })
};

export const listCollectionsSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(12)
  })
};

export const collectionIdSchema = {
  params: z.object({
    id
  })
};

export const createCollectionSchema = {
  body: z.object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(4000).optional(),
    isPublic: z.boolean().default(false)
  })
};

export const updateCollectionSchema = {
  params: z.object({
    id
  }),
  body: createCollectionSchema.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  })
};

export const addCollectionBookSchema = {
  params: z.object({
    id
  }),
  body: z.object({
    bookId: id,
    note: z.string().trim().max(2000).optional()
  })
};

export const updateCollectionBookSchema = {
  params: z.object({
    id,
    bookId: id
  }),
  body: z.object({
    note: z.string().trim().max(2000).optional()
  })
};

export const collectionBookIdSchema = {
  params: z.object({
    id,
    bookId: id
  })
};

export const readingShelfStatusSchema = {
  params: z.object({
    bookId: id
  })
};

export const readingShelfAssignmentSchema = {
  params: z.object({
    shelfKey: readingShelfKey,
    bookId: id
  })
};
