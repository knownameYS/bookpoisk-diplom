import { Router } from 'express';
import { asyncHandler } from '../../common/async-handler.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createAuthorSchema,
  createGenreSchema,
  createTagSchema,
  listTaxonomySchema,
  taxonomyIdSchema,
  updateAuthorSchema,
  updateGenreSchema,
  updateTagSchema
} from './schemas.js';
import { createTaxonomyHandlers } from './controller.js';

const adminOnly = [requireAuth, requireRole('ADMIN')];

function createCrudRouter(type, createSchema, updateSchema) {
  const handlers = createTaxonomyHandlers(type);
  const router = Router();

  router.get('/', validate(listTaxonomySchema), asyncHandler(handlers.list));
  router.get('/:id', validate(taxonomyIdSchema), asyncHandler(handlers.getOne));
  router.post('/', ...adminOnly, validate(createSchema), asyncHandler(handlers.create));
  router.patch('/:id', ...adminOnly, validate(updateSchema), asyncHandler(handlers.update));
  router.delete('/:id', ...adminOnly, validate(taxonomyIdSchema), asyncHandler(handlers.remove));

  return router;
}

export const authorsRouter = createCrudRouter('authors', createAuthorSchema, updateAuthorSchema);
export const genresRouter = createCrudRouter('genres', createGenreSchema, updateGenreSchema);
export const tagsRouter = createCrudRouter('tags', createTagSchema, updateTagSchema);
