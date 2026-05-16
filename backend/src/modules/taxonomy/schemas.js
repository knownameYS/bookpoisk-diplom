import { z } from 'zod';

const idParam = z.object({
  id: z.string().uuid()
});

const listQuery = z.object({
  query: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20)
});

export const listTaxonomySchema = {
  query: listQuery
};

export const taxonomyIdSchema = {
  params: idParam
};

export const createAuthorSchema = {
  body: z.object({
    fullName: z.string().trim().min(2).max(120),
    birthDate: z.string().date().optional(),
    deathDate: z.string().date().optional(),
    bio: z.string().trim().max(4000).optional()
  })
};

export const updateAuthorSchema = {
  params: idParam,
  body: createAuthorSchema.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  })
};

export const createGenreSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().max(1000).optional()
  })
};

export const updateGenreSchema = {
  params: idParam,
  body: createGenreSchema.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  })
};

export const createTagSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(80)
  })
};

export const updateTagSchema = {
  params: idParam,
  body: createTagSchema.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  })
};
