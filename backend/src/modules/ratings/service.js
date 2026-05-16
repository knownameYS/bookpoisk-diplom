import { ApiError } from '../../common/api-error.js';
import { calculateRating84 } from '../../common/rating84.js';
import { prisma } from '../../lib/prisma.js';

async function ensureBookExists(bookId) {
  const book = await prisma.book.findUnique({
    where: { id: bookId }
  });

  if (!book) {
    throw ApiError.notFound('Book not found');
  }

  return book;
}

function buildInlineReviewTitle(bookTitle) {
  const title = `Рецензия на книгу «${bookTitle}»`;
  return title.length <= 200 ? title : `${title.slice(0, 197)}...`;
}

export async function upsertBookRating(bookId, userId, payload) {
  const book = await ensureBookExists(bookId);
  const breakdown = calculateRating84(payload);

  const result = await prisma.$transaction(async (tx) => {
    const rating = await tx.rating.upsert({
      where: {
        userId_bookId: {
          userId,
          bookId
        }
      },
      create: {
        bookId,
        userId,
        architecture: payload.architecture,
        characters: payload.characters,
        language: payload.language,
        idea: payload.idea,
        vibe: payload.vibe,
        finalScore: breakdown.finalScore
      },
      update: {
        architecture: payload.architecture,
        characters: payload.characters,
        language: payload.language,
        idea: payload.idea,
        vibe: payload.vibe,
        finalScore: breakdown.finalScore
      }
    });

    let review = null;
    if (payload.reviewBody) {
      const title = buildInlineReviewTitle(book.title);
      const existingReview = await tx.review.findFirst({
        where: {
          bookId,
          userId,
          title
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      review = existingReview
        ? await tx.review.update({
            where: { id: existingReview.id },
            data: {
              body: payload.reviewBody,
              status: 'PUBLISHED',
              isSpoiler: false
            }
          })
        : await tx.review.create({
            data: {
              bookId,
              userId,
              title,
              body: payload.reviewBody,
              status: 'PUBLISHED',
              isSpoiler: false
            }
          });
    }

    return { rating, review };
  });

  return {
    rating: result.rating,
    review: result.review,
    breakdown
  };
}

export async function deleteBookRating(bookId, userId) {
  await prisma.rating.delete({
    where: {
      userId_bookId: {
        userId,
        bookId
      }
    }
  });
}

export async function listMyRatings(userId) {
  return prisma.rating.findMany({
    where: { userId },
    include: {
      book: {
        include: {
          bookAuthors: {
            include: {
              author: true
            }
          }
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });
}
