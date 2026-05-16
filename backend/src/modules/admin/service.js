import { getPagination, toPageResponse } from '../../common/pagination.js';
import { prisma } from '../../lib/prisma.js';

export async function listAdminUsers(filters) {
  const { page, limit, skip } = getPagination(filters);
  const where = filters.query
    ? {
        OR: [
          {
            username: {
              contains: filters.query,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: filters.query,
              mode: 'insensitive'
            }
          }
        ]
      }
    : undefined;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            ratings: true,
            reviews: true,
            followers: true,
            following: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  return toPageResponse({ items, total, page, limit });
}

export async function listAdminBooks(filters) {
  const { page, limit, skip } = getPagination(filters);
  const where = filters.query
    ? {
        OR: [
          {
            title: {
              contains: filters.query,
              mode: 'insensitive'
            }
          },
          {
            originalTitle: {
              contains: filters.query,
              mode: 'insensitive'
            }
          },
          {
            isbn13: {
              contains: filters.query,
              mode: 'insensitive'
            }
          }
        ]
      }
    : undefined;

  const [items, total] = await Promise.all([
    prisma.book.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        bookAuthors: {
          include: {
            author: true
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
        bookGenres: {
          include: {
            genre: true
          }
        },
        bookTags: {
          include: {
            tag: true
          }
        }
      }
    }),
    prisma.book.count({ where })
  ]);

  return toPageResponse({
    items: items.map((book) => ({
      ...book,
      authors: book.bookAuthors.map((item) => ({
        id: item.author.id,
        fullName: item.author.fullName
      })),
      genres: book.bookGenres.map((item) => ({
        id: item.genre.id,
        name: item.genre.name
      })),
      tags: book.bookTags.map((item) => ({
        id: item.tag.id,
        name: item.tag.name
      }))
    })),
    total,
    page,
    limit
  });
}
