import { prisma } from '../lib/prisma.js';
import { z } from 'zod';

export async function createReview(req, res) {
  const body = z.object({ book_id: z.string().uuid(), title: z.string().min(1), body: z.string().min(5), is_spoiler: z.boolean().default(false) }).parse(req.body);
  const row = await prisma.reviews.create({ data: { ...body, user_id: req.user.sub } });
  res.status(201).json(row);
}

export async function getReview(req, res) {
  const row = await prisma.reviews.findUnique({ where: { id: req.params.id }, include: { user: true, comments: { include: { user: true } } } });
  if (!row) return res.status(404).json({ message: 'Not found' });
  res.json(row);
}

export async function createArticle(req, res) {
  const body = z.object({ book_id: z.string().uuid(), title: z.string().min(1), body: z.string().min(20) }).parse(req.body);
  const row = await prisma.articles.create({ data: { ...body, user_id: req.user.sub } });
  res.status(201).json(row);
}

export async function getArticle(req, res) {
  const row = await prisma.articles.findUnique({ where: { id: req.params.id }, include: { user: true, comments: { include: { user: true } }, book: true } });
  if (!row) return res.status(404).json({ message: 'Not found' });
  res.json(row);
}
