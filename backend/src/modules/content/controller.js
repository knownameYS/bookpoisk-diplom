import {
  createArticle,
  createArticleComment,
  createReview,
  createReviewComment,
  deleteArticle,
  deleteArticleComment,
  deleteReview,
  deleteReviewComment,
  getArticle,
  getReview,
  listArticles,
  listModerationQueue,
  listReviews,
  moderateEntity,
  reactToReview,
  updateArticle,
  updateArticleComment,
  updateReview,
  updateReviewComment
} from './service.js';

export async function listReviewsAction(req, res) {
  const data = await listReviews(req.validated.query, req.user);
  res.json(data);
}

export async function getReviewAction(req, res) {
  const item = await getReview(req.validated.params.id, req.user);
  res.json({ item });
}

export async function createReviewAction(req, res) {
  const item = await createReview(req.user.sub, req.validated.body);
  res.status(201).json({ item });
}

export async function updateReviewAction(req, res) {
  const item = await updateReview(req.validated.params.id, req.user, req.validated.body);
  res.json({ item });
}

export async function deleteReviewAction(req, res) {
  await deleteReview(req.validated.params.id, req.user);
  res.status(204).send();
}

export async function reactToReviewAction(req, res) {
  const item = await reactToReview(req.validated.params.id, req.user.sub, req.validated.body.type);
  res.json({ item });
}

export async function createReviewCommentAction(req, res) {
  const item = await createReviewComment(req.validated.params.reviewId, req.user.sub, req.validated.body);
  res.status(201).json({ item });
}

export async function updateReviewCommentAction(req, res) {
  const item = await updateReviewComment(
    req.validated.params.reviewId,
    req.validated.params.commentId,
    req.user,
    req.validated.body
  );
  res.json({ item });
}

export async function deleteReviewCommentAction(req, res) {
  await deleteReviewComment(req.validated.params.reviewId, req.validated.params.commentId, req.user);
  res.status(204).send();
}

export async function listArticlesAction(req, res) {
  const data = await listArticles(req.validated.query);
  res.json(data);
}

export async function getArticleAction(req, res) {
  const item = await getArticle(req.validated.params.id, req.user);
  res.json({ item });
}

export async function createArticleAction(req, res) {
  const item = await createArticle(req.user.sub, req.validated.body);
  res.status(201).json({ item });
}

export async function updateArticleAction(req, res) {
  const item = await updateArticle(req.validated.params.id, req.user, req.validated.body);
  res.json({ item });
}

export async function deleteArticleAction(req, res) {
  await deleteArticle(req.validated.params.id, req.user);
  res.status(204).send();
}

export async function createArticleCommentAction(req, res) {
  const item = await createArticleComment(req.validated.params.articleId, req.user.sub, req.validated.body);
  res.status(201).json({ item });
}

export async function updateArticleCommentAction(req, res) {
  const item = await updateArticleComment(
    req.validated.params.articleId,
    req.validated.params.commentId,
    req.user,
    req.validated.body
  );
  res.json({ item });
}

export async function deleteArticleCommentAction(req, res) {
  await deleteArticleComment(req.validated.params.articleId, req.validated.params.commentId, req.user);
  res.status(204).send();
}

export function createModerationQueueAction(type) {
  return async (req, res) => {
    const data = await listModerationQueue(type, req.query);
    res.json(data);
  };
}

export function createModerateEntityAction(type) {
  return async (req, res) => {
    const item = await moderateEntity(type, req.validated.params.id, req.validated.body.status);
    res.json({ item });
  };
}
