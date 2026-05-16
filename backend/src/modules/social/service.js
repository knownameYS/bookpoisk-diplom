import { ApiError } from '../../common/api-error.js';
import { getPagination, toPageResponse } from '../../common/pagination.js';
import { prisma } from '../../lib/prisma.js';

export const readingShelfDefinitions = [
  {
    key: 'want-to-read',
    title: 'Буду читать',
    description: 'Книги, к которым вы хотите вернуться в ближайшее время.'
  },
  {
    key: 'read',
    title: 'Прочитано',
    description: 'Книги, которые вы уже дочитали и оставили в личной библиотеке.'
  },
  {
    key: 'stopped-reading',
    title: 'Перестал читать',
    description: 'Книги, чтение которых вы решили остановить.'
  }
];

const readingShelfTitleToKey = new Map(readingShelfDefinitions.map((item) => [item.title, item.key]));

async function ensureBookExists(bookId) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true }
  });

  if (!book) {
    throw ApiError.notFound('Book not found');
  }
}

function collectionInclude() {
  return {
    user: {
      select: { id: true, username: true }
    },
    collectionBooks: {
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
      orderBy: { addedAt: 'desc' }
    }
  };
}

function serializeShelf(collection) {
  const definition = readingShelfDefinitions.find((item) => item.title === collection.title);

  return {
    id: collection.id,
    key: definition?.key ?? collection.id,
    title: collection.title,
    description: collection.description,
    isPublic: collection.isPublic,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    bookCount: collection.collectionBooks.length,
    books: collection.collectionBooks.map((item) => item.book)
  };
}

async function ensureReadingShelves(userId) {
  const titles = readingShelfDefinitions.map((item) => item.title);
  const existing = await prisma.collection.findMany({
    where: {
      userId,
      title: {
        in: titles
      }
    },
    include: collectionInclude(),
    orderBy: {
      createdAt: 'asc'
    }
  });

  const byTitle = new Map();
  for (const collection of existing) {
    if (!byTitle.has(collection.title)) {
      byTitle.set(collection.title, collection);
    }
  }

  for (const shelf of readingShelfDefinitions) {
    if (!byTitle.has(shelf.title)) {
      const created = await prisma.collection.create({
        data: {
          userId,
          title: shelf.title,
          description: shelf.description,
          isPublic: false
        },
        include: collectionInclude()
      });

      byTitle.set(shelf.title, created);
    }
  }

  return readingShelfDefinitions.map((shelf) => byTitle.get(shelf.title));
}

function getReadingShelfDefinition(key) {
  const shelf = readingShelfDefinitions.find((item) => item.key === key);

  if (!shelf) {
    throw ApiError.badRequest('Unknown reading shelf');
  }

  return shelf;
}

async function ensureCollectionAccess(id, user) {
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: collectionInclude()
  });

  if (!collection) {
    throw ApiError.notFound('Collection not found');
  }

  if (collection.isPublic || collection.userId === user?.sub || user?.role === 'ADMIN') {
    return collection;
  }

  throw ApiError.notFound('Collection not found');
}

async function ensureCollectionOwner(id, userId) {
  const collection = await prisma.collection.findUnique({
    where: { id }
  });

  if (!collection) {
    throw ApiError.notFound('Collection not found');
  }

  if (collection.userId !== userId) {
    throw ApiError.forbidden('You can only modify your own collections');
  }

  return collection;
}

export async function listFavorites(userId) {
  const items = await prisma.favorite.findMany({
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
      createdAt: 'desc'
    }
  });

  return items;
}

export async function addFavorite(userId, bookId) {
  await ensureBookExists(bookId);

  return prisma.favorite.upsert({
    where: {
      userId_bookId: {
        userId,
        bookId
      }
    },
    update: {},
    create: {
      userId,
      bookId
    }
  });
}

export async function getFavoriteStatus(userId, bookId) {
  await ensureBookExists(bookId);

  const item = await prisma.favorite.findUnique({
    where: {
      userId_bookId: {
        userId,
        bookId
      }
    }
  });

  return {
    bookId,
    isFavorite: Boolean(item)
  };
}

