import { Router } from 'express';
import { register, login, logout, refresh, me } from '../controllers/auth.controller.js';
import { listBooks, getBook } from '../controllers/books.controller.js';
import { upsertRating, deleteRating, myRatings } from '../controllers/ratings.controller.js';
import { listFavorites, addFavorite, removeFavorite, listCollections, createCollection } from '../controllers/social.controller.js';
import { createReview, getReview, createArticle, getArticle } from '../controllers/content.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

export const router = Router();

router.get('/health', (req, res) => res.json({ ok: true }));

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.post('/auth/refresh', refresh);
router.get('/auth/me', requireAuth, me);

router.get('/books', listBooks);
router.get('/books/:id', getBook);

router.post('/ratings', requireAuth, upsertRating);
router.delete('/ratings/:bookId', requireAuth, deleteRating);
router.get('/ratings/my/list', requireAuth, myRatings);

router.get('/favorites', requireAuth, listFavorites);
router.post('/favorites', requireAuth, addFavorite);
router.delete('/favorites/:bookId', requireAuth, removeFavorite);

router.get('/collections', requireAuth, listCollections);
router.post('/collections', requireAuth, createCollection);

router.post('/reviews', requireAuth, createReview);
router.get('/reviews/:id', getReview);

router.post('/articles', requireAuth, createArticle);
router.get('/articles/:id', getArticle);

// admin simplified CRUD endpoints
router.get('/admin/users', requireAuth, async (req, res) => res.json(await prisma.users.findMany()));
router.get('/admin/moderation/reviews', requireAuth, async (req, res) => res.json(await prisma.reviews.findMany()));
router.get('/admin/moderation/articles', requireAuth, async (req, res) => res.json(await prisma.articles.findMany()));
