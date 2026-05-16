import { Router } from 'express';
import { adminRouter } from '../modules/admin/routes.js';
import { authRouter } from '../modules/auth/routes.js';
import { booksRouter } from '../modules/books/routes.js';
import { articlesRouter, reviewsRouter } from '../modules/content/routes.js';
import { ratingsRouter } from '../modules/ratings/routes.js';
import { searchRouter } from '../modules/search/routes.js';
import { collectionsRouter, favoritesRouter } from '../modules/social/routes.js';
import { authorsRouter, genresRouter, tagsRouter } from '../modules/taxonomy/routes.js';
import { usersRouter } from '../modules/users/routes.js';

export const router = Router();

router.get('/health', (req, res) => {
  res.json({ ok: true });
});

router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/authors', authorsRouter);
router.use('/genres', genresRouter);
router.use('/tags', tagsRouter);
router.use('/books', booksRouter);
router.use('/ratings', ratingsRouter);
router.use('/reviews', reviewsRouter);
router.use('/articles', articlesRouter);
router.use('/favorites', favoritesRouter);
router.use('/collections', collectionsRouter);
router.use('/search', searchRouter);
router.use('/admin', adminRouter);
