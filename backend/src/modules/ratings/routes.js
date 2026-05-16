import { Router } from 'express';
import { asyncHandler } from '../../common/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { mine, remove, upsert } from './controller.js';
import { bookRatingIdSchema, upsertRatingSchema } from './schemas.js';

export const ratingsRouter = Router();

ratingsRouter.get('/me', requireAuth, asyncHandler(mine));
ratingsRouter.put('/books/:bookId/rating', requireAuth, validate(upsertRatingSchema), asyncHandler(upsert));
ratingsRouter.delete('/books/:bookId/rating', requireAuth, validate(bookRatingIdSchema), asyncHandler(remove));
