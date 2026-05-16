import {
  createTaxonomyItem,
  deleteTaxonomyItem,
  getTaxonomyItem,
  listTaxonomy,
  updateTaxonomyItem
} from './service.js';

export function createTaxonomyHandlers(type) {
  return {
    list: async (req, res) => {
      const data = await listTaxonomy(type, req.validated.query);
      res.json(data);
    },
    getOne: async (req, res) => {
      const item = await getTaxonomyItem(type, req.validated.params.id);
      res.json({ item });
    },
    create: async (req, res) => {
      const item = await createTaxonomyItem(type, req.validated.body);
      res.status(201).json({ item });
    },
    update: async (req, res) => {
      const item = await updateTaxonomyItem(type, req.validated.params.id, req.validated.body);
      res.json({ item });
    },
    remove: async (req, res) => {
      await deleteTaxonomyItem(type, req.validated.params.id);
      res.status(204).send();
    }
  };
}