export async function removeFavorite(userId, bookId) {
  await ensureBookExists(bookId);

  await prisma.favorite.deleteMany({
    where: {
      userId,
      bookId
    }
  });
}

export async function listPublicCollections(filters) {
  const { page, limit, skip } = getPagination(filters);
  const where = { isPublic: true };

  const [items, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      skip,
      take: limit,
      include: collectionInclude(),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.collection.count({ where })
  ]);

  return toPageResponse({ items, total, page, limit });
}

export async function listMyCollections(userId, filters) {
  const { page, limit, skip } = getPagination(filters);
  const where = { userId };

  const [items, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      skip,
      take: limit,
      include: collectionInclude(),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.collection.count({ where })
  ]);

  return toPageResponse({ items, total, page, limit });
}

export async function getCollection(id, user) {
  return ensureCollectionAccess(id, user);
}

export async function listReadingShelves(userId) {
  const collections = await ensureReadingShelves(userId);
  return collections.map(serializeShelf);
}

export async function getReadingShelfState(userId, bookId) {
  await ensureBookExists(bookId);
  await ensureReadingShelves(userId);

  const item = await prisma.collectionBook.findFirst({
    where: {
      bookId,
      collection: {
        userId,
        title: {
          in: readingShelfDefinitions.map((shelf) => shelf.title)
        }
      }
    },
    include: {
      collection: true
    }
  });

  if (!item) {
    return {
      bookId,
      shelfKey: null
    };
  }

  return {
    bookId,
    shelfKey: readingShelfTitleToKey.get(item.collection.title) ?? null
  };
}

export async function setReadingShelf(userId, shelfKey, bookId) {
  await ensureBookExists(bookId);

  const targetShelf = getReadingShelfDefinition(shelfKey);
  const shelves = await ensureReadingShelves(userId);
  const targetCollection = shelves.find((collection) => collection.title === targetShelf.title);
  const shelfIds = shelves.map((collection) => collection.id);

  await prisma.$transaction(async (tx) => {
    await tx.collectionBook.deleteMany({
      where: {
        bookId,
        collectionId: {
          in: shelfIds
        }
      }
    });

    await tx.collectionBook.create({
      data: {
        collectionId: targetCollection.id,
        bookId
      }
    });
  });

  return getReadingShelfState(userId, bookId);
}

export async function clearReadingShelf(userId, bookId) {
  await ensureBookExists(bookId);

  const shelves = await ensureReadingShelves(userId);

  await prisma.collectionBook.deleteMany({
    where: {
      bookId,
      collectionId: {
        in: shelves.map((collection) => collection.id)
      }
    }
  });

  return {
    bookId,
    shelfKey: null
  };
}

export async function createCollection(userId, payload) {
  return prisma.collection.create({
    data: {
      userId,
      title: payload.title,
      description: payload.description,
      isPublic: payload.isPublic
    },
    include: collectionInclude()
  });
}

export async function updateCollection(id, userId, payload) {
  await ensureCollectionOwner(id, userId);

  return prisma.collection.update({
    where: { id },
    data: payload,
    include: collectionInclude()
  });
}

export async function deleteCollection(id, userId) {
  await ensureCollectionOwner(id, userId);
  await prisma.collection.delete({
    where: { id }
  });
}

export async function addBookToCollection(id, userId, payload) {
  await ensureCollectionOwner(id, userId);
  await ensureBookExists(payload.bookId);

  await prisma.collectionBook.upsert({
    where: {
      collectionId_bookId: {
        collectionId: id,
        bookId: payload.bookId
      }
    },
    update: {
      note: payload.note
    },
    create: {
      collectionId: id,
      bookId: payload.bookId,
      note: payload.note
    }
  });

  return ensureCollectionAccess(id, { sub: userId });
}

export async function updateCollectionBook(id, bookId, userId, payload) {
  await ensureCollectionOwner(id, userId);

  return prisma.collectionBook.update({
    where: {
      collectionId_bookId: {
        collectionId: id,
        bookId
      }
    },
    data: payload
  });
}

export async function removeCollectionBook(id, bookId, userId) {
  await ensureCollectionOwner(id, userId);

  await prisma.collectionBook.delete({
    where: {
      collectionId_bookId: {
        collectionId: id,
        bookId
      }
    }
  });
}
