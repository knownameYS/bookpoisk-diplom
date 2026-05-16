import { env } from '../../config/env.js';
import {
  clearRefreshCookieOptions,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshCookieOptions,
  refreshUserSession,
  registerUser
} from './service.js';

export async function register(req, res) {
  const user = await registerUser(req.validated.body);
  res.status(201).json({ user });
}

export async function login(req, res) {
  const session = await loginUser(req.validated.body);
  res.cookie(env.refreshCookieName, session.refreshToken, refreshCookieOptions());
  res.json({
    accessToken: session.accessToken,
    user: session.user
  });
}

export async function refresh(req, res) {
  const session = await refreshUserSession(req.cookies[env.refreshCookieName]);
  res.cookie(env.refreshCookieName, session.refreshToken, refreshCookieOptions());
  res.json({
    accessToken: session.accessToken,
    user: session.user
  });
}

export async function logout(req, res) {
  await logoutUser(req.cookies[env.refreshCookieName]);
  res.clearCookie(env.refreshCookieName, clearRefreshCookieOptions());
  res.json({ ok: true });
}

export async function me(req, res) {
  const user = await getCurrentUser(req.user.sub);
  res.json({ user });
}
