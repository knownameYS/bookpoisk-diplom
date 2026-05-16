import { Router } from 'express';
import { asyncHandler } from '../../common/async-handler.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { bookIdSchema, updateBookStatusSchema } from '../books/schemas.js';
import { moderationStatusSchema } from '../content/schemas.js';
import { adminListSchema, moderationListSchema } from './schemas.js';
import {
  books,
  dashboard,
  listArticleCommentModeration,
  listArticleModeration,
  listReviewCommentModeration,
  listReviewModeration,
  moderateArticle,
  moderateArticleComment,
  moderateBook,
  moderateReview,
  moderateReviewComment,
  users
} from './controller.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get('/dashboard', asyncHandler(dashboard));
adminRouter.get('/users', validate(adminListSchema), asyncHandler(users));
adminRouter.get('/books', validate(adminListSchema), asyncHandler(books));
adminRouter.get('/moderation/reviews', validate(moderationListSchema), asyncHandler(listReviewModeration));
adminRouter.get('/moderation/articles', validate(moderationListSchema), asyncHandler(listArticleModeration));
adminRouter.get('/moderation/review-comments', validate(moderationListSchema), asyncHandler(listReviewCommentModeration));
adminRouter.get('/moderation/article-comments', validate(moderationListSchema), asyncHandler(listArticleCommentModeration));
adminRouter.patch('/books/:id/status', validate(updateBookStatusSchema), asyncHandler(moderateBook));
adminRouter.patch('/reviews/:id/status', validate(moderationStatusSchema), asyncHandler(moderateReview));
adminRouter.patch('/articles/:id/status', validate(moderationStatusSchema), asyncHandler(moderateArticle));
adminRouter.patch('/review-comments/:id/status', validate(moderationStatusSchema), asyncHandler(moderateReviewComment));
adminRouter.patch('/article-comments/:id/status', validate(moderationStatusSchema), asyncHandler(moderateArticleComment));
