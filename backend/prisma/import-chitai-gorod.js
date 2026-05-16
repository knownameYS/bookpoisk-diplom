import fs from 'node:fs/promises';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { PrismaClient, ContentStatus } from '@prisma/client';
import { calculateRating84, ratingLabel } from '../src/common/rating84.js';

const prisma = new PrismaClient();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const noveltyFeedPath = path.resolve(currentDir, '../src/data/novelty-feed.json');
const contentHost = 'https://content.img-gorod.ru';
const catalogBaseUrl = 'https://www.chitai-gorod.ru/catalog/books-18030';
const noveltyUrl = 'https://www.chitai-gorod.ru/novelty';
const targetBooks = 500;
const maxPages = 20;
const requestTimeoutMs = 30000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(value, min = 1, max = 10) {
  return Math.max(min, Math.min(max, value));
}

function normalizeSpaces(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeNuxtPayload(payload) {
  const cache = new Map();

  function decodeNode(node) {
    if (typeof node === 'number') {
      return decodeIndex(node);
    }

    if (node === null || typeof node !== 'object') {
      return node;
    }

    if (Array.isArray(node)) {
      const tag = node[0];
      if (tag === 'ShallowReactive' || tag === 'Reactive' || tag === 'ShallowRef') {
        return decodeNode(node[1]);
      }

      return node.map((item) => decodeNode(item));
    }

    const out = {};
    for (const [key, value] of Object.entries(node)) {
      out[key] = decodeNode(value);
    }
    return out;
  }

  function decodeIndex(index) {
    if (cache.has(index)) {
      return cache.get(index);
    }

    const value = payload[index];

    if (value === null || typeof value !== 'object') {
      cache.set(index, value);
      return value;
    }

    if (Array.isArray(value)) {
      const tag = value[0];
      if (tag === 'ShallowReactive' || tag === 'Reactive' || tag === 'ShallowRef') {
        const resolved = decodeNode(value[1]);
        cache.set(index, resolved);
        return resolved;
      }

      const out = [];
      cache.set(index, out);
      for (const item of value) {
        out.push(decodeNode(item));
      }
      return out;
    }

    const out = {};
    cache.set(index, out);
    for (const [key, child] of Object.entries(value)) {
      out[key] = decodeNode(child);
    }
    return out;
  }

  return decodeIndex(1);
}

async function fetchText(url, attempt = 1) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BookpoiskImporter/1.0)',
          Accept: 'text/html,application/xhtml+xml'
        }
      },
      (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          const redirected = response.headers.location.startsWith('http')
            ? response.headers.location
            : new URL(response.headers.location, url).toString();
          response.resume();
          resolve(fetchText(redirected, attempt));
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`Request failed for ${url}: ${response.statusCode}`));
          return;
        }

        response.setEncoding('utf8');
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => resolve(data));
      }
    );

    request.setTimeout(requestTimeoutMs, () => {
      request.destroy(new Error(`Timeout for ${url}`));
    });
    request.on('error', reject);
  }).catch(async (error) => {
    if (attempt >= 4) {
      throw error;
    }

    await sleep(attempt * 600);
    return fetchText(url, attempt + 1);
  });
}

function extractRoot(html) {
  const match = html.match(/id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!match) {
    throw new Error('Unable to find __NUXT_DATA__ payload');
  }

  return decodeNuxtPayload(JSON.parse(match[1]));
}

async function fetchCatalogProducts(page) {
  const html = await fetchText(`${catalogBaseUrl}?page=${page}`);
  const root = extractRoot(html);
  return root?.pinia?.['products-list']?.productsList ?? [];
}

async function fetchNoveltyProducts() {
  try {
    const html = await fetchText(noveltyUrl);
    const root = extractRoot(html);
    return root?.pinia?.['products-list']?.productsList ?? [];
  } catch {
    return [];
  }
}

function normalizeAuthor(author) {
  const parts = [author.lastName, author.firstName, author.middleName]
    .map((value) => normalizeSpaces(value))
    .filter(Boolean);

  return parts.join(' ').trim();
}

