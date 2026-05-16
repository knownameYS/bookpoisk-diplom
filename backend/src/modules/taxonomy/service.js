import { ApiError } from '../../common/api-error.js';
import { getPagination, toPageResponse } from '../../common/pagination.js';
import { prisma } from '../../lib/prisma.js';

const taxonomyConfig = {
  authors: {
    delegate: prisma.author,
    searchField: 'fullName',
    sortField: 'fullName'
  },
  genres: {
    delegate: prisma.genre,
    searchField: 'name',
    sortField: 'name'
  },
  tags: {
    delegate: prisma.tag,
    searchField: 'name',
    sortField: 'name'
  }
};

function getTaxonomyConfig(type) {
  const config = taxonomyConfig[type];

  if (!config) {
    throw ApiError.badRequest('Unsupported taxonomy type');
  }

  return config;
}

async function buildAuthorWithStats(author) {
  const ratings = await prisma.rating.groupBy({
    by: ['bookId'],
    where: {
      book: {
        bookAuthors: {
          some: {
            authorId: author.id
          }
        }
      }
    },
    _avg: {
      finalScore: true
    }
  });

  const books = await prisma.book.findMany({
    where: {
      status: 'PUBLISHED',
      bookAuthors: {
        some: {
          authorId: author.id
        }
      }
    },
    include: {
      bookAuthors: {
        include: {
          author: true
        },
        orderBy: {
          authorOrder: 'asc'
        }
      }
    },
    orderBy: {
      title: 'asc'
    }
  });

  const statsByBookId = new Map(ratings.map((item) => [item.bookId, Number((item._avg.finalScore ?? 0).toFixed(2))]));
  const averageScore = ratings.length
    ? Number((ratings.reduce((sum, item) => sum + Number(item._avg.finalScore ?? 0), 0) / ratings.length).toFixed(2))
    : 0;

  return {
    ...author,
    averageScore,
    booksCount: books.length,
    books: books.map((book) => ({
      id: book.id,
      title: book.title,
      coverUrl: book.coverUrl,
      publicationYear: book.publicationYear,
      avgFinalScore: statsByBookId.get(book.id) ?? 0,
      authors: book.bookAuthors.map((item) => ({
        id: item.author.id,
        fullName: item.author.fullName
      }))
    }))
  };
}

export async function listTaxonomy(type, filters) {
  const config = getTaxonomyConfig(type);
  const { page, limit, skip } = getPagination(filters);
  const where = filters.query
    ? {
        [config.searchField]: {
          contains: filters.query,
          mode: 'insensitive'
        }
      }
    : undefined;

  const [items, total] = await Promise.all([
    config.delegate.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [config.sortField]: 'asc'
      }
    }),
    config.delegate.count({ where })
  ]);

  if (type === 'authors') {
    const withStats = await Promise.all(
      items.map(async (author) => {
        const books = await prisma.book.count({
          where: {
            status: 'PUBLISHED',
            bookAuthors: {
              some: {
                authorId: author.id
              }
            }
          }
        });

        const ratingStats = await prisma.rating.aggregate({
          where: {
            book: {
              bookAuthors: {
                some: {
                  authorId: author.id
                }
              }
            }
          },
          _avg: {
            finalScore: true
          }
        });

        return {
          ...author,
          booksCount: books,
          averageScore: Number((ratingStats._avg.finalScore ?? 0).toFixed(2))
        };
      })
    );

    return toPageResponse({ items: withStats, total, page, limit });
  }

  return toPageResponse({ items, total, page, limit });
}

export async function getTaxonomyItem(type, id) {
  const config = getTaxonomyConfig(type);
  const item = await config.delegate.findUnique({
    where: { id }
  });

  if (!item) {
    throw ApiError.notFound('Entity not found');
  }

  if (type === 'authors') {
    return buildAuthorWithStats(item);
  }

  return item;
}

export async function createTaxonomyItem(type, payload) {
  const config = getTaxonomyConfig(type);
  return config.delegate.create({
    data: payload
  });
}

export async function updateTaxonomyItem(type, id, payload) {
  const config = getTaxonomyConfig(type);
  return config.delegate.update({
    where: { id },
    data: payload
  });
}

export async function deleteTaxonomyItem(type, id) {
  const config = getTaxonomyConfig(type);
  await config.delegate.delete({
    where: { id }
  });
}
