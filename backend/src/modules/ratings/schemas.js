import { z } from 'zod';

const score = z.number().int().min(1).max(10);

export const upsertRatingSchema = {
  params: z.object({
    bookId: z.string().uuid()
  }),
  body: z.object({
    architecture: score,
    characters: score,
    language: score,
    idea: score,
    vibe: score,
    reviewBody: z.string().trim().min(150).max(10000).optional()
  })
};

export const bookRatingIdSchema = {
  params: z.object({
    bookId: z.string().uuid()
  })
};