function normalizeCover(url) {
  if (!url) {
    return null;
  }

  const normalized = String(url).replaceAll('\\u002F', '/');
  return normalized.startsWith('http') ? normalized : `${contentHost}${normalized}`;
}

function buildBroadGenres(product) {
  const values = new Set();
  const joined = [...(product.categoryChain ?? []), product.category?.title]
    .map((item) => normalizeSpaces(item).toLowerCase())
    .join(' | ');

  if (/фэнтез|ромэнтези|исекай/.test(joined)) values.add('Фэнтези');
  if (/антиутоп|постапок|боев[а-я ]+фантаст|фантаст/.test(joined)) values.add('Антиутопия');
  if (/философ|психолог|саморазвит/.test(joined)) values.add('Философия');
  if (/классич/.test(joined)) values.add('Классика');

  return [...values];
}

function buildSeedRating(product) {
  const rawRating = Number.parseFloat(String(product.rating ?? '0').replace(',', '.'));
  const base = clamp(rawRating > 0 ? Math.round((rawRating / 5) * 10) : 7);
  const tail = Number(String(product.id).slice(-1));
  const offset = Number.isNaN(tail) ? 0 : (tail % 3) - 1;
  const categoryText = [...(product.categoryChain ?? []), product.category?.title].join(' ').toLowerCase();

  const values = {
    architecture: clamp(base + offset),
    characters: clamp(base + (product.bestseller ? 1 : 0)),
    language: clamp(base + (/классич|поэз|проза/.test(categoryText) ? 1 : 0)),
    idea: clamp(base + (/философ|антиутоп|психолог/.test(categoryText) ? 1 : 0)),
    vibe: clamp(base + (product.new ? 1 : 0))
  };

  return {
    ...values,
    ...calculateRating84(values)
  };
}

async function fetchProductMeta(url) {
  const html = await fetchText(url);
  const isbn = html.match(/<meta[^>]+name="og:isbn"[^>]+content="([^"]+)"/i)?.[1] ?? '';
  const author = html.match(/<meta[^>]+name="og:author"[^>]+content="([^"]+)"/i)?.[1] ?? '';

  return {
    isbn13: normalizeSpaces(isbn.replace(/^ISBN\s*/i, '')) || null,
    authors: author
      ? author
          .split(',')
          .map((item) => normalizeSpaces(item))
          .filter(Boolean)
      : []
  };
}

async function ensureAuthor(fullName, authorCache) {
  if (authorCache.has(fullName)) {
    return authorCache.get(fullName);
  }

  let author = await prisma.author.findFirst({
    where: { fullName }
  });

  if (!author) {
    author = await prisma.author.create({
      data: { fullName }
    });
  }

  authorCache.set(fullName, author);
  return author;
}

async function ensureGenre(name, genreCache) {
  if (genreCache.has(name)) {
    return genreCache.get(name);
  }

  const genre = await prisma.genre.upsert({
    where: { name },
    update: {},
    create: { name }
  });

  genreCache.set(name, genre);
  return genre;
}

async function replaceRelations(bookId, authorIds, genreIds) {
  await prisma.bookAuthor.deleteMany({ where: { bookId } });
  await prisma.bookGenre.deleteMany({ where: { bookId } });

  if (authorIds.length) {
    await prisma.bookAuthor.createMany({
      data: authorIds.map((authorId, index) => ({
        bookId,
        authorId,
        authorOrder: index + 1,
        role: 'Автор'
      }))
    });
  }

  if (genreIds.length) {
    await prisma.bookGenre.createMany({
      data: genreIds.map((genreId) => ({
        bookId,
        genreId
      }))
    });
  }
}

async function findExistingBook(title, isbn13, authorNames) {
  if (isbn13) {
    const byIsbn = await prisma.book.findFirst({
      where: { isbn13 }
    });
    if (byIsbn) {
      return byIsbn;
    }
  }

  if (!authorNames.length) {
    return prisma.book.findFirst({
      where: { title }
    });
  }

  return prisma.book.findFirst({
    where: {
      title,
      bookAuthors: {
        some: {
          author: {
            fullName: {
              in: authorNames
            }
          }
        }
      }
    }
  });
}

