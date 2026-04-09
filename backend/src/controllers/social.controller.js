import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

export async function listFavorites(req, res) {
  const items = await prisma.favorite_books.findMany({ where: { user_id: req.user.sub }, include: { book: true } });
  res.json(items);
}

export async function addFavorite(req, res) {
  const { book_id } = z.object({ book_id: z.string().uuid() }).parse(req.body);
  const row = await prisma.favorite_books.upsert({
    where: { user_id_book_id: { user_id: req.user.sub, book_id } },
    create: { user_id: req.user.sub, book_id },
    update: {}
  });
  res.status(201).json(row);
}

export async function removeFavorite(req, res) {
  await prisma.favorite_books.delete({ where: { user_id_book_id: { user_id: req.user.sub, book_id: req.params.bookId } } });
  res.json({ ok: true });
}

export async function listCollections(req, res) {
  const rows = await prisma.collections.findMany({
    where: { OR: [{ user_id: req.user.sub }, { is_public: true }] },
    include: { collection_books: { include: { book: true } }, user: true }
  });
  res.json(rows);
}

export async function createCollection(req, res) {
  const body = z.object({ title: z.string().min(1), description: z.string().optional(), is_public: z.boolean().default(false) }).parse(req.body);
  const row = await prisma.collections.create({ data: { ...body, user_id: req.user.sub } });
  res.status(201).json(row);
}
