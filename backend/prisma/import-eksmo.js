import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ContentStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const noveltyFeedPath = path.resolve(currentDir, '../src/data/novelty-feed.json');

const catalogSections = [
  {
    slug: 'fantastika',
    title: 'Фантастика',
    url: 'https://eksmo.ru/khudozhestvennaya-literatura/fantastika/'
  },
  {
    slug: 'detektivy',
    title: 'Детективы',
    url: 'https://eksmo.ru/khudozhestvennaya-literatura/detektivy/'
  },
  {
    slug: 'mistika-i-uzhasy',
    title: 'Мистика и ужасы',
    url: 'https://eksmo.ru/khudozhestvennaya-literatura/mistika-i-uzhasy/'
  },
  {
    slug: 'sovremennaya-proza',
    title: 'Современная проза',
    url: 'https://eksmo.ru/khudozhestvennaya-literatura/sovremennaya-proza/'
  },
  {
    slug: 'lyubov',
    title: 'Любовь',
    url: 'https://eksmo.ru/khudozhestvennaya-literatura/lyubov/'
  },
  {
    slug: 'klassika',
    title: 'Классика',
    url: 'https://eksmo.ru/khudozhestvennaya-literatura/klassika/'
  }
];

const requestTimeoutMs = 30000;
const targetPerSection = Number.parseInt(process.env.EKSMO_TARGET_PER_SECTION ?? '450', 10);
const maxPagesPerSection = Number.parseInt(process.env.EKSMO_MAX_PAGES ?? '40', 10);
const concurrency = Number.parseInt(process.env.EKSMO_CONCURRENCY ?? '5', 10);
const blockedEksmoSourceUrls = ['https://eksmo.ru/book/dobro/', 'https://eksmo.ru/book/bestsellery/'];
const blockedEksmoTitles = ['Книги доброты Эксмо', 'Книги мировые бестселлеры 2026 список лучших изданий'];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSpaces(value) {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(value) {
  if (!value) {
    return '';
  }

  return String(value)
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function stripTags(value) {
  return normalizeSpaces(
    decodeHtml(
      String(value ?? '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
    )
  );
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function parseInteger(value) {
  const digits = normalizeSpaces(value).match(/(\d+)/);
  return digits ? Number.parseInt(digits[1], 10) : null;
}

function parseWeightGrams(value) {
  const normalized = normalizeSpaces(value).toLowerCase();
  if (!normalized) {
    return null;
  }

  const kg = normalized.match(/(\d+(?:[.,]\d+)?)\s*кг/);
  if (kg) {
    return Math.round(Number.parseFloat(kg[1].replace(',', '.')) * 1000);
  }

  const grams = normalized.match(/(\d+(?:[.,]\d+)?)\s*г/);
  return grams ? Math.round(Number.parseFloat(grams[1].replace(',', '.'))) : parseInteger(normalized);
}

function parseReadTimeHours(value) {
  const normalized = normalizeSpaces(value).toLowerCase();
  if (!normalized) {
    return null;
  }

  const hours = normalized.match(/(\d+(?:[.,]\d+)?)\s*час/);
  const minutes = normalized.match(/(\d+(?:[.,]\d+)?)\s*мин/);
  const total =
    (hours ? Number.parseFloat(hours[1].replace(',', '.')) : 0) +
    (minutes ? Number.parseFloat(minutes[1].replace(',', '.')) / 60 : 0);

  return total ? Number(total.toFixed(2)) : null;
}

function normalizeUrl(value, baseUrl = 'https://eksmo.ru') {
  const normalized = normalizeSpaces(value);
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  if (normalized.startsWith('//')) {
    return `https:${normalized}`;
  }

  return new URL(normalized, baseUrl).toString();
}

function normalizeIsbn(value) {
  const normalized = normalizeSpaces(value);
  return normalized || null;
}

function normalizeComparableText(value) {
  return normalizeSpaces(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function cleanAboutParagraph(value) {
  return normalizeSpaces(value).replace(
    /^НЕЗАКОННОЕ ПОТРЕБЛЕНИЕ НАРКОТИЧЕСКИХ СРЕДСТВ, ПСИХОТРОПНЫХ ВЕЩЕСТВ, ИХ АНАЛОГОВ ПРИЧИНЯЕТ ВРЕД ЗДОРОВЬЮ, ИХ НЕЗАКОННЫЙ ОБОРОТ ЗАПРЕЩЕН И ВЛЕЧЕТ УСТАНОВЛЕННУЮ ЗАКОНОДАТЕЛЬСТВОМ ОТВЕТСТВЕННОСТЬ\.?\s*/i,
    ''
  );
}

function matchMetaContent(html, attribute, name) {
  const pattern = new RegExp(`<meta[^>]+${attribute}=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i');
  const match = html.match(pattern);
  return match ? stripTags(match[1]) : null;
}

function extractGenreFromMetaDescription(description) {
  const match = normalizeSpaces(description).match(/в жанре\s+([^,]+)/i);
  return match ? normalizeSpaces(match[1]) : null;
}

function extractPropertyMap(html) {
  const props = new Map();
  const pattern = /<div class="book-page__card-prop">\s*<span class="book-page__card-prop-name">([\s\S]*?)<\/span>([\s\S]*?)<\/div>/gi;

  for (const match of html.matchAll(pattern)) {
    const key = stripTags(match[1]).replace(/:\s*$/, '');
    const value = stripTags(match[2]);

    if (key && value) {
      props.set(key, value);
    }
  }

  return props;
}

function extractAboutBookDescription(html) {
  const match = html.match(/<div[^>]+class="[^"]*\bbook-page__card-description-text\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (!match) {
    return null;
  }

  const paragraphs = [...match[1].matchAll(/<p>([\s\S]*?)<\/p>/gi)]
    .map((item) => stripTags(item[1]))
    .map((item) => cleanAboutParagraph(item))
    .filter(Boolean)
    .filter((item) => !/удобный для чтения|межстрочн/i.test(item));

  if (paragraphs.length) {
    return paragraphs.join('\n\n');
  }

  const fallback = cleanAboutParagraph(stripTags(match[1]));
  return fallback || null;
}

function cleanMetaDescription(description) {
  const normalized = normalizeSpaces(description);

  if (!normalized) {
    return null;
  }

  const rewritten = normalized.replace(
    /^Книга\s+«?(.+?)»?\s+в жанре\s+([^,]+),\s+автора\s+([^.]+)\.\s*Читайте отрывок, видеообзоры, рецензии\.\s*Купить с доставкой\.\s*Издательство Эксмо\s*\(([^)]+)\)\.?$/i,
    '$1. $3. Жанр: $2.'
  );
  const generic = normalized
    .replace(/\s*Читайте отрывок, видеообзоры, рецензии\.\s*Купить с доставкой\.\s*Издательство Эксмо\s*\([^)]+\)\.?/i, '')
    .replace(/^Книга\s+/i, '');
  const preferred = rewritten !== normalized ? rewritten : generic;

  return normalizeSpaces(preferred) || null;
}

function isSuspiciousDescription(description, title) {
  const normalized = normalizeSpaces(description);

  if (!normalized) {
    return true;
  }

  if (/^НЕЗАКОННОЕ ПОТРЕБЛЕНИЕ НАРКОТИЧЕСКИХ СРЕДСТВ/i.test(normalized)) {
    return true;
  }

  const comparableDescription = normalizeComparableText(normalized);
  const comparableTitle = normalizeComparableText(title);

  if (!comparableDescription || comparableDescription === comparableTitle) {
    return true;
  }

  return normalized.length < 24;
}

function pickBestDescription(title, aboutDescription, metaDescription) {
  const cleanedMetaDescription = cleanMetaDescription(metaDescription);

  if (aboutDescription && !isSuspiciousDescription(aboutDescription, title)) {
    return aboutDescription;
  }

  return cleanedMetaDescription ?? aboutDescription ?? null;
}

function isValidBookUrl(url) {
  return /\/book\/[^/?#]+-ITD\d+\/$/i.test(url);
}

function resolveSectionByBook(book) {
  return (
    catalogSections.find((section) => section.slug === book.catalogSectionSlug) ?? {
      slug: normalizeSpaces(book.catalogSectionSlug) || 'eksmo',
      title: normalizeSpaces(book.catalogSection) || 'Художественная литература',
      url: book.sourceUrl
    }
  );
}

function extractBookUrls(html) {
  const urls = [];

  for (const match of html.matchAll(/href="(\/book\/[^"#?\s]+\/)"/gi)) {
    const normalizedUrl = normalizeUrl(match[1]);

    if (normalizedUrl && isValidBookUrl(normalizedUrl)) {
      urls.push(normalizedUrl);
    }
  }

  return unique(urls);
}

function buildTagNames(section, description, props) {
  const source = `${normalizeSpaces(description)} ${normalizeSpaces(props.get('Серия'))} ${section.title}`.toLowerCase();
  const tags = [];

  if (/(мрач|темн|ужас|жутк|страш)/.test(source)) tags.push('мрачная');
  if (/(атмосфер|уют|тишин|меланхол|послевкус)/.test(source)) tags.push('атмосферная');
  if (/(философ|идея|смысл|антиутоп|экзистенц)/.test(source)) tags.push('философская');
  if (/(вселен|мир|импер|маг|королев|сага|цикл)/.test(source)) tags.push('миростроение');
  if (/(медлен|нетороп|slow burn)/.test(source)) tags.push('медленное развитие');
  if (/(экзистенц|смысл жизни)/.test(source)) tags.push('экзистенциальная');
  if (/(сатир|ирон)/.test(source)) tags.push('сатирическая');

  return unique(tags);
}

function parseAuthors(value) {
  return unique(
    normalizeSpaces(value)
      .split(/[,;/]| и /i)
      .map((item) => normalizeSpaces(item))
      .filter(Boolean)
  );
}

async function fetchText(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; BookpoiskEksmoImporter/1.0)',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'ru-RU,ru;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(requestTimeoutMs)
    });

    if (!response.ok) {
      throw new Error(`Request failed for ${url}: ${response.status}`);
    }

    return response.text();
  } catch (error) {
    if (attempt >= 4) {
      throw error;
    }

    await sleep(attempt * 700);
    return fetchText(url, attempt + 1);
  }
}

async function mapWithConcurrency(items, limit, worker) {
  const queue = [...items];
  const results = [];

  async function runWorker() {
    while (queue.length) {
      const item = queue.shift();
      results.push(await worker(item));
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, limit) }, () => runWorker()));
  return results;
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

  let genre = await prisma.genre.findFirst({
    where: { name }
  });

  if (!genre) {
    try {
      genre = await prisma.genre.create({
        data: { name }
      });
    } catch {
      genre = await prisma.genre.findFirst({
        where: { name }
      });
    }
  }

  genreCache.set(name, genre);
  return genre;
}

async function ensureTag(name, tagCache) {
  if (tagCache.has(name)) {
    return tagCache.get(name);
  }

  let tag = await prisma.tag.findFirst({
    where: { name }
  });

  if (!tag) {
    try {
      tag = await prisma.tag.create({
        data: { name }
      });
    } catch {
      tag = await prisma.tag.findFirst({
        where: { name }
      });
    }
  }

  tagCache.set(name, tag);
  return tag;
}

async function replaceRelations(tx, bookId, authorIds, genreIds, tagIds) {
  const uniqueAuthorIds = unique(authorIds);
  const uniqueGenreIds = unique(genreIds);
  const uniqueTagIds = unique(tagIds);

  await tx.bookAuthor.deleteMany({ where: { bookId } });
  await tx.bookGenre.deleteMany({ where: { bookId } });
  await tx.bookTag.deleteMany({ where: { bookId } });

  if (uniqueAuthorIds.length) {
    await tx.bookAuthor.createMany({
      data: uniqueAuthorIds.map((authorId, index) => ({
        bookId,
        authorId,
        authorOrder: index + 1,
        role: 'Автор'
      })),
      skipDuplicates: true
    });
  }

  if (uniqueGenreIds.length) {
    await tx.bookGenre.createMany({
      data: uniqueGenreIds.map((genreId) => ({
        bookId,
        genreId
      })),
      skipDuplicates: true
    });
  }

  if (uniqueTagIds.length) {
    await tx.bookTag.createMany({
      data: uniqueTagIds.map((tagId) => ({
        bookId,
        tagId
      })),
      skipDuplicates: true
    });
  }
}

async function findExistingBook(sourceUrl, isbn13, title, authorNames) {
  if (sourceUrl) {
    const bySourceUrl = await prisma.book.findFirst({
      where: { sourceUrl }
    });
    if (bySourceUrl) {
      return bySourceUrl;
    }
  }

  if (isbn13) {
    const byIsbn = await prisma.book.findFirst({
      where: { isbn13 }
    });
    if (byIsbn) {
      return byIsbn;
    }
  }

  if (authorNames.length) {
    const byTitleAndAuthor = await prisma.book.findFirst({
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
    if (byTitleAndAuthor) {
      return byTitleAndAuthor;
    }
  }

  return prisma.book.findFirst({
    where: { title }
  });
}

async function collectSectionUrls(section) {
  const collected = [];
  const seen = new Set();

  for (let page = 1; page <= maxPagesPerSection && collected.length < targetPerSection; page += 1) {
    const url = page === 1 ? section.url : `${section.url}?PAGEN_1=${page}`;
    const html = await fetchText(url);
    const pageUrls = extractBookUrls(html).filter((bookUrl) => !seen.has(bookUrl));

    if (!pageUrls.length) {
      break;
    }

    for (const bookUrl of pageUrls) {
      seen.add(bookUrl);
      collected.push(bookUrl);
      if (collected.length >= targetPerSection) {
        break;
      }
    }

    console.log(`[eksmo] ${section.slug}: page ${page}, collected ${collected.length}`);
  }

  return collected.slice(0, targetPerSection);
}

async function importBook(url, section, caches) {
  const html = await fetchText(url);
  const props = extractPropertyMap(html);
  const title =
    matchMetaContent(html, 'name', 'mailfit-product-name') ??
    matchMetaContent(html, 'property', 'og:title') ??
    props.get('Название');
  const coverUrl =
    normalizeUrl(matchMetaContent(html, 'name', 'mailfit-product-img')) ??
    normalizeUrl(matchMetaContent(html, 'property', 'twitter:image')) ??
    normalizeUrl(matchMetaContent(html, 'property', 'og:image'));
  const aboutDescription = extractAboutBookDescription(html);
  const metaDescription =
    matchMetaContent(html, 'name', 'description') ??
    matchMetaContent(html, 'property', 'og:description') ??
    matchMetaContent(html, 'name', 'mailfit-product-desc');
  const description = pickBestDescription(title, aboutDescription, metaDescription);
  const authors = parseAuthors(matchMetaContent(html, 'name', 'mailfit-product-author') ?? props.get('Автор') ?? '');

  if (!title || !coverUrl) {
    return { skipped: true, reason: 'missing-title-or-cover', url };
  }

  const genreNames = unique([
    section.title,
    extractGenreFromMetaDescription(metaDescription),
    props.get('Жанр')
  ]);
  const tagNames = buildTagNames(section, description, props);

  const authorIds = [];
  for (const fullName of authors) {
    const author = await ensureAuthor(fullName, caches.authorCache);
    authorIds.push(author.id);
  }

  const genreIds = [];
  for (const name of genreNames) {
    const genre = await ensureGenre(name, caches.genreCache);
    genreIds.push(genre.id);
  }

  const tagIds = [];
  for (const name of tagNames) {
    const tag = await ensureTag(name, caches.tagCache);
    tagIds.push(tag.id);
  }

  const payload = {
    title,
    originalTitle: null,
    description,
    isbn13: normalizeIsbn(props.get('ISBN')),
    catalogSection: section.title,
    catalogSectionSlug: section.slug,
    publicationYear: parseInteger(props.get('Год издания')),
    language: 'ru',
    coverUrl,
    sourceSite: 'eksmo',
    sourceUrl: url,
    series: normalizeSpaces(props.get('Серия')) || null,
    publisher: normalizeSpaces(props.get('Издательство')) || null,
    editor: normalizeSpaces(props.get('Редактор')) || null,
    ageRestriction: normalizeSpaces(props.get('Возрастное ограничение')) || null,
    binding: normalizeSpaces(props.get('Обложка')) || null,
    pageCount: parseInteger(props.get('Кол-во страниц')),
    weightGrams: parseWeightGrams(props.get('Вес')),
    thicknessMm: parseInteger(props.get('Толщина')),
    bookFormat: normalizeSpaces(props.get('Формат')) || null,
    paperMaterial: normalizeSpaces(props.get('Материал бумаги')) || null,
    readTimeHours: parseReadTimeHours(props.get('Время прочтения')),
    status: ContentStatus.PUBLISHED
  };

  const existing = await findExistingBook(payload.sourceUrl, payload.isbn13, payload.title, authors);
  const book = await prisma.$transaction(
    async (tx) => {
      const entity = existing
        ? await tx.book.update({
            where: { id: existing.id },
            data: payload
          })
        : await tx.book.create({
            data: payload
          });

      await replaceRelations(tx, entity.id, authorIds, genreIds, tagIds);
      return entity;
    },
    {
      maxWait: 120000,
      timeout: 120000
    }
  );

  return {
    id: book.id,
    title: book.title,
    created: !existing,
    updated: Boolean(existing),
    skipped: false,
    section: section.slug,
    url
  };
}

async function cleanupBooksWithoutCovers() {
  const deleted = await prisma.book.deleteMany({
    where: {
      OR: [{ coverUrl: null }, { coverUrl: '' }]
    }
  });

  return deleted.count;
}

async function cleanupKnownPromoBooks() {
  const deleted = await prisma.book.deleteMany({
    where: {
      sourceSite: 'eksmo',
      OR: [{ sourceUrl: { in: blockedEksmoSourceUrls } }, { title: { in: blockedEksmoTitles } }]
    }
  });

  return deleted.count;
}

async function cleanupLegacyBooks(importedBookIds) {
  if (!importedBookIds.length) {
    return { removed: 0, hidden: 0 };
  }

  const staleBooks = await prisma.book.findMany({
    where: {
      id: {
        notIn: importedBookIds
      }
    },
    select: {
      id: true,
      _count: {
        select: {
          ratings: true,
          reviews: true,
          articles: true,
          favorites: true,
          collectionBooks: true,
          featuredByUsers: true
        }
      }
    }
  });

  const removableIds = [];
  const hideIds = [];

  for (const book of staleBooks) {
    const linkedCount =
      book._count.ratings +
      book._count.reviews +
      book._count.articles +
      book._count.favorites +
      book._count.collectionBooks +
      book._count.featuredByUsers;

    if (linkedCount === 0) {
      removableIds.push(book.id);
    } else {
      hideIds.push(book.id);
    }
  }

  if (removableIds.length) {
    await prisma.book.deleteMany({
      where: {
        id: {
          in: removableIds
        }
      }
    });
  }

  if (hideIds.length) {
    await prisma.book.updateMany({
      where: {
        id: {
          in: hideIds
        }
      },
      data: {
        status: ContentStatus.HIDDEN
      }
    });
  }

  return {
    removed: removableIds.length,
    hidden: hideIds.length
  };
}

async function writeNoveltyFeed(importedBookIds) {
  const books = await prisma.book.findMany({
    where: {
      id: {
        in: importedBookIds
      },
      status: ContentStatus.PUBLISHED,
      coverUrl: {
        not: null
      }
    },
    include: {
      bookAuthors: {
        include: {
          author: true
        },
        orderBy: {
          authorOrder: 'asc'
        }
      }
    },
    orderBy: [{ publicationYear: 'desc' }, { updatedAt: 'desc' }],
    take: 9
  });

  const feed = books.map((book) => ({
    title: book.title,
    authors: book.bookAuthors.map((item) => item.author.fullName),
    coverUrl: book.coverUrl,
    avgFinalScore: 0,
    ratingLabel: null,
    bookId: book.id
  }));

  await fs.writeFile(noveltyFeedPath, `${JSON.stringify(feed, null, 2)}\n`, 'utf8');
}

async function refreshExistingEksmoBooks(caches, importedBookIds, importedSourceUrls, summary) {
  const existingBooks = await prisma.book.findMany({
    where: {
      sourceSite: 'eksmo',
      sourceUrl: {
        not: null
      }
    },
    select: {
      sourceUrl: true,
      catalogSection: true,
      catalogSectionSlug: true
    }
  });

  const backfillBooks = existingBooks.filter(
    (book) => book.sourceUrl && isValidBookUrl(book.sourceUrl) && !importedSourceUrls.has(book.sourceUrl)
  );

  if (!backfillBooks.length) {
    return;
  }

  console.log(`[eksmo] backfill existing books: ${backfillBooks.length}`);

  const results = await mapWithConcurrency(backfillBooks, concurrency, async (book) => {
    try {
      return await importBook(book.sourceUrl, resolveSectionByBook(book), caches);
    } catch (error) {
      console.error(`[eksmo] failed to backfill ${book.sourceUrl}`, error);
      return { skipped: true, reason: 'backfill-error', url: book.sourceUrl };
    }
  });

  for (const result of results) {
    if (result?.id) {
      importedBookIds.push(result.id);

      if (result?.url) {
        importedSourceUrls.add(result.url);
      }

      if (result?.created) {
        summary.created += 1;
      } else if (result?.updated) {
        summary.updated += 1;
      }
    } else {
      summary.skipped += 1;
    }
  }
}

async function main() {
  const caches = {
    authorCache: new Map(),
    genreCache: new Map(),
    tagCache: new Map()
  };
  const importedBookIds = [];
  const importedSourceUrls = new Set();
  const summary = {
    created: 0,
    updated: 0,
    skipped: 0,
    perSection: {}
  };

  for (const section of catalogSections) {
    const urls = await collectSectionUrls(section);
    summary.perSection[section.slug] = {
      target: targetPerSection,
      discovered: urls.length,
      created: 0,
      updated: 0,
      skipped: 0
    };

    const results = await mapWithConcurrency(urls, concurrency, async (url) => {
      try {
        return await importBook(url, section, caches);
      } catch (error) {
        console.error(`[eksmo] failed to import ${url}`, error);
        return { skipped: true, reason: 'import-error', url };
      }
    });

    for (const result of results) {
      if (result?.id) {
        importedBookIds.push(result.id);

        if (result?.url) {
          importedSourceUrls.add(result.url);
        }
      }

      if (result?.created) {
        summary.created += 1;
        summary.perSection[section.slug].created += 1;
      } else if (result?.updated) {
        summary.updated += 1;
        summary.perSection[section.slug].updated += 1;
      } else {
        summary.skipped += 1;
        summary.perSection[section.slug].skipped += 1;
      }
    }

    console.log(`[eksmo] ${section.slug}: created ${summary.perSection[section.slug].created}, updated ${summary.perSection[section.slug].updated}`);
  }

  await refreshExistingEksmoBooks(caches, importedBookIds, importedSourceUrls, summary);

  const nullCoverDeleted = await cleanupBooksWithoutCovers();
  const promoDeleted = await cleanupKnownPromoBooks();
  const legacy = await cleanupLegacyBooks(unique(importedBookIds));
  await writeNoveltyFeed(unique(importedBookIds));

  console.log('Eksmo import complete');
  console.log({
    ...summary,
    nullCoverDeleted,
    promoDeleted,
    legacy
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
