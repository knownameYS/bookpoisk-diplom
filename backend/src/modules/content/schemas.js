import { z } from 'zod';

const id = z.string().uuid();
const statusEnum = z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']);

export const listReviewsSchema = {
  query: z.object({
    bookId: id.optional(),
    sort: z.enum(['newest', 'oldest', 'likes_desc', 'likes_asc']).default('newest'),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10)
  })
};

export const reviewIdSchema = {
  params: z.object({
    id
  })
};

export const createReviewSchema = {
  body: z.object({
    bookId: id,
    title: z.string().trim().min(3).max(200),
    body: z.string().trim().min(20).max(10000),
    isSpoiler: z.boolean().default(false),
    status: statusEnum.default('PUBLISHED')
  })
};

export const updateReviewSchema = {
  params: z.object({
    id
  }),
  body: createReviewSchema.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  })
};

export const createReviewCommentSchema = {
  params: z.object({
    reviewId: id
  }),
  body: z.object({
    body: z.string().trim().min(2).max(3000),
    status: statusEnum.default('PUBLISHED')
  })
};

export const updateReviewCommentSchema = {
  params: z.object({
    reviewId: id,
    commentId: id
  }),
  body: z
    .object({
      body: z.string().trim().min(2).max(3000).optional(),
      status: statusEnum.optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field must be provided'
    })
};

export const reviewCommentIdSchema = {
  params: z.object({
    reviewId: id,
    commentId: id
  })
};

export const reviewReactionSchema = {
  params: z.object({
    id
  }),
  body: z.object({
    type: z.enum(['LIKE', 'DISLIKE'])
  })
};

export const listArticlesSchema = {
  query: z.object({
    bookId: id.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10)
  })
};

export const articleIdSchema = {
  params: z.object({
    id
  })
};

export const createArticleSchema = {
  body: z.object({
    bookId: id.optional(),
    title: z.string().trim().min(3).max(200),
    body: z.string().trim().min(50).max(20000),
    status: statusEnum.default('PUBLISHED')
  })
};

export const updateArticleSchema = {
  params: z.object({
    id
  }),
  body: createArticleSchema.body.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  })
};

export const createArticleCommentSchema = {
  params: z.object({
    articleId: id
  }),
  body: z.object({
    body: z.string().trim().min(2).max(3000),
    status: statusEnum.default('PUBLISHED')
  })
};

export const updateArticleCommentSchema = {
  params: z.object({
    articleId: id,
    commentId: id
  }),
  body: z
    .object({
      body: z.string().trim().min(2).max(3000).optional(),
      status: statusEnum.optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field must be provided'
    })
};

export const articleCommentIdSchema = {
  params: z.object({
    articleId: id,
    commentId: id
  })
};

export const moderationStatusSchema = {
  params: z.object({
    id
  }),
  body: z.object({
    status: statusEnum
  })
};
