import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { env } from '../config/env.js';

export const hashPassword = (value) => bcrypt.hash(value, 10);
export const verifyPassword = (value, hash) => bcrypt.compare(value, hash);

export const signAccessToken = (user) => jwt.sign({ sub: user.id, role: user.role }, env.jwtAccessSecret, { expiresIn: env.accessTtl });
export const signRefreshToken = (user) => jwt.sign({ sub: user.id }, env.jwtRefreshSecret, { expiresIn: `${env.refreshTtlDays}d` });

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, env.jwtRefreshSecret);

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
