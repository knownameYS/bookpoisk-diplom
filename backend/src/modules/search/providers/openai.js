import { env } from '../../../config/env.js';
import { extractJsonBlock, normalizeAiFilters, normalizeAiSearchCuration, requestJson } from './base.js';

function buildCurationMessages(prompt) {
  return [
    {
      role: 'system',
      content:
        'You are a book selection assistant. Return strict JSON with keys answer, filters and suggestions. answer must be concise Russian prose, 1-2 short sentences, with no markdown and no direct title list. filters must contain query, genres, tags, author, section, language, yearFrom, yearTo, minRating, maxRating, sort. Use Russian filter values when possible. Allowed sort values: rating_desc, rating_asc, year_desc, year_asc, newest_desc, newest_asc, title_asc, title_desc. suggestions must contain up to 8 objects with keys title, originalTitle, author, reason. Pick real books by mood, theme, style and aftertaste. Prefer Russian-localized titles when known. reason must be very short.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];
}

function buildInterpretationMessages(prompt) {
  return [
    {
      role: 'system',
      content:
        'Convert a natural-language book request into strict JSON with keys query, genres, tags, author, section, language, yearFrom, yearTo, minRating, maxRating, sort. Use Russian values for genres and tags from the catalog when possible. Allowed sort values: rating_desc, rating_asc, year_desc, year_asc, newest_desc, newest_asc, title_asc, title_desc. Return JSON only.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];
}

function buildRecommendationMessages(prompt, candidates) {
  return [
    {
      role: 'system',
      content:
        'You are a book recommendation assistant. Use only the provided candidate books. Return strict JSON with keys answer and recommendedBookIds. answer must be concise and in Russian. recommendedBookIds can contain up to 3 ids from the provided list.'
    },
    {
      role: 'user',
      content: JSON.stringify({
        prompt,
        candidates
      })
    }
  ];
}

function buildSuggestionMessages(prompt) {
  return [
    {
      role: 'system',
      content:
        'Suggest up to 8 real books that best fit the user request. Prioritize mood, theme, style and aftertaste over popularity. Avoid a generic sci-fi list unless the prompt clearly asks for it. Return strict JSON with key suggestions. suggestions must be an array of objects with keys title, originalTitle and author. If the user writes in Russian, prefer a Russian or localized title in title and put the original title into originalTitle when known. author and originalTitle may be empty strings. Return JSON only.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];
}

function requestOpenAi(body, parse, options = {}) {
  if (!env.openaiApiKey) {
    return null;
  }

  return requestJson({
    url: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openaiApiKey}`
    },
    body,
    provider: 'openai',
    parse,
    ...options
  });
}

export async function curateWithOpenAi(prompt) {
  return requestOpenAi(
    {
      model: env.openaiModel,
      temperature: 0.2,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'book_search_curation',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              answer: { type: 'string' },
              filters: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  query: { type: ['string', 'null'] },
                  genres: { type: 'array', items: { type: 'string' } },
                  tags: { type: 'array', items: { type: 'string' } },
                  author: { type: ['string', 'null'] },
                  section: { type: ['string', 'null'] },
                  language: { type: ['string', 'null'] },
                  yearFrom: { type: ['integer', 'null'] },
                  yearTo: { type: ['integer', 'null'] },
                  minRating: { type: ['number', 'null'] },
                  maxRating: { type: ['number', 'null'] },
                  sort: {
                    type: ['string', 'null'],
                    enum: ['rating_desc', 'rating_asc', 'year_desc', 'year_asc', 'newest_desc', 'newest_asc', 'title_asc', 'title_desc', null]
                  }
                },
                required: ['query', 'genres', 'tags', 'author', 'section', 'language', 'yearFrom', 'yearTo', 'minRating', 'maxRating', 'sort']
              },
              suggestions: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    title: { type: 'string' },
                    originalTitle: { type: 'string' },
                    author: { type: 'string' },
                    reason: { type: 'string' }
                  },
                  required: ['title', 'originalTitle', 'author', 'reason']
                }
              }
            },
            required: ['answer', 'filters', 'suggestions']
          }
        }
      },
      messages: buildCurationMessages(prompt)
    },
    (payload) => {
      const text = payload?.choices?.[0]?.message?.content;
      if (!text) {
        return null;
      }

      return normalizeAiSearchCuration(JSON.parse(extractJsonBlock(text)));
    },
    { maxAttempts: 1, timeoutMs: 18000 }
  );
}

export async function interpretWithOpenAi(prompt) {
  return requestOpenAi(
    {
      model: env.openaiModel,
      temperature: 0.1,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'book_search_filters',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              query: { type: ['string', 'null'] },
              genres: {
                type: 'array',
                items: { type: 'string' }
              },
              tags: {
                type: 'array',
                items: { type: 'string' }
              },
              author: { type: ['string', 'null'] },
              section: { type: ['string', 'null'] },
              language: { type: ['string', 'null'] },
              yearFrom: { type: ['integer', 'null'] },
              yearTo: { type: ['integer', 'null'] },
              minRating: { type: ['number', 'null'] },
              maxRating: { type: ['number', 'null'] },
              sort: {
                type: ['string', 'null'],
                enum: ['rating_desc', 'rating_asc', 'year_desc', 'year_asc', 'newest_desc', 'newest_asc', 'title_asc', 'title_desc', null]
              }
            },
            required: ['query', 'genres', 'tags', 'author', 'section', 'language', 'yearFrom', 'yearTo', 'minRating', 'maxRating', 'sort']
          }
        }
      },
      messages: buildInterpretationMessages(prompt)
    },
    (payload) => {
      const text = payload?.choices?.[0]?.message?.content;
      if (!text) {
        return null;
      }

      return normalizeAiFilters(JSON.parse(extractJsonBlock(text)));
    }
  );
}

export async function recommendWithOpenAi(prompt, candidates) {
  if (!candidates.length) {
    return null;
  }

  return requestOpenAi(
    {
      model: env.openaiModel,
      temperature: 0.2,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'book_recommendation',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              answer: { type: 'string' },
              recommendedBookIds: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            required: ['answer', 'recommendedBookIds']
          }
        }
      },
      messages: buildRecommendationMessages(prompt, candidates)
    },
    (payload) => {
      const text = payload?.choices?.[0]?.message?.content;
      if (!text) {
        return null;
      }

      const parsed = JSON.parse(extractJsonBlock(text));
      return {
        answer: typeof parsed.answer === 'string' ? parsed.answer.trim() : '',
        recommendedBookIds: Array.isArray(parsed.recommendedBookIds)
          ? parsed.recommendedBookIds.map((item) => String(item))
          : []
      };
    }
  );
}

export async function suggestWithOpenAi(prompt) {
  return requestOpenAi(
    {
      model: env.openaiModel,
      temperature: 0.35,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'book_suggestions',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              suggestions: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    title: { type: 'string' },
                    originalTitle: { type: 'string' },
                    author: { type: 'string' }
                  },
                  required: ['title', 'originalTitle', 'author']
                }
              }
            },
            required: ['suggestions']
          }
        }
      },
      messages: buildSuggestionMessages(prompt)
    },
    (payload) => {
      const text = payload?.choices?.[0]?.message?.content;
      if (!text) {
        return [];
      }

      const parsed = JSON.parse(extractJsonBlock(text));
      return Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
    }
  );
}
