import { normalizeBookSort } from '../../../common/book-sort.js';

const aiRequestTimeoutMs = 30000;
const retriableStatusCodes = new Set([429, 500, 502, 503, 504]);

export class AiProviderError extends Error {
  constructor(message, { provider = 'ai', statusCode = 500, details } = {}) {
    super(message);
    this.name = 'AiProviderError';
    this.provider = provider;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function extractJsonBlock(text) {
  const raw = text.trim();

  if (raw.startsWith('```')) {
    return raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
  }

  return raw;
}

function normalizeGenreValue(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  if (!normalized) {
    return null;
  }

  return normalized
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeTagValue(value) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  return normalized || null;
}

export function normalizeAiFilters(value) {
  const input = value && typeof value === 'object' ? value : {};
  const origin =
    typeof input.origin === 'string' && ['foreign', 'russian'].includes(input.origin.trim().toLowerCase())
      ? input.origin.trim().toLowerCase()
      : undefined;

  return {
    query: typeof input.query === 'string' ? input.query.trim() || undefined : undefined,
    genres: Array.isArray(input.genres) ? input.genres.map(normalizeGenreValue).filter(Boolean) : [],
    tags: Array.isArray(input.tags) ? input.tags.map(normalizeTagValue).filter(Boolean) : [],
    author: typeof input.author === 'string' ? input.author.trim() || undefined : undefined,
    section: typeof input.section === 'string' ? input.section.trim() || undefined : undefined,
    origin,
    language: typeof input.language === 'string' ? input.language.trim() || undefined : undefined,
    yearFrom: Number.isInteger(input.yearFrom) ? input.yearFrom : undefined,
    yearTo: Number.isInteger(input.yearTo) ? input.yearTo : undefined,
    minRating: undefined,
    maxRating: undefined,
    sort: normalizeBookSort(input.sort, 'newest_desc')
  };
}

function normalizeSuggestionText(value) {
  return String(value ?? '')
    .replace(/[«»"„“”`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeAiSearchCuration(value) {
  const input = value && typeof value === 'object' ? value : {};

  return {
    answer: typeof input.answer === 'string' ? input.answer.trim() : '',
    filters: normalizeAiFilters(input.filters),
    suggestions: Array.isArray(input.suggestions)
      ? input.suggestions
          .flatMap((item) => {
            if (typeof item === 'string') {
              return [
                {
                  title: normalizeSuggestionText(item),
                  originalTitle: '',
                  author: '',
                  reason: ''
                }
              ];
            }

            if (!item || typeof item !== 'object') {
              return [];
            }

            return [
              {
                title: normalizeSuggestionText(item.title ?? item.name ?? item.bookTitle),
                originalTitle: normalizeSuggestionText(item.originalTitle ?? item.original_name ?? item.englishTitle),
                author: normalizeSuggestionText(item.author ?? item.authorName ?? item.writer),
                reason: normalizeSuggestionText(item.reason ?? item.why ?? item.comment)
              }
            ];
          })
          .filter((item) => item.title)
      : []
  };
}

function parseRetryAfterSeconds(value) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return null;
  }

  const seconds = Number(normalized);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds;
  }

  const date = Date.parse(normalized);

  if (Number.isFinite(date)) {
    return Math.max(0, Math.ceil((date - Date.now()) / 1000));
  }

  return null;
}

function sleep(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function readErrorPayload(response) {
  const raw = await response.text();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

export async function requestJson({ url, headers, body, parse, provider = 'ai', maxAttempts = 2, timeoutMs = aiRequestTimeoutMs }) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch (error) {
      const isTimeout = error?.name === 'AbortError' || error?.name === 'TimeoutError';

      if (attempt < maxAttempts && isTimeout) {
        await sleep(attempt * 1200);
        continue;
      }

      throw new AiProviderError(isTimeout ? 'AI provider request timed out' : 'AI provider request failed', {
        provider,
        statusCode: 504,
        details: {
          providerMessage: isTimeout ? `Request timed out after ${timeoutMs}ms` : error?.message ?? null,
          providerCode: error?.name ?? null
        }
      });
    }

    if (!response.ok) {
      const errorPayload = await readErrorPayload(response);
      const retryAfterSeconds = parseRetryAfterSeconds(response.headers.get('retry-after'));
      const providerMessage =
        errorPayload?.error?.message ??
        errorPayload?.message ??
        errorPayload?.raw ??
        `AI provider request failed with status ${response.status}`;

      if (attempt < maxAttempts && retriableStatusCodes.has(response.status)) {
        const retryDelayMs = retryAfterSeconds ? retryAfterSeconds * 1000 : attempt * 1200;
        await sleep(retryDelayMs);
        continue;
      }

      throw new AiProviderError(`AI provider request failed with status ${response.status}`, {
        provider,
        statusCode: response.status,
        details: {
          providerMessage,
          providerCode: errorPayload?.error?.status ?? null
        }
      });
    }

    const payload = await response.json();
    return parse(payload);
  }

  throw new AiProviderError('AI provider request failed after retries', {
    provider,
    statusCode: 503
  });
}
