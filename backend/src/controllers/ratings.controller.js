import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { calculateRating84 } from '../utils/rating84.js';

const ratingSchema = z.object({
  book_id: z.string().uuid(),
  architecture: z.number().int().min(1).max(10),
  characters: z.number().int().min(1).max(10),
  lang_style: z.number().int().min(1).max(10),
  idea: z.number().int().min(1).max(10),
  vibe: z.number().int().min(1).max(10)
});

export async function upsertRating(req, res) {
  const body = ratingSchema.parse(req.body);
  const breakdown = calculateRating84(body);

  const result = await prisma.ratings.upsert({
    where: { user_id_book_id: { user_id: req.user.sub, book_id: body.book_id } },
    create: { ...body, final_score: breakdown.finalScore, user_id: req.user.sub },
    update: { ...body, final_score: breakdown.finalScore }
  });

  res.json({ rating: result, breakdown });
}

export async function deleteRating(req, res) {
  await prisma.ratings.delete({ where: { user_id_book_id: { user_id: req.user.sub, book_id: req.params.bookId } } });
  res.json({ ok: true });
}

export async function myRatings(req, res) {
  const rows = await prisma.ratings.findMany({ where: { user_id: req.user.sub }, include: { book: true } });
  res.json(rows);
}
