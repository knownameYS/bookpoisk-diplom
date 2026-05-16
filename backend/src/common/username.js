import { z } from 'zod';

export function normalizeUsername(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/['’`"]/g, '')
    .replace(/\s+/g, '.')
    .replace(/[^\p{L}\p{N}._-]+/gu, '')
    .replace(/[._-]{2,}/g, '.')
    .replace(/^[._-]+|[._-]+$/g, '');
}

export const usernameSchema = z.preprocess(
  (value) => (typeof value === 'string' ? normalizeUsername(value) : value),
  z
    .string()
    .min(3)
    .max(30)
    .regex(/^[\p{L}\p{N}]+(?:[._-][\p{L}\p{N}]+)*$/u, 'Username must contain only letters, numbers, dots, underscores or hyphens')
);
