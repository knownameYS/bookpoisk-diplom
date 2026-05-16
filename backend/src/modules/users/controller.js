import {
  discoverUsers,
  followUser,
  getOwnProfile,
  getPublicProfile,
  unfollowUser,
  updateAvatar,
  updateProfile
} from './service.js';

export async function getMe(req, res) {
  const user = await getOwnProfile(req.user.sub);
  res.json({ user });
}

export async function patchMe(req, res) {
  const user = await updateProfile(req.user.sub, req.validated.body);
  res.json({ user });
}

export async function uploadMyAvatar(req, res) {
  if (!req.file) {
    throw new Error('Avatar file is required');
  }

  const user = await updateAvatar(req.user.sub, req.file.filename);
  res.json({ user });
}

export async function getPublic(req, res) {
  const user = await getPublicProfile(req.validated.params.username, req.user?.sub);
  res.json({ user });
}

export async function follow(req, res) {
  const user = await followUser(req.user.sub, req.validated.params.username);
  res.json({ user });
}

export async function unfollow(req, res) {
  const user = await unfollowUser(req.user.sub, req.validated.params.username);
  res.json({ user });
}

export async function discover(req, res) {
  const items = await discoverUsers(req.user?.sub, req.validated.query.query);
  res.json({ items });
}
