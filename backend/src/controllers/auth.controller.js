import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken, hashToken, verifyRefreshToken } from '../utils/auth.js';
import { env } from '../config/env.js';

const authSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

export async function register(req, res) {
  const body = authSchema.extend({ username: z.string().min(3) }).parse(req.body);
  const user = await prisma.users.create({
    data: { username: body.username, email: body.email, password_hash: await hashPassword(body.password) }
  });
  res.status(201).json({ id: user.id, email: user.email, username: user.username });
}

export async function login(req, res) {
  const body = authSchema.parse(req.body);
  const user = await prisma.users.findUnique({ where: { email: body.email } });
  if (!user || !(await verifyPassword(body.password, user.password_hash))) return res.status(401).json({ message: 'Invalid credentials' });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await prisma.user_refresh_tokens.create({
    data: {
      user_id: user.id,
      token_hash: hashToken(refreshToken),
      expires_at: new Date(Date.now() + env.refreshTtlDays * 86400000)
    }
  });

  res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'lax' });
  res.json({ accessToken, user: { id: user.id, role: user.role, username: user.username, email: user.email } });
}

export async function refresh(req, res) {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'Missing refresh token' });

  const payload = verifyRefreshToken(token);
  const hashed = hashToken(token);
  const stored = await prisma.user_refresh_tokens.findFirst({ where: { user_id: payload.sub, token_hash: hashed, revoked_at: null } });
  if (!stored) return res.status(401).json({ message: 'Token revoked' });

  const user = await prisma.users.findUnique({ where: { id: payload.sub } });
  const accessToken = signAccessToken(user);
  return res.json({ accessToken });
}

export async function logout(req, res) {
  const token = req.cookies.refreshToken;
  if (token) {
    await prisma.user_refresh_tokens.updateMany({ where: { token_hash: hashToken(token), revoked_at: null }, data: { revoked_at: new Date() } });
  }
  res.clearCookie('refreshToken');
  res.json({ ok: true });
}

export async function me(req, res) {
  const user = await prisma.users.findUnique({ where: { id: req.user.sub }, select: { id: true, username: true, email: true, role: true, is_active: true } });
  res.json(user);
}
