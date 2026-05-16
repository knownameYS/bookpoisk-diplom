import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const hashPassword = (value) => bcrypt.hash(value, 10);
export const verifyPassword = (value, hash) => bcrypt.compare(value, hash);
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessTtl
  });
}

export function signRefreshToken(user) {
  return jwt.sign({ sub: user.id }, env.jwtRefreshSecret, {
    expiresIn: `${env.jwtRefreshTtlDays}d`
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

export function getRefreshTokenExpiresAt() {
  return new Date(Date.now() + env.jwtRefreshTtlDays * 24 * 60 * 60 * 1000);
}
