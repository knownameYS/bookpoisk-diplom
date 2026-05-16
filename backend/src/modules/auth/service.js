import { ApiError } from '../../common/api-error.js';
import {
  getRefreshTokenExpiresAt,
  hashPassword,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyRefreshToken
} from '../../common/auth.js';
import { buildProfileDetailsData, serializeDateOnly } from '../../common/profile-details.js';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';

export function serializeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName ?? null,
    birthDate: serializeDateOnly(user.birthDate),
    city: user.city ?? null,
    favoriteGenres: user.favoriteGenres ?? null,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    role: user.role,
    isActive: user.isActive,
    settings: {
      showRatings: user.showRatings ?? true,
      showReviews: user.showReviews ?? true,
      showFavorites: user.showFavorites ?? true,
      showLibrary: user.showLibrary ?? true
    }
  };
}

export function refreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/api/auth',
    expires: getRefreshTokenExpiresAt()
  };
}

export function clearRefreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/api/auth'
  };
}

async function persistRefreshToken(userId, refreshToken) {
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: getRefreshTokenExpiresAt()
    }
  });
}

export async function registerUser(payload) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: payload.email }, { username: payload.username }]
    }
  });

  if (existing) {
    throw ApiError.conflict('User with this email or username already exists');
  }

  const user = await prisma.user.create({
    data: {
      username: payload.username,
      email: payload.email,
      passwordHash: await hashPassword(payload.password),
      ...buildProfileDetailsData(payload)
    }
  });

  return serializeUser(user);
}

export async function loginUser(payload) {
  const user = await prisma.user.findUnique({
    where: { email: payload.email }
  });

  if (!user || !(await verifyPassword(payload.password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('User account is disabled');
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await persistRefreshToken(user.id, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: serializeUser(user)
  };
}

export async function refreshUserSession(refreshTokenValue) {
  if (!refreshTokenValue) {
    throw ApiError.unauthorized('Refresh token is required');
  }

  const payload = verifyRefreshToken(refreshTokenValue);
  const stored = await prisma.refreshToken.findFirst({
    where: {
      userId: payload.sub,
      tokenHash: hashToken(refreshTokenValue),
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: {
      user: true
    }
  });

  if (!stored || !stored.user.isActive) {
    throw ApiError.unauthorized('Refresh token is invalid or expired');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() }
  });

  const accessToken = signAccessToken(stored.user);
  const refreshToken = signRefreshToken(stored.user);

  await persistRefreshToken(stored.user.id, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: serializeUser(stored.user)
  };
}

export async function logoutUser(refreshTokenValue) {
  if (!refreshTokenValue) {
    return;
  }

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashToken(refreshTokenValue),
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return serializeUser(user);
}
