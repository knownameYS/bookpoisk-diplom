import { env } from '../../../config/env.js';
import { extractJsonBlock, normalizeAiFilters, normalizeAiSearchCuration, requestJson } from './base.js';

function buildCurationMessages(prompt) {
  return [
    {
      role: 'system',
      content:
        'Return JSON only with keys answer, filters, and suggestions. Use this exact shape: {"answer":"","filters":{"query":"","genres":[],"tags":[],"author":"","section":"","origin":"","language":"","yearFrom":null,"yearTo":null,"sort":""},"suggestions":[{"title":"","originalTitle":"","author":"","reason":""}]}. Suggest up to 5 real books that fit the user request. Focus on mood, theme, style, and aftertaste rather than popularity. Never justify books by ratings, popularity, reviews, or what readers usually score highly. Prefer books with known Russian translations when possible. title should use the Russian or localized title when known. reason must be very short, no more than 10 words. filters.origin may be "foreign" or "russian". Allowed sort values: newest_desc, newest_asc, year_desc, year_asc, title_asc, title_desc.'
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
        'Преобразуй запрос о книгах в строгий JSON с ключами query, genres, tags, author, section, language, yearFrom, yearTo, minRating, maxRating, sort. Используй русские названия жанров и тегов из каталога, если они явно следуют из запроса. Допустимые sort: rating_desc, rating_asc, year_desc, year_asc, newest_desc, newest_asc, title_asc, title_desc. Верни только JSON.'
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
        'Ты помощник по подбору книг. Используй только переданные книги-кандидаты. Верни только JSON с ключами answer и recommendedBookIds. answer должен быть на русском, очень кратким, максимум 2 коротких предложения. recommendedBookIds может содержать до 3 id только из переданного списка.'
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
        'Подбери до 8 реальных книг под запрос пользователя. Важнее настроение, тема, стиль и послевкусие, а не популярность. Не уходи в шаблонную фантастику, если запрос не про неё. Верни только JSON вида {"suggestions":[{"title":"","originalTitle":"","author":""}]}. Для русскоязычного запроса title пиши по-русски, originalTitle — в оригинале. Если не уверен, author и originalTitle оставь пустыми.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];
}

function requestGenApi(body, parse, options = {}) {
  if (!env.genApiKey) {
    return null;
  }

  return requestJson({
    url: 'https://proxy.gen-api.ru/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.genApiKey}`
    },
    body,
    provider: 'genapi',
    parse,
    ...options
  });
}

export async function curateWithGenApi(prompt) {
  return requestGenApi(
    {
      model: env.genApiModel,
      temperature: 0.15,
      max_tokens: 420,
      response_format: { type: 'json_object' },
      messages: buildCurationMessages(prompt)
    },
    (payload) => {
      const text = payload?.choices?.[0]?.message?.content;
      if (!text) {
        return null;
      }

      return normalizeAiSearchCuration(JSON.parse(extractJsonBlock(text)));
    },
    { maxAttempts: 1, timeoutMs: 32000 }
  );
}

export async function interpretWithGenApi(prompt) {
  return requestGenApi(
    {
      model: env.genApiModel,
      temperature: 0.1,
      max_tokens: 350,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
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

export async function recommendWithGenApi(prompt, candidates) {
  if (!candidates.length) {
    return null;
  }

  return requestGenApi(
    {
      model: env.genApiModel,
      temperature: 0.15,
      max_tokens: 220,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
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

export async function suggestWithGenApi(prompt) {
  return requestGenApi(
    {
      model: env.genApiModel,
      temperature: 0.25,
      max_tokens: 350,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
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
