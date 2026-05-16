import { ApiError } from '../common/api-error.js';
import { verifyAccessToken } from '../common/auth.js';

function resolveBearerToken(req) {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : null;
}

export function requireAuth(req, res, next) {
  const token = resolveBearerToken(req);

  if (!token) {
    return next(ApiError.unauthorized('Access token is required'));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired access token'));
  }
}

export function optionalAuth(req, res, next) {
  const token = resolveBearerToken(req);

  if (!token) {
    return next();
  }

  try {
    req.user = verifyAccessToken(token);
  } catch {
    req.user = undefined;
  }

  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication is required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have access to this resource'));
    }

    next();
  };
}
