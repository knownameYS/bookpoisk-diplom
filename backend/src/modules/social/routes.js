import { Router } from 'express';
import { asyncHandler } from '../../common/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  addCollectionBookSchema,
  collectionBookIdSchema,
  collectionIdSchema,
  createCollectionSchema,
  favoriteBookSchema,
  listCollectionsSchema,
  readingShelfAssignmentSchema,
  readingShelfStatusSchema,
  updateCollectionBookSchema,
  updateCollectionSchema
} from './schemas.js';
import {
  addCollectionBookAction,
  addFavoriteAction,
  clearReadingShelfAction,
  createCollectionAction,
  deleteCollectionAction,
  getFavoriteStatusAction,
  getCollectionAction,
  getReadingShelfStateAction,
  listFavoritesAction,
  listReadingShelvesAction,
  listMyCollectionsAction,
  listPublicCollectionsAction,
  removeCollectionBookAction,
  removeFavoriteAction,
  setReadingShelfAction,
  updateCollectionAction,
  updateCollectionBookAction
} from './controller.js';

export const favoritesRouter = Router();
export const collectionsRouter = Router();

favoritesRouter.get('/', requireAuth, asyncHandler(listFavoritesAction));
favoritesRouter.get('/:bookId', requireAuth, validate(favoriteBookSchema), asyncHandler(getFavoriteStatusAction));
favoritesRouter.post('/:bookId', requireAuth, validate(favoriteBookSchema), asyncHandler(addFavoriteAction));
favoritesRouter.delete('/:bookId', requireAuth, validate(favoriteBookSchema), asyncHandler(removeFavoriteAction));

collectionsRouter.get('/public', validate(listCollectionsSchema), asyncHandler(listPublicCollectionsAction));
collectionsRouter.get('/mine', requireAuth, validate(listCollectionsSchema), asyncHandler(listMyCollectionsAction));
collectionsRouter.get('/shelves/mine', requireAuth, asyncHandler(listReadingShelvesAction));
collectionsRouter.get(
  '/shelves/books/:bookId',
  requireAuth,
  validate(readingShelfStatusSchema),
  asyncHandler(getReadingShelfStateAction)
);
collectionsRouter.put(
  '/shelves/:shelfKey/books/:bookId',
  requireAuth,
  validate(readingShelfAssignmentSchema),
  asyncHandler(setReadingShelfAction)
);
collectionsRouter.delete(
  '/shelves/books/:bookId',
  requireAuth,
  validate(readingShelfStatusSchema),
  asyncHandler(clearReadingShelfAction)
);
collectionsRouter.get('/:id', validate(collectionIdSchema), asyncHandler(getCollectionAction));
collectionsRouter.post('/', requireAuth, validate(createCollectionSchema), asyncHandler(createCollectionAction));
collectionsRouter.patch('/:id', requireAuth, validate(updateCollectionSchema), asyncHandler(updateCollectionAction));
collectionsRouter.delete('/:id', requireAuth, validate(collectionIdSchema), asyncHandler(deleteCollectionAction));
collectionsRouter.post('/:id/books', requireAuth, validate(addCollectionBookSchema), asyncHandler(addCollectionBookAction));
collectionsRouter.patch(
  '/:id/books/:bookId',
  requireAuth,
  validate(updateCollectionBookSchema),
  asyncHandler(updateCollectionBookAction)
);
collectionsRouter.delete(
  '/:id/books/:bookId',
  requireAuth,
  validate(collectionBookIdSchema),
  asyncHandler(removeCollectionBookAction)
);
