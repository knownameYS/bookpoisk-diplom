import { Router } from 'express';
import { asyncHandler } from '../../common/async-handler.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { discover, follow, getMe, getPublic, patchMe, unfollow, uploadMyAvatar } from './controller.js';
import { discoverUsersSchema, updateProfileSchema, usernameParamSchema } from './schemas.js';
import { avatarUpload } from './upload.js';

export const usersRouter = Router();

usersRouter.get('/discover', requireAuth, validate(discoverUsersSchema), asyncHandler(discover));
usersRouter.get('/me', requireAuth, asyncHandler(getMe));
usersRouter.post('/me/avatar', requireAuth, avatarUpload.single('avatar'), asyncHandler(uploadMyAvatar));
usersRouter.patch('/me', requireAuth, validate(updateProfileSchema), asyncHandler(patchMe));
usersRouter.get('/:username', optionalAuth, validate(usernameParamSchema), asyncHandler(getPublic));
usersRouter.post('/:username/follow', requireAuth, validate(usernameParamSchema), asyncHandler(follow));
usersRouter.delete('/:username/follow', requireAuth, validate(usernameParamSchema), asyncHandler(unfollow));
