import { Router } from 'express';
import { asyncHandler } from '../../common/async-handler.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { create, getFragment, getFragmentFile, getOne, list, noveltyFeed, patch, patchStatus, remove } from './controller.js';
import {
  bookIdSchema,
  createBookSchema,
  listBooksSchema,
  updateBookSchema,
  updateBookStatusSchema
} from './schemas.js';

export const booksRouter = Router();

booksRouter.get('/', validate(listBooksSchema), asyncHandler(list));
booksRouter.get('/novelty-feed', asyncHandler(noveltyFeed));
booksRouter.get('/:id/fragment/file', validate(bookIdSchema), asyncHandler(getFragmentFile));
booksRouter.get('/:id/fragment', validate(bookIdSchema), asyncHandler(getFragment));
booksRouter.get('/:id', validate(bookIdSchema), asyncHandler(getOne));
booksRouter.post('/', requireAuth, requireRole('ADMIN'), validate(createBookSchema), asyncHandler(create));
booksRouter.patch('/:id', requireAuth, requireRole('ADMIN'), validate(updateBookSchema), asyncHandler(patch));
booksRouter.patch('/:id/status', requireAuth, requireRole('ADMIN'), validate(updateBookStatusSchema), asyncHandler(patchStatus));
booksRouter.delete('/:id', requireAuth, requireRole('ADMIN'), validate(bookIdSchema), asyncHandler(remove));
