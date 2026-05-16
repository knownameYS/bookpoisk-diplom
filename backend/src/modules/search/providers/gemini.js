import { env } from '../../../config/env.js';
import { extractJsonBlock, normalizeAiFilters, normalizeAiSearchCuration, requestJson } from './base.js';

function buildCurationPrompt(prompt) {
  return [
    'Ты помощник по подбору книг.',
    'Верни только JSON с ключами answer, filters и suggestions.',
    'answer: 1-2 коротких предложения на русском без markdown и без перечисления названий книг; просто опиши направление подборки.',
    'filters: объект с ключами query, genres, tags, author, section, language, yearFrom, yearTo, minRating, maxRating, sort.',
    'Допустимые sort: rating_desc, rating_asc, year_desc, year_asc, newest_desc, newest_asc, title_asc, title_desc.',
    'suggestions: до 8 объектов с ключами title, originalTitle, author, reason.',
    'Подбирай реальные книги по настроению, теме, стилю и послевкусию. title пиши по-русски, если известна локализация. reason должен быть очень коротким.',
    `Запрос пользователя: ${prompt}`
  ].join('\n');
}

function buildPrompt(prompt) {
  return [
    'Ты превращаешь естественный запрос о книгах в JSON-фильтры',
    'Верни только JSON с ключами query, genres, tags, author, section, language, yearFrom, yearTo, minRating, maxRating, sort',
    'Допустимые sort: rating_desc, rating_asc, year_desc, year_asc, newest_desc, newest_asc, title_asc, title_desc',
    'Используй русские жанры и теги из базы: Фэнтези, Философия, Антиутопия, Классика, Детективы, Мистика и ужасы, Современная проза, Любовь, мрачная, атмосферная, философская, миростроение, медленное развитие, экзистенциальная, сатирическая',
    'Если запрос явно похож на раздел каталога, используй section со значением fantastika, detektivy, mistika-i-uzhasy, sovremennaya-proza, lyubov или klassika',
    'Не выдумывай книги, авторов и значения. Если данных нет, используй null или пустой массив',
    `Запрос: ${prompt}`
  ].join('\n');
}

function buildRecommendationPrompt(prompt, candidates) {
  return [
    'Ты помощник по выбору книги',
    'У тебя есть запрос пользователя и список книг-кандидатов из базы данных',
    'Рекомендуй только книги из переданного списка',
    'Верни только JSON с ключами answer и recommendedBookIds',
    'answer должен быть коротким полезным объяснением на русском языке',
    'recommendedBookIds должен содержать до 3 id только из списка кандидатов',
    `Запрос пользователя: ${prompt}`,
    `Кандидаты: ${JSON.stringify(candidates)}`
  ].join('\n');
}

function buildSuggestionPrompt(prompt) {
  return [
    'Ты помощник по подбору книг',
    'Подбери до 8 конкретных книг, которые лучше всего соответствуют запросу пользователя',
    'Ставь на первое место настроение, тему, стиль и послевкусие, а не популярность',
    'Не превращай ответ в шаблонный список известной фантастики, если запрос не про неё',
    'Верни только JSON с ключом suggestions',
    'suggestions должен быть массивом объектов с ключами title, originalTitle и author',
    'Если запрос на русском, в title используй русское или локализованное название, а в originalTitle оригинальное, если оно известно',
    'author и originalTitle можно оставить пустой строкой, если не уверен',
    'Не добавляй markdown, комментарии и лишний текст',
    `Запрос пользователя: ${prompt}`
  ].join('\n');
}

function requestGemini(body, parse) {
  if (!env.geminiApiKey) {
    return null;
  }

  return requestJson({
    url: `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent`,
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': env.geminiApiKey
    },
    body,
    provider: 'gemini',
    parse
  });
}

export async function curateWithGemini(prompt) {
  return requestJson({
    url: `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent`,
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': env.geminiApiKey
    },
    body: {
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      },
      contents: [
        {
          parts: [{ text: buildCurationPrompt(prompt) }]
        }
      ]
    },
    provider: 'gemini',
    maxAttempts: 1,
    timeoutMs: 18000,
    parse: (payload) => {
      const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return null;
      }

      return normalizeAiSearchCuration(JSON.parse(extractJsonBlock(text)));
    }
  });
}

export async function interpretWithGemini(prompt) {
  return requestGemini(
    {
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      },
      contents: [
        {
          parts: [{ text: buildPrompt(prompt) }]
        }
      ]
    },
    (payload) => {
      const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return null;
      }

      return normalizeAiFilters(JSON.parse(extractJsonBlock(text)));
    }
  );
}

export async function recommendWithGemini(prompt, candidates) {
  if (!candidates.length) {
    return null;
  }

  return requestGemini(
    {
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      },
      contents: [
        {
          parts: [{ text: buildRecommendationPrompt(prompt, candidates) }]
        }
      ]
    },
    (payload) => {
      const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
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

export async function suggestWithGemini(prompt) {
  return requestGemini(
    {
      generationConfig: {
        temperature: 0.35,
        responseMimeType: 'application/json'
      },
      contents: [
        {
          parts: [{ text: buildSuggestionPrompt(prompt) }]
        }
      ]
    },
    (payload) => {
      const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return [];
      }

      const parsed = JSON.parse(extractJsonBlock(text));
      return Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
    }
  );
}
