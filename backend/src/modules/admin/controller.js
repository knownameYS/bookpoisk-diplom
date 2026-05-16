import { prisma } from '../../lib/prisma.js';
import { createModerateEntityAction, createModerationQueueAction } from '../content/controller.js';
import { updateBookStatus } from '../books/service.js';
import { listAdminBooks, listAdminUsers } from './service.js';

export async function dashboard(req, res) {
  const [users, books, reviews, articles, comments, collections] = await Promise.all([
    prisma.user.count(),
    prisma.book.count(),
    prisma.review.count(),
    prisma.article.count(),
    Promise.all([prisma.reviewComment.count(), prisma.articleComment.count()]).then(([reviewComments, articleComments]) => reviewComments + articleComments),
    prisma.collection.count()
  ]);

  res.json({
    stats: {
      users,
      books,
      reviews,
      articles,
      comments,
      collections
    }
  });
}

export async function users(req, res) {
  const data = await listAdminUsers(req.validated.query);
  res.json(data);
}

export async function books(req, res) {
  const data = await listAdminBooks(req.validated.query);
  res.json(data);
}

export const listReviewModeration = createModerationQueueAction('reviews');
export const listArticleModeration = createModerationQueueAction('articles');
export const listReviewCommentModeration = createModerationQueueAction('reviewComments');
export const listArticleCommentModeration = createModerationQueueAction('articleComments');
export const moderateReview = createModerateEntityAction('review');
export const moderateArticle = createModerateEntityAction('article');
export const moderateReviewComment = createModerateEntityAction('reviewComment');
export const moderateArticleComment = createModerateEntityAction('articleComment');

export async function moderateBook(req, res) {
  const item = await updateBookStatus(req.validated.params.id, req.validated.body.status);
  res.json({ item });
}
