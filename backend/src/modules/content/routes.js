import { Router } from 'express';
import { asyncHandler } from '../../common/async-handler.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  articleCommentIdSchema,
  articleIdSchema,
  createArticleCommentSchema,
  createArticleSchema,
  createReviewCommentSchema,
  createReviewSchema,
  listArticlesSchema,
  listReviewsSchema,
  reviewReactionSchema,
  reviewCommentIdSchema,
  reviewIdSchema,
  updateArticleCommentSchema,
  updateArticleSchema,
  updateReviewCommentSchema,
  updateReviewSchema
} from './schemas.js';
import {
  createArticleAction,
  createArticleCommentAction,
  createReviewAction,
  createReviewCommentAction,
  deleteArticleAction,
  deleteArticleCommentAction,
  deleteReviewAction,
  deleteReviewCommentAction,
  getArticleAction,
  reactToReviewAction,
  getReviewAction,
  listArticlesAction,
  listReviewsAction,
  updateArticleAction,
  updateArticleCommentAction,
  updateReviewAction,
  updateReviewCommentAction
} from './controller.js';

export const reviewsRouter = Router();
export const articlesRouter = Router();

reviewsRouter.get('/', optionalAuth, validate(listReviewsSchema), asyncHandler(listReviewsAction));
reviewsRouter.get('/:id', optionalAuth, validate(reviewIdSchema), asyncHandler(getReviewAction));
reviewsRouter.post('/', requireAuth, validate(createReviewSchema), asyncHandler(createReviewAction));
reviewsRouter.patch('/:id', requireAuth, validate(updateReviewSchema), asyncHandler(updateReviewAction));
reviewsRouter.delete('/:id', requireAuth, validate(reviewIdSchema), asyncHandler(deleteReviewAction));
reviewsRouter.put('/:id/reaction', requireAuth, validate(reviewReactionSchema), asyncHandler(reactToReviewAction));
reviewsRouter.post('/:reviewId/comments', requireAuth, validate(createReviewCommentSchema), asyncHandler(createReviewCommentAction));
reviewsRouter.patch(
  '/:reviewId/comments/:commentId',
  requireAuth,
  validate(updateReviewCommentSchema),
  asyncHandler(updateReviewCommentAction)
);
reviewsRouter.delete(
  '/:reviewId/comments/:commentId',
  requireAuth,
  validate(reviewCommentIdSchema),
  asyncHandler(deleteReviewCommentAction)
);

articlesRouter.get('/', validate(listArticlesSchema), asyncHandler(listArticlesAction));
articlesRouter.get('/:id', validate(articleIdSchema), asyncHandler(getArticleAction));
articlesRouter.post('/', requireAuth, validate(createArticleSchema), asyncHandler(createArticleAction));
articlesRouter.patch('/:id', requireAuth, validate(updateArticleSchema), asyncHandler(updateArticleAction));
articlesRouter.delete('/:id', requireAuth, validate(articleIdSchema), asyncHandler(deleteArticleAction));
articlesRouter.post(
  '/:articleId/comments',
  requireAuth,
  validate(createArticleCommentSchema),
  asyncHandler(createArticleCommentAction)
);
articlesRouter.patch(
  '/:articleId/comments/:commentId',
  requireAuth,
  validate(updateArticleCommentSchema),
  asyncHandler(updateArticleCommentAction)
);
articlesRouter.delete(
  '/:articleId/comments/:commentId',
  requireAuth,
  validate(articleCommentIdSchema),
  asyncHandler(deleteArticleCommentAction)
);
