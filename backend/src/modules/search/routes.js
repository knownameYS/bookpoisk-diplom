import { Router } from 'express';
import { asyncHandler } from '../../common/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { aiSearch, search } from './controller.js';
import { aiSearchSchema, searchSchema } from './schemas.js';

export const searchRouter = Router();

searchRouter.get('/', validate(searchSchema), asyncHandler(search));
searchRouter.post('/ai', requireAuth, validate(aiSearchSchema), asyncHandler(aiSearch));
