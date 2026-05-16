import {
  addBookToCollection,
  addFavorite,
  clearReadingShelf,
  createCollection,
  deleteCollection,
  getFavoriteStatus,
  getCollection,
  getReadingShelfState,
  listFavorites,
  listReadingShelves,
  listMyCollections,
  listPublicCollections,
  removeCollectionBook,
  removeFavorite,
  setReadingShelf,
  updateCollection,
  updateCollectionBook
} from './service.js';

export async function listFavoritesAction(req, res) {
  const items = await listFavorites(req.user.sub);
  res.json({ items });
}

export async function addFavoriteAction(req, res) {
  const item = await addFavorite(req.user.sub, req.validated.params.bookId);
  res.status(201).json({ item });
}

export async function getFavoriteStatusAction(req, res) {
  const item = await getFavoriteStatus(req.user.sub, req.validated.params.bookId);
  res.json({ item });
}

export async function removeFavoriteAction(req, res) {
  await removeFavorite(req.user.sub, req.validated.params.bookId);
  res.status(204).send();
}

export async function listPublicCollectionsAction(req, res) {
  const data = await listPublicCollections(req.validated.query);
  res.json(data);
}

export async function listMyCollectionsAction(req, res) {
  const data = await listMyCollections(req.user.sub, req.validated.query);
  res.json(data);
}

export async function getCollectionAction(req, res) {
  const item = await getCollection(req.validated.params.id, req.user);
  res.json({ item });
}

export async function listReadingShelvesAction(req, res) {
  const items = await listReadingShelves(req.user.sub);
  res.json({ items });
}

export async function getReadingShelfStateAction(req, res) {
  const item = await getReadingShelfState(req.user.sub, req.validated.params.bookId);
  res.json({ item });
}

export async function setReadingShelfAction(req, res) {
  const item = await setReadingShelf(req.user.sub, req.validated.params.shelfKey, req.validated.params.bookId);
  res.json({ item });
}

export async function clearReadingShelfAction(req, res) {
  const item = await clearReadingShelf(req.user.sub, req.validated.params.bookId);
  res.json({ item });
}

export async function createCollectionAction(req, res) {
  const item = await createCollection(req.user.sub, req.validated.body);
  res.status(201).json({ item });
}

export async function updateCollectionAction(req, res) {
  const item = await updateCollection(req.validated.params.id, req.user.sub, req.validated.body);
  res.json({ item });
}

export async function deleteCollectionAction(req, res) {
  await deleteCollection(req.validated.params.id, req.user.sub);
  res.status(204).send();
}

export async function addCollectionBookAction(req, res) {
  const item = await addBookToCollection(req.validated.params.id, req.user.sub, req.validated.body);
  res.json({ item });
}

export async function updateCollectionBookAction(req, res) {
  const item = await updateCollectionBook(
    req.validated.params.id,
    req.validated.params.bookId,
    req.user.sub,
    req.validated.body
  );
  res.json({ item });
}

export async function removeCollectionBookAction(req, res) {
  await removeCollectionBook(req.validated.params.id, req.validated.params.bookId, req.user.sub);
  res.status(204).send();
}
