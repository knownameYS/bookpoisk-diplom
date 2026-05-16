import { z } from 'zod';

export const moderationListSchema = {
  query: z.object({
    status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20)
  })
};

export const adminListSchema = {
  query: z.object({
    query: z.string().trim().optional().default(''),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20)
  })
};
