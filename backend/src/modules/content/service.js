import { ContentStatus, ReviewReactionType } from '@prisma/client';
import { ApiError } from '../../common/api-error.js';
import { getPagination, toPageResponse } from '../../common/pagination.js';
import { prisma } from '../../lib/prisma.js';

function isAdmin(user) {
  return user?.role === 'ADMIN';
}

function ensureOwnerOrAdmin(user, ownerId) {
  if (isAdmin(user) || user.sub === ownerId) {
    return;
  }

  throw ApiError.forbidden('You can only modify your own content');
}

function statusVisibilityWhere(user) {
  if (isAdmin(user)) {
    return undefined;
  }

  return ContentStatus.PUBLISHED;
}

const reviewInclude = {
  user: {
    select: { id: true, username: true, role: true }
  },
  comments: {
    include: {
      user: {
        select: { id: true, username: true, role: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  },
  book: {
    select: { id: true, title: true }
  }
};

const articleInclude = {
  user: {
    select: { id: true, username: true, role: true }
  },
  comments: {
    include: {
      user: {
        select: { id: true, username: true, role: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  },
  book: {
    select: { id: true, title: true }
  }
};

function normalizeReactionSummary(summary) {
  return {
    likesCount: summary?.likesCount ?? 0,
    dislikesCount: summary?.dislikesCount ?? 0
  };
}

async function getReactionSummaryMaps(reviewIds, viewerId) {
  if (!reviewIds.length) {
    return {
      summaryByReviewId: new Map(),
      viewerReactionByReviewId: new Map()
    };
  }

  const [groupedReactions, viewerReactions] = await Promise.all([
    prisma.reviewReaction.groupBy({
      by: ['reviewId', 'type'],
      where: {
        reviewId: {
          in: reviewIds
        }
      },
      _count: {
        _all: true
      }
    }),
    viewerId
      ? prisma.reviewReaction.findMany({
          where: {
            userId: viewerId,
            reviewId: {
              in: reviewIds
            }
          },
          select: {
            reviewId: true,
            type: true
          }
        })
      : []
  ]);

  const summaryByReviewId = new Map();

  for (const item of groupedReactions) {
    const current = normalizeReactionSummary(summaryByReviewId.get(item.reviewId));

    if (item.type === ReviewReactionType.LIKE) {
      current.likesCount = item._count._all;
    }

    if (item.type === ReviewReactionType.DISLIKE) {
      current.dislikesCount = item._count._all;
    }

    summaryByReviewId.set(item.reviewId, current);
  }

  const viewerReactionByReviewId = new Map(
    viewerReactions.map((reaction) => [reaction.reviewId, reaction.type])
  );

  return {
    summaryByReviewId,
    viewerReactionByReviewId
  };
}

async function attachReactionSummaries(reviews, viewerId) {
  const { summaryByReviewId, viewerReactionByReviewId } = await getReactionSummaryMaps(
    reviews.map((review) => review.id),
    viewerId
  );

  return reviews.map((review) => ({
    ...review,
    reactionSummary: {
      ...normalizeReactionSummary(summaryByReviewId.get(review.id)),
      userReaction: viewerReactionByReviewId.get(review.id) ?? null
    }
  }));
}

function sortReviewsByReactionSummary(items, sort) {
  const direction = sort === 'likes_asc' ? 1 : -1;

  return [...items].sort((left, right) => {
    const leftSummary = normalizeReactionSummary(left.reactionSummary);
    const rightSummary = normalizeReactionSummary(right.reactionSummary);

    return (
      direction * (leftSummary.likesCount - rightSummary.likesCount) ||
      rightSummary.dislikesCount - leftSummary.dislikesCount ||
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  });
}

export async function listReviews(filters, user) {
  const { page, limit, skip } = getPagination(filters);
  return listReviewsWithSorting(
    {
      ...filters,
      viewerId: user?.sub ?? null
    },
    { page, limit, skip }
  );
}

export async function getReview(id, user) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: reviewInclude
  });

  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  if (review.status !== ContentStatus.PUBLISHED && !isAdmin(user) && user?.sub !== review.userId) {
    throw ApiError.notFound('Review not found');
  }

  const [reviewWithReactions] = await attachReactionSummaries(
    [
      {
        ...review,
        comments: review.comments.filter(
          (comment) => comment.status === ContentStatus.PUBLISHED || isAdmin(user) || comment.userId === user?.sub
        )
      }
    ],
    user?.sub ?? null
  );

  return reviewWithReactions;
}

async function listReviewsWithSorting(filters, pagination) {
  const where = {
    status: ContentStatus.PUBLISHED,
    ...(filters.bookId ? { bookId: filters.bookId } : {})
  };

  const needsReactionSorting = filters.sort === 'likes_desc' || filters.sort === 'likes_asc';

  const reviews = await prisma.review.findMany({
    where,
    ...(needsReactionSorting
      ? {}
      : {
          skip: pagination.skip,
          take: pagination.limit,
          orderBy: {
            createdAt: filters.sort === 'oldest' ? 'asc' : 'desc'
          }
        }),
    include: reviewInclude
  });

  const reviewsWithReactions = await attachReactionSummaries(reviews, filters.viewerId ?? null);
  const sortedItems = needsReactionSorting
    ? sortReviewsByReactionSummary(reviewsWithReactions, filters.sort)
    : reviewsWithReactions;
  const total = sortedItems.length;
  const items = needsReactionSorting
    ? sortedItems.slice(pagination.skip, pagination.skip + pagination.limit)
    : sortedItems;

  return toPageResponse({ items, total, page: pagination.page, limit: pagination.limit });
}

export async function reactToReview(id, userId, type) {
  const review = await prisma.review.findUnique({
    where: { id },
    select: {
      id: true,
      status: true
    }
  });

  if (!review || review.status !== ContentStatus.PUBLISHED) {
    throw ApiError.notFound('Review not found');
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.reviewReaction.findUnique({
      where: {
        reviewId_userId: {
          reviewId: id,
          userId
        }
      }
    });

    if (existing?.type === type) {
      await tx.reviewReaction.delete({
        where: {
          reviewId_userId: {
            reviewId: id,
            userId
          }
        }
      });
      return;
    }

    await tx.reviewReaction.upsert({
      where: {
        reviewId_userId: {
          reviewId: id,
          userId
        }
      },
      create: {
        reviewId: id,
        userId,
        type
      },
      update: {
        type
      }
    });
  });

  const { summaryByReviewId, viewerReactionByReviewId } = await getReactionSummaryMaps([id], userId);

  return {
    id,
    reactionSummary: {
      ...normalizeReactionSummary(summaryByReviewId.get(id)),
      userReaction: viewerReactionByReviewId.get(id) ?? null
    }
  };
}

export async function createReview(userId, payload) {
  return prisma.review.create({
    data: {
      userId,
      bookId: payload.bookId,
      title: payload.title,
      body: payload.body,
      isSpoiler: payload.isSpoiler,
      status: payload.status
    },
    include: reviewInclude
  });
}

export async function updateReview(id, user, payload) {
  const review = await prisma.review.findUnique({
    where: { id }
  });

  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  ensureOwnerOrAdmin(user, review.userId);

  return prisma.review.update({
    where: { id },
    data: payload,
    include: reviewInclude
  });
}

export async function deleteReview(id, user) {
  const review = await prisma.review.findUnique({
    where: { id }
  });

  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  ensureOwnerOrAdmin(user, review.userId);

  await prisma.review.delete({
    where: { id }
  });
}

export async function createReviewComment(reviewId, userId, payload) {
  return prisma.reviewComment.create({
    data: {
      reviewId,
      userId,
      body: payload.body,
      status: payload.status
    },
    include: {
      user: {
        select: { id: true, username: true, role: true }
      }
    }
  });
}

export async function updateReviewComment(reviewId, commentId, user, payload) {
  const comment = await prisma.reviewComment.findFirst({
    where: { id: commentId, reviewId }
  });

  if (!comment) {
    throw ApiError.notFound('Review comment not found');
  }

  ensureOwnerOrAdmin(user, comment.userId);

  return prisma.reviewComment.update({
    where: { id: commentId },
    data: payload,
    include: {
      user: {
        select: { id: true, username: true, role: true }
      }
    }
  });
}

export async function deleteReviewComment(reviewId, commentId, user) {
  const comment = await prisma.reviewComment.findFirst({
    where: { id: commentId, reviewId }
  });

  if (!comment) {
    throw ApiError.notFound('Review comment not found');
  }

  ensureOwnerOrAdmin(user, comment.userId);

  await prisma.reviewComment.delete({
    where: { id: commentId }
  });
}

export async function listArticles(filters) {
  const { page, limit, skip } = getPagination(filters);
  const where = {
    status: ContentStatus.PUBLISHED,
    ...(filters.bookId ? { bookId: filters.bookId } : {})
  };

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take: limit,
      include: articleInclude,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.article.count({ where })
  ]);

  return toPageResponse({ items, total, page, limit });
}

export async function getArticle(id, user) {
  const article = await prisma.article.findUnique({
    where: { id },
    include: articleInclude
  });

  if (!article) {
    throw ApiError.notFound('Article not found');
  }

  if (article.status !== ContentStatus.PUBLISHED && !isAdmin(user) && user?.sub !== article.userId) {
    throw ApiError.notFound('Article not found');
  }

  return {
    ...article,
    comments: article.comments.filter(
      (comment) => comment.status === ContentStatus.PUBLISHED || isAdmin(user) || comment.userId === user?.sub
    )
  };
}

export async function createArticle(userId, payload) {
  return prisma.article.create({
    data: {
      userId,
      bookId: payload.bookId,
      title: payload.title,
      body: payload.body,
      status: payload.status
    },
    include: articleInclude
  });
}

export async function updateArticle(id, user, payload) {
  const article = await prisma.article.findUnique({
    where: { id }
  });

  if (!article) {
    throw ApiError.notFound('Article not found');
  }

  ensureOwnerOrAdmin(user, article.userId);

  return prisma.article.update({
    where: { id },
    data: payload,
    include: articleInclude
  });
}

export async function deleteArticle(id, user) {
  const article = await prisma.article.findUnique({
    where: { id }
  });

  if (!article) {
    throw ApiError.notFound('Article not found');
  }

  ensureOwnerOrAdmin(user, article.userId);

  await prisma.article.delete({
    where: { id }
  });
}

export async function createArticleComment(articleId, userId, payload) {
  return prisma.articleComment.create({
    data: {
      articleId,
      userId,
      body: payload.body,
      status: payload.status
    },
    include: {
      user: {
        select: { id: true, username: true, role: true }
      }
    }
  });
}

export async function updateArticleComment(articleId, commentId, user, payload) {
  const comment = await prisma.articleComment.findFirst({
    where: { id: commentId, articleId }
  });

  if (!comment) {
    throw ApiError.notFound('Article comment not found');
  }

  ensureOwnerOrAdmin(user, comment.userId);

  return prisma.articleComment.update({
    where: { id: commentId },
    data: payload,
    include: {
      user: {
        select: { id: true, username: true, role: true }
      }
    }
  });
}

export async function deleteArticleComment(articleId, commentId, user) {
  const comment = await prisma.articleComment.findFirst({
    where: { id: commentId, articleId }
  });

  if (!comment) {
    throw ApiError.notFound('Article comment not found');
  }

  ensureOwnerOrAdmin(user, comment.userId);

  await prisma.articleComment.delete({
    where: { id: commentId }
  });
}

export async function listModerationQueue(type, filters = {}) {
  const { page, limit, skip } = getPagination(filters);

  const map = {
    reviews: prisma.review,
    articles: prisma.article,
    reviewComments: prisma.reviewComment,
    articleComments: prisma.articleComment
  };

  const delegate = map[type];

  if (!delegate) {
    throw ApiError.badRequest('Unsupported moderation type');
  }

  const where = filters.status ? { status: filters.status } : undefined;
  const [items, total] = await Promise.all([
    delegate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' }
    }),
    delegate.count({ where })
  ]);

  return toPageResponse({ items, total, page, limit });
}

export async function moderateEntity(type, id, status) {
  const map = {
    review: prisma.review,
    article: prisma.article,
    reviewComment: prisma.reviewComment,
    articleComment: prisma.articleComment
  };

  const delegate = map[type];

  if (!delegate) {
    throw ApiError.badRequest('Unsupported moderation type');
  }

  return delegate.update({
    where: { id },
    data: { status }
  });
}