async function importProduct(product, caches) {
  const localTitle = normalizeSpaces(product.title);
  if (!/[А-Яа-яЁё]/.test(localTitle)) {
    return null;
  }

  const productUrl = `https://www.chitai-gorod.ru/${String(product.url ?? '').replace(/^\/+/, '')}`;
  const meta = await fetchProductMeta(productUrl).catch(() => ({ isbn13: null, authors: [] }));
  const authorNames = (meta.authors.length ? meta.authors : (product.authors ?? []).map(normalizeAuthor))
    .map((name) => normalizeSpaces(name))
    .filter(Boolean);
  const genreNames = uniqueNames([
    normalizeSpaces(product.category?.title),
    ...buildBroadGenres(product)
  ]);

  const authorIds = [];
  for (const fullName of authorNames) {
    const author = await ensureAuthor(fullName, caches.authorCache);
    authorIds.push(author.id);
  }

  const genreIds = [];
  for (const name of genreNames) {
    const genre = await ensureGenre(name, caches.genreCache);
    genreIds.push(genre.id);
  }

  const payload = {
    title: localTitle,
    originalTitle: null,
    description: normalizeSpaces(product.description) || null,
    isbn13: meta.isbn13,
    publicationYear: typeof product.yearPublishing === 'number' ? product.yearPublishing : null,
    language: 'ru',
    coverUrl: normalizeCover(product.originalPicture ?? product.picture),
    status: ContentStatus.PUBLISHED
  };

  const existing = await findExistingBook(payload.title, payload.isbn13, authorNames);
  const wasCreated = !existing;
  const book = existing
    ? await prisma.book.update({
        where: { id: existing.id },
        data: payload
      })
    : await prisma.book.create({
        data: payload
      });

  await replaceRelations(book.id, authorIds, genreIds);

  return {
    id: book.id,
    created: wasCreated,
    title: payload.title,
    authorNames,
    coverUrl: payload.coverUrl
  };
}

function uniqueNames(values) {
  return [...new Set(values.map((item) => normalizeSpaces(item)).filter(Boolean))];
}

async function writeNoveltyFeed(products, importedByTitle) {
  const feed = products.slice(0, 9).map((product) => {
    const title = normalizeSpaces(product.title);
    const imported = importedByTitle.get(title);
    const authors = (product.authors ?? []).map(normalizeAuthor).filter(Boolean);

    return {
      title,
      authors,
      coverUrl: normalizeCover(product.originalPicture ?? product.picture),
      avgFinalScore: 0,
      ratingLabel: ratingLabel(0),
      bookId: imported?.id ?? null
    };
  });

  await fs.writeFile(noveltyFeedPath, `${JSON.stringify(feed, null, 2)}\n`, 'utf8');
}

async function importCatalog() {
  const caches = {
    authorCache: new Map(),
    genreCache: new Map()
  };

  const importedByTitle = new Map();
  let processed = 0;
  let currentBookCount = await prisma.book.count();

  for (let page = 1; page <= maxPages && currentBookCount < targetBooks; page += 1) {
    const products = await fetchCatalogProducts(page);
    if (!products.length) {
      break;
    }

    for (const product of products) {
      if (currentBookCount >= targetBooks) {
        break;
      }

      const imported = await importProduct(product, caches);
      if (!imported) {
        continue;
      }

      importedByTitle.set(imported.title, imported);
      processed += 1;
      if (imported.created) {
        currentBookCount += 1;
      }
    }
  }

  const noveltyProducts = await fetchNoveltyProducts();
  if (noveltyProducts.length) {
    await writeNoveltyFeed(noveltyProducts, importedByTitle);
  }

  return {
    processed,
    booksInDatabase: currentBookCount,
    novelty: Math.min(noveltyProducts.length, 9)
  };
}

async function main() {
  const result = await importCatalog();
  console.log('Catalog import complete');
  console.log(result);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
