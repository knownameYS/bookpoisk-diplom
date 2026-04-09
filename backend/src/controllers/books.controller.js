import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { ratingInterpretation } from '../utils/rating84.js';

export async function listBooks(req, res) {
  const query = z.object({
    q: z.string().optional(),
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    sort: z.enum(['newest', 'rating', 'title']).default('newest')
  }).parse(req.query);

  const skip = (query.page - 1) * query.limit;
  const where = query.q ? { title: { contains: query.q, mode: 'insensitive' } } : {};

  const books = await prisma.books.findMany({
    where,
    skip,
    take: query.limit,
    orderBy: query.sort === 'title' ? { title: 'asc' } : { created_at: 'desc' },
    include: {
      book_authors: { include: { author: true } },
      ratings: true
    }
  });

  const payload = books.map((b) => {
    const count = b.ratings.length;
    const avg = count ? b.ratings.reduce((s, r) => s + r.final_score, 0) / count : 0;
    return { ...b, rating_count: count, avg_final_score: Number(avg.toFixed(2)), interpretation: ratingInterpretation(avg) };
  });

  res.json(payload);
}

export async function getBook(req, res) {
  const book = await prisma.books.findUnique({
    where: { id: req.params.id },
    include: {
      book_authors: { include: { author: true } },
      book_genres: { include: { genre: true } },
      book_tags: { include: { tag: true } },
      ratings: true,
      reviews: { include: { user: true, comments: true } },
      articles: { include: { user: true, comments: true } }
    }
  });
  if (!book) return res.status(404).json({ message: 'Book not found' });

  const count = book.ratings.length;
  const aggregates = count
    ? book.ratings.reduce((acc, r) => ({
        architecture: acc.architecture + r.architecture,
        characters: acc.characters + r.characters,
        lang_style: acc.lang_style + r.lang_style,
        idea: acc.idea + r.idea,
        vibe: acc.vibe + r.vibe,
        final_score: acc.final_score + r.final_score
      }), { architecture: 0, characters: 0, lang_style: 0, idea: 0, vibe: 0, final_score: 0 })
    : { architecture: 0, characters: 0, lang_style: 0, idea: 0, vibe: 0, final_score: 0 };

  res.json({
    ...book,
    rating_stats: {
      count,
      avg_final_score: count ? Number((aggregates.final_score / count).toFixed(2)) : 0,
      avg_architecture: count ? Number((aggregates.architecture / count).toFixed(2)) : 0,
      avg_characters: count ? Number((aggregates.characters / count).toFixed(2)) : 0,
      avg_lang_style: count ? Number((aggregates.lang_style / count).toFixed(2)) : 0,
      avg_idea: count ? Number((aggregates.idea / count).toFixed(2)) : 0,
      avg_vibe: count ? Number((aggregates.vibe / count).toFixed(2)) : 0
    }
  });
}
