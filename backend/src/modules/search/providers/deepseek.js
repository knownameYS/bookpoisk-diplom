import { env } from '../../../config/env.js';
import { extractJsonBlock, normalizeAiFilters, normalizeAiSearchCuration, requestJson } from './base.js';

function buildCurationMessages(prompt) {
  return [
    {
      role: 'system',
      content:
        'Ты помощник по подбору книг. Верни только JSON с ключами answer, filters и suggestions. answer должен быть коротким русским текстом без markdown и без перечисления названий книг. filters должен содержать query, genres, tags, author, section, language, yearFrom, yearTo, minRating, maxRating, sort. Допустимые sort: rating_desc, rating_asc, year_desc, year_asc, newest_desc, newest_asc, title_asc, title_desc. suggestions должен быть массивом до 8 объектов с ключами title, originalTitle, author, reason. Подбирай реальные книги по настроению, теме, стилю и послевкусию. reason должен быть коротким.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];
}

function buildMessages(prompt) {
  return [
    {
      role: 'system',
      content:
        'Преобразуй естественный запрос о книгах в строгий JSON с ключами query, genres, tags, author, language, yearFrom, yearTo, minRating, maxRating, sort. Используй русские значения жанров и тегов из базы: Фэнтези, Философия, Антиутопия, Классика, мрачная, философская, миростроение, медленное развитие, экзистенциальная, сатирическая. Допустимые sort: rating_desc, rating_asc, year_desc, year_asc, newest_desc, newest_asc, title_asc, title_desc. Отвечай только JSON.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];
}

export async function interpretWithDeepSeek(prompt) {
  if (!env.deepseekApiKey) {
    return null;
  }

  return requestJson({
    url: 'https://api.deepseek.com/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.deepseekApiKey}`
    },
    body: {
      model: env.deepseekModel,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: buildMessages(prompt)
    },
    parse: (payload) => {
      const text = payload?.choices?.[0]?.message?.content;
      if (!text) {
        return null;
      }

      return normalizeAiFilters(JSON.parse(extractJsonBlock(text)));
    }
  });
}

export async function curateWithDeepSeek(prompt) {
  if (!env.deepseekApiKey) {
    return null;
  }

  return requestJson({
    url: 'https://api.deepseek.com/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.deepseekApiKey}`
    },
    body: {
      model: env.deepseekModel,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: buildCurationMessages(prompt)
    },
    provider: 'deepseek',
    maxAttempts: 1,
    timeoutMs: 18000,
    parse: (payload) => {
      const text = payload?.choices?.[0]?.message?.content;
      if (!text) {
        return null;
      }

      return normalizeAiSearchCuration(JSON.parse(extractJsonBlock(text)));
    }
  });
}

function buildRecommendationMessages(prompt, candidates) {
  return [
    {
      role: 'system',
      content:
        'Ты помощник по выбору книги. Используй только переданные книги-кандидаты. Ответь только JSON вида {"answer":"...","recommendedBookIds":["..."]}. answer должен быть на русском, а recommendedBookIds может содержать до 3 id только из списка кандидатов.'
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
        'Ты помощник по подбору книг. Подбери до 8 конкретных книг под запрос пользователя. Ставь на первое место настроение, тему, стиль и послевкусие, а не популярность. Не превращай ответ в шаблонный список известной фантастики, если запрос не про неё. Верни только JSON с ключом suggestions. suggestions должен быть массивом объектов с ключами title, originalTitle и author. Если запрос на русском, в title используй русское или локализованное название, а в originalTitle оригинальное, если оно известно. author и originalTitle могут быть пустыми строками. Не добавляй markdown и лишний текст.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];
}

export async function recommendWithDeepSeek(prompt, candidates) {
  if (!env.deepseekApiKey || !candidates.length) {
    return null;
  }

  return requestJson({
    url: 'https://api.deepseek.com/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.deepseekApiKey}`
    },
    body: {
      model: env.deepseekModel,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: buildRecommendationMessages(prompt, candidates)
    },
    parse: (payload) => {
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
  });
}

export async function suggestWithDeepSeek(prompt) {
  if (!env.deepseekApiKey) {
    return [];
  }

  return requestJson({
    url: 'https://api.deepseek.com/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.deepseekApiKey}`
    },
    body: {
      model: env.deepseekModel,
      temperature: 0.35,
      response_format: { type: 'json_object' },
      messages: buildSuggestionMessages(prompt)
    },
    parse: (payload) => {
      const text = payload?.choices?.[0]?.message?.content;
      if (!text) {
        return [];
      }

      const parsed = JSON.parse(extractJsonBlock(text));
      return Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
    }
  });
}
