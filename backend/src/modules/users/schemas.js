import { z } from 'zod';
import {
  nullableBirthDateSchema,
  nullableCitySchema,
  nullableFavoriteGenresSchema,
  nullableFullNameSchema
} from '../../common/profile-details.js';
import { usernameSchema } from '../../common/username.js';

const username = usernameSchema;
const optionalUrl = z.union([z.string().trim().url().max(1000), z.null()]).optional();
const optionalBio = z.union([z.string().trim().max(150), z.null()]).optional();

export const updateProfileSchema = {
  body: z
    .object({
      username: username.optional(),
      email: z.string().trim().email().optional(),
      fullName: nullableFullNameSchema,
      birthDate: nullableBirthDateSchema,
      city: nullableCitySchema,
      favoriteGenres: nullableFavoriteGenresSchema,
      avatarUrl: optionalUrl,
      bio: optionalBio,
      featuredBookIds: z.array(z.string().uuid()).max(5).optional(),
      showRatings: z.boolean().optional(),
      showReviews: z.boolean().optional(),
      showFavorites: z.boolean().optional(),
      showLibrary: z.boolean().optional()
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field must be provided'
    })
};

export const usernameParamSchema = {
  params: z.object({
    username
  })
};

export const discoverUsersSchema = {
  query: z.object({
    query: z.string().trim().max(50).optional().default('')
  })
};
