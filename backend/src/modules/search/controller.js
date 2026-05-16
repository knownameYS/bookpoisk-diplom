import { runAiSearch, runSearch } from './service.js';

export async function search(req, res) {
  const data = await runSearch(req.validated.query);
  res.json(data);
}

export async function aiSearch(req, res) {
  const data = await runAiSearch(req.validated.body.prompt, req.validated.body.filters);
  res.json(data);
}
