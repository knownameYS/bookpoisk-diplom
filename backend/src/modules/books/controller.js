import { Readable } from 'node:stream';
import {
  createBook,
  deleteBook,
  getBookById,
  getBookFragment,
  getBookFragmentFile,
  getNoveltyFeed,
  listBooks,
  updateBook,
  updateBookStatus
} from './service.js';

export async function list(req, res) {
  const data = await listBooks(req.validated.query);
  res.json(data);
}

export async function getOne(req, res) {
  const item = await getBookById(req.validated.params.id);
  res.json({ item });
}

export async function getFragment(req, res) {
  const item = await getBookFragment(req.validated.params.id);
  res.json({ item });
}

export async function getFragmentFile(req, res) {
  const file = await getBookFragmentFile(req.validated.params.id);

  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Cache-Control', 'public, max-age=3600');

  if (file.contentLength) {
    res.setHeader('Content-Length', file.contentLength);
  }

  if (file.lastModified) {
    res.setHeader('Last-Modified', file.lastModified);
  }

  Readable.fromWeb(file.body).pipe(res);
}

export async function noveltyFeed(req, res) {
  const items = await getNoveltyFeed();
  res.json({ items });
}

export async function create(req, res) {
  const item = await createBook(req.validated.body, req.user.sub);
  res.status(201).json({ item });
}

export async function patch(req, res) {
  const item = await updateBook(req.validated.params.id, req.validated.body, req.user.sub);
  res.json({ item });
}

export async function patchStatus(req, res) {
  const item = await updateBookStatus(req.validated.params.id, req.validated.body.status);
  res.json({ item });
}

export async function remove(req, res) {
  await deleteBook(req.validated.params.id);
  res.status(204).send();
}
