import { deleteBookRating, listMyRatings, upsertBookRating } from './service.js';

export async function upsert(req, res) {
  const data = await upsertBookRating(req.validated.params.bookId, req.user.sub, req.validated.body);
  res.json(data);
}

export async function remove(req, res) {
  await deleteBookRating(req.validated.params.bookId, req.user.sub);
  res.status(204).send();
}

export async function mine(req, res) {
  const items = await listMyRatings(req.user.sub);
  res.json({ items });
}
