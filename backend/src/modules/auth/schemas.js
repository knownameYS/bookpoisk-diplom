import { z } from 'zod';
import {
  optionalBirthDateSchema,
  optionalCitySchema,
  optionalFavoriteGenresSchema,
  optionalFullNameSchema
} from '../../common/profile-details.js';
import { usernameSchema } from '../../common/username.js';

export const registerSchema = {
  body: z.object({
    username: usernameSchema,
    email: z.string().trim().email(),
    fullName: optionalFullNameSchema,
    birthDate: optionalBirthDateSchema,
    city: optionalCitySchema,
    favoriteGenres: optionalFavoriteGenresSchema,
    password: z
      .string()
      .min(8)
      .max(72)
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/\d/, 'Password must contain a number')
  })
};

export const loginSchema = {
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(72)
  })
};
