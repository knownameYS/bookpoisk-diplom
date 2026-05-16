import { z } from 'zod';

function trimString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function emptyStringToUndefined(value) {
  const trimmed = trimString(value);
  if (typeof trimmed !== 'string') {
    return trimmed;
  }

  return trimmed.length ? trimmed : undefined;
}

function emptyStringToNull(value) {
  if (value === null) {
    return null;
  }

  const trimmed = trimString(value);
  if (typeof trimmed !== 'string') {
    return trimmed;
  }

  return trimmed.length ? trimmed : null;
}

function isPastOrToday(value) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf())) {
    return false;
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return date <= today;
}

function createOptionalTextSchema(max, min = 1) {
  return z.preprocess(emptyStringToUndefined, z.string().min(min).max(max).optional());
}

function createNullableTextSchema(max, min = 1) {
  return z.preprocess(emptyStringToNull, z.union([z.string().min(min).max(max), z.null()]).optional());
}

function createOptionalBirthDateSchema(allowNull = false) {
  const schema = z.string().date().refine(isPastOrToday, 'Birth date cannot be in the future');
  const normalizer = allowNull ? emptyStringToNull : emptyStringToUndefined;
  const valueSchema = allowNull ? z.union([schema, z.null()]) : schema;

  return z.preprocess(normalizer, valueSchema.optional());
}

export const optionalFullNameSchema = createOptionalTextSchema(120, 2);
export const optionalCitySchema = createOptionalTextSchema(80, 2);
export const optionalFavoriteGenresSchema = createOptionalTextSchema(160, 2);
export const optionalBirthDateSchema = createOptionalBirthDateSchema(false);

export const nullableFullNameSchema = createNullableTextSchema(120, 2);
export const nullableCitySchema = createNullableTextSchema(80, 2);
export const nullableFavoriteGenresSchema = createNullableTextSchema(160, 2);
export const nullableBirthDateSchema = createOptionalBirthDateSchema(true);

export function parseDateOnly(value) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export function serializeDateOnly(value) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : null;
}

export function buildProfileDetailsData(payload) {
  const data = {};

  if (payload.fullName !== undefined) {
    data.fullName = payload.fullName ?? null;
  }

  if (payload.birthDate !== undefined) {
    data.birthDate = parseDateOnly(payload.birthDate);
  }

  if (payload.city !== undefined) {
    data.city = payload.city ?? null;
  }

  if (payload.favoriteGenres !== undefined) {
    data.favoriteGenres = payload.favoriteGenres ?? null;
  }

  return data;
}
