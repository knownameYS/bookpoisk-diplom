import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyPassword,
  verifyRefreshToken
} from '../src/common/auth.js';

test('auth helpers hash and verify password', async () => {
  const password = 'Reader123!';
  const hash = await hashPassword(password);

  assert.notEqual(hash, password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
});

test('auth helpers sign and verify jwt tokens', async () => {
  const user = { id: 'user-1', role: 'USER' };
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  const accessPayload = verifyAccessToken(accessToken);
  const refreshPayload = verifyRefreshToken(refreshToken);

  assert.equal(accessPayload.sub, user.id);
  assert.equal(accessPayload.role, user.role);
  assert.equal(refreshPayload.sub, user.id);
});

test('refresh token hash is deterministic and hides raw value', async () => {
  const token = 'raw-refresh-token';
  const hashed = hashToken(token);

  assert.notEqual(hashed, token);
  assert.equal(hashed, hashToken(token));
});
