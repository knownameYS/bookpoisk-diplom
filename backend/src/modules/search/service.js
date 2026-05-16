import { env } from '../../config/env.js';
import { listBooks, scoreBookTextMatch } from '../books/service.js';
import { normalizedSearchSchema } from './schemas.js';
import { curateAiSearch } from './providers/index.js';

const STOP_WORDS = new Set([
  'а',
  'без',
  'более',
  'бы',
  'быть',
  'в',
  'во',
  'вот',
  'все',
  'всё',
  'где',
  'для',
  'до',
  'же',
  'и',
  'из',
  'или',
  'их',
  'как',
  'какая',
  'какие',
  'какой',
  'книгу',
  'книга',
  'книги',
  'книгой',
  'ко',
  'которой',
  'которую',
  'ли',
  'мне',
  'можно',
  'на',
  'надо',
  'не',
  'нет',
  'но',
  'ну',
  'о',
  'об',
  'от',
  'по',
  'под',
  'после',
  'при',
  'про',
  'самую',
  'самый',
  'с',
  'со',
  'так',
  'такую',
  'такой',
  'то',
  'только',
  'у',
  'уже',
  'что-то',
  'что-нибудь',
  'чтонибудь',
  'какое-то',
  'какой-то',
  'какую-то',
  'какое-нибудь',
  'какой-нибудь',
  'какую-нибудь',
  'хочу',
  'чтобы',
  'что',
  'это'
]);

const dimensionPatterns = {
  architecture: /(динам|сюжет|темп|плотн|захватыв|напряж|детектив|остросюжет|page turner)/,
  characters: /(персонаж|геро|характер|отношени|любовн|семейн)/,
  language: /(язык|стиль|слог|написан|литератур|красиво|поэтич|проза)/,
  idea: /(иде[яие]|смысл|философ|мысл|послевкус|антиутоп|экзистенц|сильной идеей)/,
  vibe: /(атмосфер|уют|мрач|светл|тревож|груст|меланхол|тишин|магич|жутк|страшн|тепл)/,
  recent: /(нов(ая|ые|инка)?|свеж|recent|latest|современн)/,
  classic: /(классик|classic)/
};

const aiSuggestedCatalogPageSize = 400;
const aiSuggestedBookLimit = 8;
const aiSuggestedBookMinScore = 1800;
const aiSearchDefaultLimit = 8;
const aiSearchCacheVersion = '2026-05-14-ai-origin-v3';
const aiSuggestedCatalogCacheTtlMs = 1000 * 60 * 5;
const aiSearchResultCacheTtlMs = 1000 * 60 * 5;
let aiSuggestedCatalogCache = {
  expiresAt: 0,
  items: null
};
const aiSearchResultCache = new Map();
const RU_STOP_WORDS = new Set([
  'а',
  'без',
  'более',
  'бы',
  'быть',
  'в',
  'во',
  'вот',
  'все',
  'всё',
  'где',
  'для',
  'до',
  'же',
  'и',
  'из',
  'или',
  'их',
  'как',
  'какая',
  'какие',
  'какой',
  'книга',
  'книги',
  'книгу',
  'книгой',
  'ко',
  'ли',
  'мне',
  'можно',
  'на',
  'надо',
  'не',
  'нет',
  'но',
  'ну',
  'о',
  'об',
  'от',
  'по',
  'под',
  'после',
  'при',
  'про',
  'с',
  'со',
  'так',
  'то',
  'только',
  'у',
  'уже',
  'что-то',
  'что-нибудь',
  'чтонибудь',
  'какое-то',
  'какой-то',
  'какую-то',
  'какое-нибудь',
  'какой-нибудь',
  'какую-нибудь',
  'хочу',
  'чтобы',
  'что',
  'это'
]);
const RU_DIMENSION_PATTERNS = {
  architecture: /(динам|сюжет|темп|плотн|захватыв|напряж|детектив|остросюжет|page turner)/i,
  characters: /(персонаж|геро|характер|отношени|любовн|семейн)/i,
  language: /(язык|стиль|слог|написан|литератур|красив|поэтич|проза)/i,
  idea: /(иде[яие]|смысл|философ|мысл|послевкус|антиутоп|экзистенц)/i,
  vibe: /(атмосфер|уют|мрач|светл|тревож|груст|меланхол|тишин|магич|жутк|страшн|тепл)/i,
  recent: /(нов(ая|ые|инка)?|свеж|recent|latest|современн)/i,
  classic: /(классик|classic)/i
};

const foreignPromptPattern = /(зарубеж|иностран|foreign|western)/i;
const russianPromptPattern = /(русск|российск|отечествен)/i;
const russianAuthorSuffixes = ['ov', 'ev', 'in', 'yn', 'sky', 'skiy', 'tsky', 'tskiy', 'enko', 'ich', 'ko', 'ova', 'eva', 'ina', 'yna'];
const foreignOriginPattern = /(\u0437\u0430\u0440\u0443\u0431\u0435\u0436|\u0438\u043d\u043e\u0441\u0442\u0440\u0430\u043d|foreign|western)/i;
const russianOriginPattern =
  /(\u0440\u0443\u0441\u0441\u043a\u0430\u044f\s+\u043a\u043b\u0430\u0441\u0441\u0438\u043a\u0430|\u0440\u0443\u0441\u0441\u043a\u0438\u0435\s+\u043f\u0438\u0441\u0430\u0442\u0435\u043b\u0438|\u043e\u0442\u0435\u0447\u0435\u0441\u0442\u0432\u0435\u043d|\u0441\u043e\u0432\u0435\u0442\u0441\u043a\u0430\u044f\s+\u043b\u0438\u0442\u0435\u0440\u0430\u0442\u0443\u0440\u0430)/i;
const russianAuthorFirstNames = new Set([
  'aleksandr',
  'alexandr',
  'alexander',
  'aleksei',
  'aleksey',
  'alexey',
  'andrei',
  'andrey',
  'anna',
  'anton',
  'boris',
  'dmitriy',
  'dmitry',
  'evgeniy',
  'evgeny',
  'fedor',
  'fyodor',
  'georgiy',
  'georgy',
  'igor',
  'ilia',
  'ilya',
  'ivan',
  'konstantin',
  'leo',
  'lev',
  'maksim',
  'maxim',
  'maria',
  'mariya',
  'marina',
  'mihail',
  'mikhail',
  'nikita',
  'nikolai',
  'nikolay',
  'olga',
  'pavel',
  'sergei',
  'sergey',
  'sofia',
  'sophia',
  'tatiana',
  'tatyana',
  'vasilii',
  'vasiliy',
  'vasily',
  'vera',
  'viktor',
  'vladimir',
  'yulia',
  'yuliya',
  'yuri',
  'yuriy'
]);
const knownRussianAuthorFragments = [
  'akhmatov',
  'akhmatova',
  'astafyev',
  'bely',
  'beliy',
  'blok',
  'bulgakov',
  'bunin',
  'chehov',
  'chekhov',
  'chernyshevsk',
  'derzhavin',
  'dostoevsk',
  'esenin',
  'fet',
  'fonvizin',
  'garshin',
  'gogol',
  'goncharov',
  'gork',
  'griboedov',
  'herzen',
  'kuprin',
  'krylov',
  'leskov',
  'lermontov',
  'lotman',
  'mayakovsk',
  'nabokov',
  'nekrasov',
  'ostrovsk',
  'paustovsk',
  'pasternak',
  'prishvin',
  'pushkin',
  'radishchev',
  'saltykov',
  'sholokhov',
  'sholohov',
  'solzhenitsyn',
  'tolst',
  'turgenev',
  'tsvetaev',
  'tsvetaeva',
  'tyutchev',
  'tjutchev',
  'zoshchenko'
];

function normalizeSearchFilters(filters) {
  return normalizedSearchSchema.parse({
    genres: [],
    tags: [],
    ...filters
  });
}

export { normalizeSearchFilters };

export async function runSearch(filters) {
  const normalized = normalizeSearchFilters(filters);

  return listBooks(normalized);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function extractNumber(prompt, patterns) {
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match) {
      return Number(match[1]);
    }
  }

  return undefined;
}

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizePrompt(prompt) {
  const rawTokens = normalizeText(prompt)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !RU_STOP_WORDS.has(token) && !STOP_WORDS.has(token));

  return unique(
    rawTokens.flatMap((token) => {
      const variants = [token];

      if (/[аеёиоуыэюя]$/u.test(token) && token.length >= 4) {
        variants.push(token.slice(0, -1));
      }

      if (token.length >= 7) {
        variants.push(token.slice(0, token.length - 2));
      }

      if (token.length >= 9) {
        variants.push(token.slice(0, 6));
      }

      return variants.filter((item) => item.length >= 4);
    })
  );
}

function scoreTextMatches(text, tokens, weight) {
  if (!text || !tokens.length) {
    return 0;
  }

  let score = 0;

  for (const token of tokens) {
    if (text.includes(token)) {
      score += weight;
    }
  }

  return score;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function detectPromptOrigin(input) {
  if (foreignPromptPattern.test(input)) {
    return 'foreign';
  }

  if (russianPromptPattern.test(input)) {
    return 'russian';
  }

  return undefined;
}

function isLikelyRussianAuthorName(fullName) {
  const tokens = transliterateToLatin(normalizeText(fullName))
    .toLowerCase()
    .replace(/[^a-z\s-]+/g, ' ')
    .split(/[\s-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  if (!tokens.length) {
    return false;
  }

  const joinedName = tokens.join(' ');
  const firstName = tokens[0] ?? '';
  const surname = tokens.at(-1) ?? '';

  if (
    tokens.some(
      (token) =>
        token.endsWith('ovich') ||
        token.endsWith('evich') ||
        token.endsWith('ichna') ||
        token.endsWith('ovna')
    )
  ) {
    return true;
  }

  if (knownRussianAuthorFragments.some((fragment) => joinedName.includes(fragment))) {
    return true;
  }

  return russianAuthorFirstNames.has(firstName) && russianAuthorSuffixes.some((suffix) => surname.endsWith(suffix));
}

function inferBookOrigin(book) {
  const combinedText = normalizeText(
    [
      book.title,
      book.originalTitle,
      book.catalogSection,
      book.catalogSectionSlug,
      book.description,
      ...(book.authors ?? []).map((author) => author.fullName),
      ...(book.genres ?? []).map((genre) => genre.name)
    ]
      .filter(Boolean)
      .join(' ')
  );

  if (/(зарубежн|иностран)/u.test(combinedText)) {
    return 'foreign';
  }

  if (/(русская классика|русские писатели|отечествен)/u.test(combinedText)) {
    return 'russian';
  }

  const normalizedOriginalTitle = normalizeText(book.originalTitle);
  const normalizedTitle = normalizeText(book.title);

  if (normalizedOriginalTitle && normalizedOriginalTitle !== normalizedTitle) {
    return 'foreign';
  }

  const authors = book.authors ?? [];

  if (!authors.length) {
    return 'unknown';
  }

  if (authors.some((author) => isLikelyRussianAuthorName(author.fullName))) {
    return 'russian';
  }

  return 'foreign';
}

function isLikelyForeignAuthorName(fullName) {
  const tokens = transliterateToLatin(normalizeText(fullName))
    .toLowerCase()
    .replace(/[^a-z\s-]+/g, ' ')
    .split(/[\s-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  if (!tokens.length || isLikelyRussianAuthorName(fullName)) {
    return false;
  }

  const firstName = tokens[0] ?? '';
  const surname = tokens.at(-1) ?? '';
  const firstNameLooksRussian = russianAuthorFirstNames.has(firstName);
  const surnameLooksRussian =
    knownRussianAuthorFragments.some((fragment) => surname.includes(fragment)) ||
    russianAuthorSuffixes.some((suffix) => surname.endsWith(suffix));

  return Boolean(surname) && (!firstNameLooksRussian || !surnameLooksRussian);
}

export function inferBookOriginStable(book) {
  const genreText = normalizeText((book.genres ?? []).map((genre) => genre.name).join(' '));
  const sectionText = normalizeText([book.catalogSection, book.catalogSectionSlug].filter(Boolean).join(' '));
  const titleText = normalizeText([book.title, book.originalTitle].filter(Boolean).join(' '));
  const descriptionText = normalizeText(book.description);
  const normalizedOriginalTitle = normalizeText(book.originalTitle);
  const normalizedTitle = normalizeText(book.title);
  let foreignScore = 0;
  let russianScore = 0;

  if (foreignOriginPattern.test(genreText)) {
    foreignScore += 3;
  }

  if (foreignOriginPattern.test(sectionText)) {
    foreignScore += 2;
  }

  if (foreignOriginPattern.test(titleText) || foreignOriginPattern.test(descriptionText)) {
    foreignScore += 2;
  }

  if (russianOriginPattern.test(genreText)) {
    russianScore += 3;
  }

  if (russianOriginPattern.test(sectionText)) {
    russianScore += 2;
  }

  if (russianOriginPattern.test(titleText) || russianOriginPattern.test(descriptionText)) {
    russianScore += 2;
  }

  if (normalizedOriginalTitle && normalizedOriginalTitle !== normalizedTitle) {
    foreignScore += 3;
  }

  const authors = book.authors ?? [];

  for (const author of authors) {
    if (isLikelyRussianAuthorName(author.fullName)) {
      russianScore += 4;
      continue;
    }

    if (isLikelyForeignAuthorName(author.fullName)) {
      foreignScore += 4;
    }
  }

  if (foreignScore >= russianScore + 2) {
    return 'foreign';
  }

  if (russianScore >= foreignScore + 2) {
    return 'russian';
  }

  return 'unknown';
}

export function heuristicInterpretSearchPrompt(prompt) {
  const input = prompt.toLowerCase();
  const genres = [];
  const tags = [];
  const origin = detectPromptOrigin(input);

  if (/(философ|philosoph)/.test(input)) genres.push('Философия');
  if (/(фэнтез|fantasy|магическ)/.test(input)) genres.push('Фэнтези');
  if (/(антиутоп|dystopi|постапок|апокалип)/.test(input)) genres.push('Антиутопия');
  if (/(классик|classic)/.test(input)) genres.push('Классика');
  if (/(детектив|detective|триллер)/.test(input)) genres.push('Детективы');
  if (/(мистик|ужас|horror)/.test(input)) genres.push('Мистика и ужасы');
  if (/(современн.*проз|modern prose|проза)/.test(input)) genres.push('Современная проза');
  if (/(любов|romance|романтич)/.test(input)) genres.push('Любовь');

  if (/(мрач|темн|dark|gloom)/.test(input)) tags.push('мрачная');
  if (/(философ|иде[яи]|philosoph)/.test(input)) tags.push('философская');
  if (/(миростро|worldbuild)/.test(input)) tags.push('миростроение');
  if (/(slow burn|медлен)/.test(input)) tags.push('медленное развитие');
  if (/(экзистенц|existential)/.test(input)) tags.push('экзистенциальная');
  if (/(сатир|satir)/.test(input)) tags.push('сатирическая');
  if (/(атмосфер|уют|тишин)/.test(input)) tags.push('атмосферная');

  const yearRange = input.match(/(?:с|from)\s*(\d{4})\s*(?:по|to|-)\s*(\d{4})/);
  const yearFrom =
    (yearRange ? Number(yearRange[1]) : undefined) ??
    extractNumber(input, [/(?:после|after)\s*(\d{4})/, /(?:от|from)\s*(\d{4})\s*г/]);
  const yearTo =
    (yearRange ? Number(yearRange[2]) : undefined) ??
    extractNumber(input, [/(?:до|before)\s*(\d{4})/, /(?:к|until)\s*(\d{4})/]);

  let language;
  if (/(на русском|русск|russian)/.test(input)) language = 'ru';
  if (/(на английском|англ|english)/.test(input)) language = 'en';

  let sort = 'newest_desc';

  if (/(по добавлению|oldest added|давно добав|старые добавления)/.test(input)) {
    sort = 'newest_asc';
  } else if (/(новинк|recently added|latest added|свежее добавл)/.test(input)) {
    sort = 'newest_desc';
  }

  if (/(по названию|алфавит|alphabet|title)/.test(input)) {
    sort = /(обратн.*алфав|я\s*(?:до|-)\s*а|reverse alphabet|title desc|z to a)/.test(input) ? 'title_desc' : 'title_asc';
  }

  if (/(по году|год|издани|year)/.test(input)) {
    sort = /(стар(?:ые|ым|ого)|ранн(?:ие|ее|яя)|oldest|earliest|ascending)/.test(input) ? 'year_asc' : 'year_desc';
  }

  if (/(нов(ее|ые|ая)|recent|latest|свеж)/.test(input) && !/(по добавлению|добавл)/.test(input)) {
    sort = 'year_desc';
  }

  const queryTokens = tokenizePrompt(prompt).filter((token) => !/^\d+$/.test(token));
  const query = queryTokens.length ? queryTokens.join(' ') : undefined;

  return {
    query,
    origin,
    genres: unique(genres),
    tags: unique(tags),
    language,
    yearFrom,
    yearTo,
    sort
  };
}

export function buildPromptProfile(prompt, filters = {}) {
  const input = normalizeText(prompt);
  const tokens = tokenizePrompt(prompt);
  const inferredTags = [];
  const inferredSections = [];
  const dimensionWeights = {
    architecture: dimensionPatterns.architecture.test(input) ? 1 : 0,
    characters: dimensionPatterns.characters.test(input) ? 1 : 0,
    language: dimensionPatterns.language.test(input) ? 1 : 0,
    idea: dimensionPatterns.idea.test(input) ? 1 : 0,
    vibe: dimensionPatterns.vibe.test(input) ? 1 : 0
  };

  if (!Object.values(dimensionWeights).some(Boolean)) {
    dimensionWeights.vibe = 1;
    dimensionWeights.idea = 1;
  }

  if (/(атмосфер|уют|тишин|послевкус|меланхол)/.test(input)) inferredTags.push('атмосферная');
  if (/(философ|иде[яи]|смысл|мысл|послевкус|экзистенц)/.test(input)) inferredTags.push('философская');
  if (/(мрач|темн|ужас|жутк|страш)/.test(input)) inferredTags.push('мрачная');
  if (/(мир|вселен|импер|сага|маг|королев)/.test(input)) inferredTags.push('миростроение');
  if (/(медлен|нетороп|slow burn)/.test(input)) inferredTags.push('медленное развитие');

  if (/(фэнтез|маг|сага|дракон|королев)/.test(input)) inferredSections.push('fantastika');
  if (/(детектив|расслед|тайн|убийств|триллер)/.test(input)) inferredSections.push('detektivy');
  if (/(мистик|ужас|страш|жутк|темн)/.test(input)) inferredSections.push('mistika-i-uzhasy');
  if (/(современн|психолог|иде[яи]|послевкус|проза)/.test(input)) inferredSections.push('sovremennaya-proza');
  if (/(любов|романтич|отношени|чувств)/.test(input)) inferredSections.push('lyubov');
  if (/(классик|русск.*класс|зарубежн.*класс)/.test(input)) inferredSections.push('klassika');

  if (!inferredSections.length && !tokens.length && dimensionWeights.vibe && dimensionWeights.idea) {
    inferredSections.push('sovremennaya-proza', 'mistika-i-uzhasy', 'fantastika');
  }

  return {
    input,
    tokens,
    wantsRecent: dimensionPatterns.recent.test(input),
    wantsClassic: dimensionPatterns.classic.test(input),
    dimensionWeights,
    inferredTags: unique(inferredTags),
    inferredSections: unique(inferredSections),
    explicitGenres: filters.genres ?? [],
    explicitTags: filters.tags ?? []
  };
}

function heuristicInterpretSearchPromptStable(prompt) {
  const input = String(prompt ?? '').toLowerCase();
  const genres = [];
  const tags = [];
  const origin = detectPromptOrigin(input);

  if (/(философ|philosoph)/i.test(input)) genres.push('Философия');
  if (/(фэнтез|fantasy|магическ)/i.test(input)) genres.push('Фэнтези');
  if (/(антиутоп|dystopi|постапок|апокалип)/i.test(input)) genres.push('Антиутопия');
  if (/(классик|classic)/i.test(input)) genres.push('Классика');
  if (/(детектив|detective|триллер)/i.test(input)) genres.push('Детективы');
  if (/(мистик|ужас|horror)/i.test(input)) genres.push('Мистика и ужасы');
  if (/(современн.*проз|modern prose|проза)/i.test(input)) genres.push('Современная проза');
  if (/(любов|romance|романтич)/i.test(input)) genres.push('Любовь');

  if (/(мрач|темн|dark|gloom|тревож|жутк|страш)/i.test(input)) tags.push('мрачная');
  if (/(философ|иде[яие]|philosoph|смысл|мысл)/i.test(input)) tags.push('философская');
  if (/(миростро|worldbuild|вселен|королев|сага)/i.test(input)) tags.push('миростроение');
  if (/(slow burn|медлен)/i.test(input)) tags.push('медленное развитие');
  if (/(экзистенц|existential)/i.test(input)) tags.push('экзистенциальная');
  if (/(сатир|satir)/i.test(input)) tags.push('сатирическая');
  if (/(атмосфер|уют|тишин|меланхол)/i.test(input)) tags.push('атмосферная');

  const yearRange = input.match(/(?:с|from)\s*(\d{4})\s*(?:по|to|-)\s*(\d{4})/i);
  const yearFrom =
    (yearRange ? Number(yearRange[1]) : undefined) ??
    extractNumber(input, [/(?:после|after)\s*(\d{4})/i, /(?:от|from)\s*(\d{4})\s*г/i]);
  const yearTo =
    (yearRange ? Number(yearRange[2]) : undefined) ??
    extractNumber(input, [/(?:до|before)\s*(\d{4})/i, /(?:к|until)\s*(\d{4})/i]);

  let language;
  if (/(на русском|русск|russian)/i.test(input)) language = 'ru';
  if (/(на английском|англ|english)/i.test(input)) language = 'en';

  let sort = 'newest_desc';

  if (/(по добавлению|oldest added|давно добав|старые добавления)/i.test(input)) {
    sort = 'newest_asc';
  } else if (/(новинк|recently added|latest added|свежее добавл)/i.test(input)) {
    sort = 'newest_desc';
  }

  if (/(по названию|алфавит|alphabet|title)/i.test(input)) {
    sort = /(обратн.*алфав|я\s*(?:до|-)\s*а|reverse alphabet|title desc|z to a)/i.test(input) ? 'title_desc' : 'title_asc';
  }

  if (/(по году|год|издани|year)/i.test(input)) {
    sort = /(стар(?:ые|ым|ого)|ранн(?:ие|ее|яя)|oldest|earliest|ascending)/i.test(input) ? 'year_asc' : 'year_desc';
  }

  if (/(нов(ее|ые|ая)|recent|latest|свеж)/i.test(input) && !/(по добавлению|добавл)/i.test(input)) {
    sort = 'year_desc';
  }

  const queryTokens = tokenizePrompt(prompt).filter((token) => !/^\d+$/.test(token));
  const query = queryTokens.length ? queryTokens.join(' ') : undefined;

  return {
    query,
    origin,
    genres: unique(genres),
    tags: unique(tags),
    language,
    yearFrom,
    yearTo,
    sort
  };
}

function buildPromptProfileStable(prompt, filters = {}) {
  const input = normalizeText(prompt);
  const tokens = tokenizePrompt(prompt);
  const inferredTags = [];
  const inferredSections = [];
  const dimensionWeights = {
    architecture: RU_DIMENSION_PATTERNS.architecture.test(input) ? 1 : 0,
    characters: RU_DIMENSION_PATTERNS.characters.test(input) ? 1 : 0,
    language: RU_DIMENSION_PATTERNS.language.test(input) ? 1 : 0,
    idea: RU_DIMENSION_PATTERNS.idea.test(input) ? 1 : 0,
    vibe: RU_DIMENSION_PATTERNS.vibe.test(input) ? 1 : 0
  };

  if (!Object.values(dimensionWeights).some(Boolean)) {
    dimensionWeights.vibe = 1;
    dimensionWeights.idea = 1;
  }

  if (/(атмосфер|уют|тишин|послевкус|меланхол)/i.test(input)) inferredTags.push('атмосферная');
  if (/(философ|иде[яие]|смысл|мысл|послевкус|экзистенц)/i.test(input)) inferredTags.push('философская');
  if (/(мрач|темн|ужас|жутк|страш|тревож)/i.test(input)) inferredTags.push('мрачная');
  if (/(мир|вселен|импер|сага|маг|королев)/i.test(input)) inferredTags.push('миростроение');
  if (/(медлен|нетороп|slow burn)/i.test(input)) inferredTags.push('медленное развитие');

  if (/(фэнтез|маг|сага|дракон|королев)/i.test(input)) inferredSections.push('fantastika');
  if (/(детектив|расслед|тайн|убийств|триллер)/i.test(input)) inferredSections.push('detektivy');
  if (/(мистик|ужас|страш|жутк|темн|тревож)/i.test(input)) inferredSections.push('mistika-i-uzhasy');
  if (/(современн|психолог|иде[яие]|послевкус|проза)/i.test(input)) inferredSections.push('sovremennaya-proza');
  if (/(любов|романтич|отношени|чувств)/i.test(input)) inferredSections.push('lyubov');
  if (/(классик|русск.*класс|зарубежн.*класс)/i.test(input)) inferredSections.push('klassika');

  if (!inferredSections.length && !tokens.length && dimensionWeights.vibe && dimensionWeights.idea) {
    inferredSections.push('sovremennaya-proza', 'mistika-i-uzhasy', 'fantastika');
  }

  return {
    input,
    tokens,
    wantsRecent: RU_DIMENSION_PATTERNS.recent.test(input),
    wantsClassic: RU_DIMENSION_PATTERNS.classic.test(input),
    dimensionWeights,
    inferredTags: unique(inferredTags),
    inferredSections: unique(inferredSections),
    explicitGenres: filters.genres ?? [],
    explicitTags: filters.tags ?? []
  };
}

const transliterationMap = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya'
};

function transliterateToLatin(value) {
  return String(value ?? '')
    .split('')
    .map((char) => {
      const lower = char.toLowerCase();
      const mapped = transliterationMap[lower];

      if (!mapped) {
        return char;
      }

      return char === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
    })
    .join('');
}

function buildAiProviderPrompt(prompt, filters, promptProfile) {
  const tagMap = {
    атмосферная: 'atmospheric',
    философская: 'philosophical',
    мрачная: 'dark',
    миростроение: 'strong worldbuilding',
    'медленное развитие': 'slow burn',
    экзистенциальная: 'existential',
    сатирическая: 'satirical'
  };
  const sectionMap = {
    fantastika: 'fantasy or speculative fiction',
    detektivy: 'detective, crime, or thriller',
    'mistika-i-uzhasy': 'mystery, gothic, horror, or unsettling fiction',
    'sovremennaya-proza': 'contemporary literary fiction',
    lyubov: 'romance',
    klassika: 'classic literature'
  };
  const focus = [];

  if (promptProfile.dimensionWeights.architecture) focus.push('strong plot and structure');
  if (promptProfile.dimensionWeights.characters) focus.push('strong characters and relationships');
  if (promptProfile.dimensionWeights.language) focus.push('beautiful prose');
  if (promptProfile.dimensionWeights.idea) focus.push('strong ideas or philosophical depth');
  if (promptProfile.dimensionWeights.vibe) focus.push('memorable atmosphere');

  return [
    'Recommend real books for this reader.',
    `Original request transliterated from Russian: ${transliterateToLatin(prompt)}`,
    focus.length ? `Main qualities: ${focus.join(', ')}` : null,
    promptProfile.inferredTags?.length
      ? `Mood tags: ${promptProfile.inferredTags.map((tag) => tagMap[tag] ?? tag).join(', ')}`
      : null,
    promptProfile.inferredSections?.length
      ? `Preferred sections: ${promptProfile.inferredSections.map((section) => sectionMap[section] ?? section).join(', ')}`
      : null,
    filters.genres?.length ? `Genres to consider: ${filters.genres.join(', ')}` : null,
    filters.tags?.length ? `Catalog tags to consider: ${filters.tags.map((tag) => tagMap[tag] ?? tag).join(', ')}` : null,
    filters.author ? `Preferred author: ${transliterateToLatin(filters.author)}` : null,
    filters.origin === 'foreign' ? 'Literary origin: foreign literature only.' : null,
    filters.origin === 'russian' ? 'Literary origin: Russian literature only.' : null,
    filters.language ? `Preferred language: ${filters.language}` : null,
    filters.yearFrom ? `Publication year from: ${filters.yearFrom}` : null,
    filters.yearTo ? `Publication year to: ${filters.yearTo}` : null,
    promptProfile.wantsRecent ? 'The reader prefers recent books.' : null,
    promptProfile.wantsClassic ? 'The reader is open to classics.' : null,
    'Focus on mood, theme, style, and aftertaste rather than popularity. Prefer books with known Russian editions when possible.'
  ]
    .filter(Boolean)
    .join('\n');
}

function buildCandidateSummary(book) {
  return {
    id: book.id,
    title: book.title,
    description: book.description,
    authors: (book.authors ?? []).map((author) => author.fullName),
    genres: (book.genres ?? []).map((genre) => genre.name),
    tags: (book.tags ?? []).map((tag) => tag.name),
    catalogSection: book.catalogSection,
    series: book.series,
    publisher: book.publisher,
    editor: book.editor,
    ageRestriction: book.ageRestriction,
    language: book.language,
    publicationYear: book.publicationYear
  };
}

function sanitizeSuggestedBookText(value) {
  return String(value ?? '')
    .replace(/[«»"“”„`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeAiBookSuggestions(suggestions) {
  if (!Array.isArray(suggestions)) {
    return [];
  }

  const uniqueSuggestions = new Map();

  for (const suggestion of suggestions) {
    let normalized = null;

    if (typeof suggestion === 'string') {
      normalized = {
        title: sanitizeSuggestedBookText(suggestion),
        originalTitle: '',
        author: '',
        reason: ''
      };
    } else if (suggestion && typeof suggestion === 'object') {
      normalized = {
        title: sanitizeSuggestedBookText(suggestion.title ?? suggestion.name ?? suggestion.bookTitle),
        originalTitle: sanitizeSuggestedBookText(suggestion.originalTitle ?? suggestion.original_name ?? suggestion.englishTitle),
        author: sanitizeSuggestedBookText(suggestion.author ?? suggestion.authorName ?? suggestion.writer),
        reason: sanitizeSuggestedBookText(suggestion.reason ?? suggestion.why ?? suggestion.comment)
      };
    }

    if (!normalized?.title) {
      continue;
    }

    const uniqueKey = normalizeText([normalized.title, normalized.author, normalized.originalTitle].filter(Boolean).join(' '));

    if (!uniqueSuggestions.has(uniqueKey)) {
      uniqueSuggestions.set(uniqueKey, normalized);
    }
  }

  return [...uniqueSuggestions.values()].slice(0, aiSuggestedBookLimit);
}

function tokenizeLooseText(value) {
  return normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function stripTitleVariant(value) {
  const normalized = sanitizeSuggestedBookText(value);

  if (!normalized) {
    return '';
  }

  return normalized
    .replace(/\s*[(:\-–]\s*.+$/u, '')
    .replace(/\b(кн|книга|том|часть)\.?\s*\d+.*$/iu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildTitleMatchKeys(...values) {
  const keys = new Set();

  for (const value of values) {
    const normalized = normalizeText(value);
    const stripped = normalizeText(stripTitleVariant(value));

    if (normalized) {
      keys.add(normalized);
    }

    if (stripped && stripped.length >= 4) {
      keys.add(stripped);
    }
  }

  return [...keys];
}

function countTokenOverlap(left, right) {
  if (!left.length || !right.length) {
    return 0;
  }

  const rightSet = new Set(right);
  return left.reduce((count, token) => count + (rightSet.has(token) ? 1 : 0), 0);
}

function getSuggestionAuthorMatchScore(book, suggestion) {
  const authorText = normalizeText(suggestion.author);

  if (!authorText) {
    return 0;
  }

  const bookAuthorText = normalizeText((book.authors ?? []).map((item) => item.fullName).join(' '));

  if (!bookAuthorText) {
    return -1;
  }

  if (bookAuthorText.includes(authorText)) {
    return 3;
  }

  const authorTokens = tokenizeLooseText(authorText).filter((token) => token.length >= 3);
  const overlap = countTokenOverlap(authorTokens, tokenizeLooseText(bookAuthorText));

  if (overlap >= Math.min(authorTokens.length, 2) && overlap > 0) {
    return 2;
  }

  return overlap > 0 ? 1 : -1;
}

function scoreBookAgainstSuggestion(book, suggestion) {
  const title = sanitizeSuggestedBookText(suggestion.title);

  if (!title) {
    return 0;
  }

  const author = sanitizeSuggestedBookText(suggestion.author);
  const originalTitle = sanitizeSuggestedBookText(suggestion.originalTitle);
  const titleText = normalizeText(title);
  const originalTitleText = normalizeText(originalTitle);
  const authorText = normalizeText(author);
  const titleQueries = unique(
    [
      title,
      originalTitle,
      author ? `${title} ${author}` : null,
      author && originalTitle ? `${originalTitle} ${author}` : null,
      author ? `${author} ${title}` : null,
      author && originalTitle ? `${author} ${originalTitle}` : null
    ].filter(Boolean)
  );
  const bookTitleText = normalizeText([book.title, book.originalTitle].filter(Boolean).join(' '));
  const bookAuthorText = normalizeText((book.authors ?? []).map((item) => item.fullName).join(' '));
  let bestScore = 0;

  for (const query of titleQueries) {
    const { score, strength } = scoreBookTextMatch(book, query);
    bestScore = Math.max(bestScore, score + strength * 120);
  }

  if (bookTitleText === titleText || (originalTitleText && bookTitleText.includes(originalTitleText))) {
    bestScore += 1600;
  } else if (
    bookTitleText.startsWith(titleText) ||
    titleText.startsWith(bookTitleText) ||
    (originalTitleText && (bookTitleText.startsWith(originalTitleText) || originalTitleText.startsWith(bookTitleText)))
  ) {
    bestScore += 900;
  } else {
    const titleTokens = unique([...tokenizeLooseText(title), ...tokenizeLooseText(originalTitle)]);
    const matchedTitleTokens = titleTokens.filter((token) => bookTitleText.includes(token)).length;
    bestScore += matchedTitleTokens * 120;
  }

  if (authorText && bestScore >= 800) {
    if (bookAuthorText.includes(authorText)) {
      bestScore += 900;
    } else {
      const authorTokens = tokenizeLooseText(author);
      const matchedAuthorTokens = authorTokens.filter((token) => bookAuthorText.includes(token)).length;
      bestScore += matchedAuthorTokens * 150;
    }
  }

  return bestScore;
}

function compareAiSearchTieBreakers(leftBook, rightBook) {
  return String(leftBook.title ?? '').localeCompare(String(rightBook.title ?? ''), 'ru');
}

function normalizeAiSortPreference(sort) {
  if (!sort || sort === 'rating_desc' || sort === 'rating_asc' || sort === 'rating') {
    return 'newest_desc';
  }

  return sort;
}

function findStrictSuggestionMatch(suggestion, catalogBooks, filters = {}, usedBookIds = new Set()) {
  const titleKeys = buildTitleMatchKeys(suggestion.title, suggestion.originalTitle);

  if (!titleKeys.length) {
    return null;
  }

  const eligibleBooks = catalogBooks.filter((book) => !usedBookIds.has(book.id) && matchesExplicitPromptFilters(book, filters));
  const exactMatches = eligibleBooks
    .map((book) => {
      const bookTitleKeys = buildTitleMatchKeys(book.title, book.originalTitle);

      if (!bookTitleKeys.some((key) => titleKeys.includes(key))) {
        return null;
      }

      const authorStrength = getSuggestionAuthorMatchScore(book, suggestion);

      return {
        book,
        authorStrength,
        score: 4000 + Math.max(authorStrength, 0) * 700
      };
    })
    .filter(Boolean)
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.authorStrength - left.authorStrength ||
        compareAiSearchTieBreakers(left.book, right.book)
    );

  const exactBest = exactMatches[0];
  const exactSecond = exactMatches[1];

  if (exactBest) {
    if (suggestion.author && exactBest.authorStrength < 1) {
      return null;
    }

    if (!exactSecond || exactBest.score >= exactSecond.score + 150) {
      return {
        ...exactBest,
        matchType: 'exact'
      };
    }
  }

  const fuzzyMatches = eligibleBooks
    .map((book) => {
      const authorStrength = getSuggestionAuthorMatchScore(book, suggestion);
      const suggestionTitleTokens = tokenizeLooseText([suggestion.title, suggestion.originalTitle].filter(Boolean).join(' ')).filter(
        (token) => token.length >= 3
      );
      const bookTitleTokens = tokenizeLooseText([book.title, book.originalTitle].filter(Boolean).join(' ')).filter((token) => token.length >= 3);
      const overlap = countTokenOverlap(suggestionTitleTokens, bookTitleTokens);

      return {
        book,
        overlap,
        authorStrength,
        score: scoreBookAgainstSuggestion(book, suggestion)
      };
    })
    .filter((item) => item.score >= 3200 && item.overlap >= 2 && (!suggestion.author || item.authorStrength >= 1))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.overlap - left.overlap ||
        right.authorStrength - left.authorStrength ||
        compareAiSearchTieBreakers(left.book, right.book)
    );

  const fuzzyBest = fuzzyMatches[0];
  const fuzzySecond = fuzzyMatches[1];

  if (!fuzzyBest) {
    return null;
  }

  if (fuzzySecond && fuzzyBest.score < fuzzySecond.score + 240) {
    return null;
  }

  return {
    ...fuzzyBest,
    matchType: 'fuzzy'
  };
}

function matchesExplicitPromptFilters(book, filters = {}) {
  if (filters.origin) {
    const bookOrigin = inferBookOriginStable(book);

    if (bookOrigin !== filters.origin) {
      return false;
    }
  }

  if (filters.language && String(book.language ?? '').toLowerCase() !== String(filters.language).toLowerCase()) {
    return false;
  }

  if (filters.author) {
    const authorText = normalizeText((book.authors ?? []).map((item) => item.fullName).join(' '));
    if (!authorText.includes(normalizeText(filters.author))) {
      return false;
    }
  }

  if (filters.section) {
    const sectionText = normalizeText(book.catalogSectionSlug ?? book.catalogSection);
    if (!sectionText.includes(normalizeText(filters.section))) {
      return false;
    }
  }

  if (filters.genres?.length) {
    const genreNames = (book.genres ?? []).map((genre) => normalizeText(genre.name));
    const hasGenreMatch = filters.genres.some((genre) => genreNames.includes(normalizeText(genre)));

    if (!hasGenreMatch) {
      return false;
    }
  }

  if (filters.tags?.length) {
    const tagNames = (book.tags ?? []).map((tag) => normalizeText(tag.name));
    const hasTagMatch = filters.tags.some((tag) => tagNames.includes(normalizeText(tag)));

    if (!hasTagMatch) {
      return false;
    }
  }

  if (filters.yearFrom && (book.publicationYear ?? 0) < filters.yearFrom) {
    return false;
  }

  if (filters.yearTo && (book.publicationYear ?? 0) > filters.yearTo) {
    return false;
  }

  return true;
}

async function collectCatalogBooksForSuggestionMatching() {
  if (aiSuggestedCatalogCache.items && aiSuggestedCatalogCache.expiresAt > Date.now()) {
    return aiSuggestedCatalogCache.items;
  }

  const baseFilters = {
    page: 1,
    limit: aiSuggestedCatalogPageSize,
    sort: 'newest_desc',
    genres: [],
    tags: []
  };
  const firstPage = await listBooks(baseFilters);

  if (firstPage.meta.totalPages <= 1) {
    return firstPage.items;
  }

  const pages = await Promise.all(
    Array.from({ length: firstPage.meta.totalPages - 1 }, (_, index) =>
      listBooks({
        ...baseFilters,
        page: index + 2
      })
    )
  );
  const itemsById = new Map(firstPage.items.map((item) => [item.id, item]));

  for (const page of pages) {
    for (const item of page.items) {
      if (!itemsById.has(item.id)) {
        itemsById.set(item.id, item);
      }
    }
  }

  const items = [...itemsById.values()];
  aiSuggestedCatalogCache = {
    items,
    expiresAt: Date.now() + aiSuggestedCatalogCacheTtlMs
  };

  return items;
}

export function matchAiSuggestionsToCatalog(suggestions, catalogBooks, filters = {}) {
  const normalizedSuggestions = normalizeAiBookSuggestions(suggestions);
  const usedBookIds = new Set();
  const matches = [];

  for (const suggestion of normalizedSuggestions) {
    const best = findStrictSuggestionMatch(suggestion, catalogBooks, filters, usedBookIds);

    if (!best || best.score < aiSuggestedBookMinScore) {
      continue;
    }

    usedBookIds.add(best.book.id);
    matches.push({
      ...best,
      suggestion,
      reason: suggestion.reason || null
    });
  }

  return matches;
}

function mergeAiCatalogCandidates(localItems, suggestionMatches, promptProfile, filters) {
  const suggestedItems = suggestionMatches.map((item) => item.book);
  const suggestionRank = new Map(suggestedItems.map((item, index) => [item.id, Math.max(0, aiSuggestedBookLimit - index)]));
  const mergedItems = [...new Map([...suggestedItems, ...localItems].map((item) => [item.id, item])).values()];

  return mergedItems.sort((left, right) => {
    const leftScore = scoreBookAgainstPrompt(left, promptProfile, filters) + (suggestionRank.get(left.id) ?? 0) * 9;
    const rightScore = scoreBookAgainstPrompt(right, promptProfile, filters) + (suggestionRank.get(right.id) ?? 0) * 9;

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return compareAiSearchTieBreakers(left, right);
  });
}

function buildVariantKey(filters) {
  return JSON.stringify({
    query: filters.query ?? null,
    author: filters.author ?? null,
    section: filters.section ?? null,
    origin: filters.origin ?? null,
    genres: filters.genres ?? [],
    tags: filters.tags ?? [],
    language: filters.language ?? null,
    yearFrom: filters.yearFrom ?? null,
    yearTo: filters.yearTo ?? null,
    sort: normalizeAiSortPreference(filters.sort),
    page: 1,
    limit: filters.limit ?? 24
  });
}

function buildAiSearchVariants(filters) {
  const candidateLimit = Math.max(filters.limit ?? aiSearchDefaultLimit, 24);
  const variants = [
    {
      ...filters,
      page: 1,
      limit: candidateLimit
    },
    {
      ...filters,
      page: 1,
      limit: candidateLimit,
      tags: []
    },
    {
      ...filters,
      page: 1,
      limit: candidateLimit,
      genres: []
    },
    {
      ...filters,
      page: 1,
      limit: candidateLimit,
      query: undefined,
      tags: []
    },
    {
      ...filters,
      page: 1,
      limit: candidateLimit,
      query: undefined,
      genres: [],
      tags: [],
      yearFrom: undefined,
      yearTo: undefined,
      sort: 'newest_desc'
    },
    normalizeSearchFilters({
      page: 1,
      limit: candidateLimit,
      sort: 'newest_desc',
      language: filters.language
    }),
    normalizeSearchFilters({
      page: 1,
      limit: candidateLimit,
      sort: 'year_desc'
    })
  ];

  const seen = new Set();
  return variants.filter((variant) => {
    const key = buildVariantKey(variant);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function collectAiCandidates(filters) {
  const catalogBooks = await collectCatalogBooksForSuggestionMatching();

  return catalogBooks.filter((book) => matchesExplicitPromptFilters(book, filters));
}

export function scoreBookAgainstPrompt(book, profile, filters = {}) {
  const titleText = normalizeText([book.title, book.originalTitle].filter(Boolean).join(' '));
  const authorText = normalizeText((book.authors ?? []).map((author) => author.fullName).join(' '));
  const genreText = normalizeText((book.genres ?? []).map((genre) => genre.name).join(' '));
  const tagText = normalizeText((book.tags ?? []).map((tag) => tag.name).join(' '));
  const metadataText = normalizeText(
    [book.catalogSection, book.series, book.publisher, book.editor, book.ageRestriction].filter(Boolean).join(' ')
  );
  const descriptionText = normalizeText(book.description);

  let score = 0;

  score += scoreTextMatches(titleText, profile.tokens, 7);
  score += scoreTextMatches(authorText, profile.tokens, 5);
  score += scoreTextMatches(genreText, profile.tokens, 4.5);
  score += scoreTextMatches(tagText, profile.tokens, 4);
  score += scoreTextMatches(metadataText, profile.tokens, 3.5);
  score += scoreTextMatches(descriptionText, profile.tokens, 2.2);

  if (filters.author && authorText.includes(normalizeText(filters.author))) {
    score += 16;
  }

  if (filters.origin) {
    const bookOrigin = inferBookOriginStable(book);

    if (bookOrigin === filters.origin) {
      score += 18;
    } else if (bookOrigin === 'unknown') {
      score -= 6;
    } else {
      score -= 24;
    }
  }

  if (filters.language) {
    score += book.language?.toLowerCase() === filters.language.toLowerCase() ? 5 : -3;
  }

  if (filters.section) {
    score += normalizeText(book.catalogSectionSlug ?? book.catalogSection).includes(normalizeText(filters.section)) ? 8 : -2;
  }

  if (filters.genres?.length) {
    const genreNames = (book.genres ?? []).map((genre) => normalizeText(genre.name));
    const matches = filters.genres.filter((genre) => genreNames.includes(normalizeText(genre)));
    score += matches.length * 14;
  }

  if (filters.tags?.length) {
    const tagNames = (book.tags ?? []).map((tag) => normalizeText(tag.name));
    const matches = filters.tags.filter((tag) => tagNames.includes(normalizeText(tag)));
    score += matches.length * 16;

    if (matches.length >= 2) {
      score += 6;
    }

    if (!matches.length) {
      score -= 10;
    }
  }

  if (profile.inferredTags?.length) {
    const tagNames = (book.tags ?? []).map((tag) => normalizeText(tag.name));
    const matches = profile.inferredTags.filter((tag) => tagNames.includes(normalizeText(tag)));
    score += matches.length * 12;

    if (!matches.length) {
      score -= 8;
    }
  }

  if (filters.yearFrom || filters.yearTo) {
    const year = book.publicationYear ?? 0;
    if (!year) {
      score -= 2;
    } else if (filters.yearFrom && year < filters.yearFrom) {
      score -= Math.min(8, Math.ceil((filters.yearFrom - year) / 5));
    } else if (filters.yearTo && year > filters.yearTo) {
      score -= Math.min(8, Math.ceil((year - filters.yearTo) / 5));
    } else {
      score += 4;
    }
  }

  if (profile.wantsRecent && book.publicationYear) {
    score += clamp((book.publicationYear - 2000) / 2, 0, 10);
  }

  if (profile.wantsClassic && book.publicationYear && book.publicationYear < 1980) {
    score += 8;
  }

  if (profile.inferredSections?.length) {
    const currentSection = normalizeText(book.catalogSectionSlug ?? book.catalogSection);
    const sectionMatches = profile.inferredSections.filter((section) => currentSection.includes(normalizeText(section)));
    score += sectionMatches.length * 5;

    if (!sectionMatches.length) {
      score -= 2;
    }
  }

  if (!(book.authors ?? []).length) {
    score -= 6;
  }

  return Number(score.toFixed(3));
}

function buildReasonFragments(book, filters, promptProfile) {
  const reasons = [];
  const genreNames = (book.genres ?? []).map((genre) => genre.name.toLowerCase());
  const tagNames = (book.tags ?? []).map((tag) => tag.name.toLowerCase());

  if (filters.genres?.length) {
    const matched = filters.genres.filter((genre) => genreNames.includes(genre.toLowerCase()));
    if (matched.length) {
      reasons.push(`совпадает по жанрам: ${matched.join(', ')}`);
    }
  }

  if (filters.tags?.length) {
    const matched = filters.tags.filter((tag) => tagNames.includes(tag.toLowerCase()));
    if (matched.length) {
      reasons.push(`попадает в настроение запроса: ${matched.join(', ')}`);
    }
  }

  if (filters.origin) {
    const bookOrigin = inferBookOriginStable(book);

    if (bookOrigin === filters.origin) {
      reasons.push(filters.origin === 'foreign' ? 'похоже на зарубежную литературу' : 'похоже на русскую литературу');
    }
  }

  if (promptProfile.inferredSections?.length) {
    const currentSection = normalizeText(book.catalogSectionSlug ?? book.catalogSection);
    const matchedSection = promptProfile.inferredSections.find((section) => currentSection.includes(normalizeText(section)));

    if (matchedSection) {
      reasons.push(`подходит по разделу каталога: ${book.catalogSection ?? matchedSection}`);
    }
  }

  if (promptProfile.wantsRecent && book.publicationYear) {
    reasons.push(`относительно свежая книга: ${book.publicationYear}`);
  }

  if (promptProfile.wantsClassic && book.publicationYear && book.publicationYear < 1990) {
    reasons.push(`классическое издание: ${book.publicationYear}`);
  }

  if (!reasons.length && book.description) {
    reasons.push(book.description.length > 120 ? `${book.description.slice(0, 117)}...` : book.description);
  }

  return reasons.slice(0, 2);
}

function sanitizeAiReason(reason) {
  const normalizedReason = String(reason ?? '').trim();

  if (!normalizedReason) {
    return '';
  }

  const normalizedTextReason = normalizeText(normalizedReason);

  if (/(оцен|rating|рейтинг|популяр|читател|отзыв)/u.test(normalizedTextReason)) {
    return '';
  }

  return normalizedReason;
}

function sanitizeAiAssistantText(answer) {
  const normalizedAnswer = String(answer ?? '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalizedAnswer) {
    return '';
  }

  const normalizedTextAnswer = normalizeText(normalizedAnswer);

  if (/(РѕС†РµРЅ|rating|СЂРµР№С‚РёРЅРі|РїРѕРїСѓР»СЏСЂ|С‡РёС‚Р°С‚РµР»|РѕС‚Р·С‹РІ)/u.test(normalizedTextAnswer)) {
    return '';
  }

  return normalizedAnswer;
}

function compactAssistantAnswer(answer, maxLength = 220) {
  const normalized = String(answer ?? '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return '';
  }

  const sentences =
    normalized
      .match(/[^.!?]+[.!?]?/g)
      ?.map((item) => item.trim())
      .filter(Boolean) ?? [normalized];

  const brief = sentences.slice(0, 2).join(' ');

  if (brief.length <= maxLength) {
    return brief;
  }

  return `${brief.slice(0, maxLength - 3).trimEnd()}...`;
}

function getAssistantBooks(items, recommendedBookIds = [], limit = 3) {
  if (recommendedBookIds.length) {
    const byId = new Map(items.map((item) => [item.id, item]));

    return recommendedBookIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .slice(0, limit);
  }

  return items.slice(0, limit);
}

function buildFallbackAssistant(prompt, filters, promptProfile, items) {
  if (!items.length) {
    return {
      source: 'fallback',
      answer: 'Книг по вашему запросу в каталоге нет.',
      recommendedBookIds: []
    };
  }

  const selectedBooks = items.slice(0, 3);
  const focusParts = [];

  if (filters.genres?.length) {
    focusParts.push('жанр');
  }

  if (filters.tags?.length || promptProfile.dimensionWeights.vibe || promptProfile.dimensionWeights.idea) {
    focusParts.push('настроение и тему');
  }

  const selectedFocusText = focusParts.length ? ` С упором на ${focusParts.join(' и ')}.` : '';
  const selectedTitles = selectedBooks.map((book) => `«${book.title}»`).join(', ');

  return {
    source: 'fallback',
    answer: compactAssistantAnswer(`По описанию ближе всего смотрятся ${selectedTitles}.${selectedFocusText}`),
    recommendedBookIds: selectedBooks.map((book) => book.id)
  };

  if (!items.length) {
    return {
      source: 'fallback',
      answer: 'Каталог пока пуст или недоступен для подбора.',
      recommendedBookIds: []
    };
  }

  const topBooks = items.slice(0, 3);
  const focus = [];

  if (filters.genres?.length) {
    focus.push('жанру');
  }

  if (filters.tags?.length || promptProfile.dimensionWeights.vibe || promptProfile.dimensionWeights.idea) {
    focus.push('настроению');
  }

  const focusText = focus.length ? ` по ${focus.join(', ')}` : '';
  const titles = topBooks.map((book) => `«${book.title}»`).join(', ');

  return {
    source: 'fallback',
    answer: compactAssistantAnswer(`По описанию ближе всего смотрятся ${titles}. Я выбрал их как самые похожие по настроению и теме${focusText}.`),
    recommendedBookIds: topBooks.map((book) => book.id)
  };
}

function normalizeAssistantRecommendation(recommendation, items) {
  if (!recommendation) {
    return null;
  }

  const allowedIds = new Set(items.map((item) => item.id));
  const recommendedBookIds = (recommendation.recommendedBookIds ?? []).filter((id) => allowedIds.has(id)).slice(0, 3);
  const normalizedAnswer = compactAssistantAnswer(sanitizeAiAssistantText(recommendation.answer));
  const fallbackBooks = recommendedBookIds.length ? getAssistantBooks(items, recommendedBookIds) : [];
  const fallbackTitles = fallbackBooks.map((book) => `«${book.title}»`).join(', ');
  const answer =
    (recommendedBookIds.length ? normalizedAnswer : '') ||
    (fallbackTitles
      ? compactAssistantAnswer(`По вашему запросу я считаю, что лучше всего подойдут ${fallbackTitles}.`)
      : '');

  if (!recommendedBookIds.length && !answer) {
    return null;
  }

  return {
    source: 'ai',
    answer,
    recommendedBookIds
  };
}

function prioritizeResults(items, recommendedBookIds) {
  if (!recommendedBookIds?.length) {
    return items;
  }

  const rank = new Map(recommendedBookIds.map((id, index) => [id, index]));

  return [...items].sort((left, right) => {
    const leftRank = rank.has(left.id) ? rank.get(left.id) : Number.MAX_SAFE_INTEGER;
    const rightRank = rank.has(right.id) ? rank.get(right.id) : Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return 0;
  });
}

function collectAiCandidateSignals(book, promptProfile, filters = {}) {
  const titleText = normalizeText([book.title, book.originalTitle].filter(Boolean).join(' '));
  const authorText = normalizeText((book.authors ?? []).map((author) => author.fullName).join(' '));
  const genreText = normalizeText((book.genres ?? []).map((genre) => genre.name).join(' '));
  const tagText = normalizeText((book.tags ?? []).map((tag) => tag.name).join(' '));
  const metadataText = normalizeText([book.catalogSection, book.catalogSectionSlug, book.series, book.publisher, book.editor].filter(Boolean).join(' '));
  const descriptionText = normalizeText(book.description);
  const matchedTokenCount = promptProfile.tokens.filter((token) =>
    [titleText, authorText, genreText, tagText, metadataText, descriptionText].some((text) => text.includes(token))
  ).length;
  const matchedGenreCount = filters.genres?.length
    ? filters.genres.filter((genre) => genreText.includes(normalizeText(genre))).length
    : 0;
  const matchedTagCount = filters.tags?.length ? filters.tags.filter((tag) => tagText.includes(normalizeText(tag))).length : 0;
  const matchedSectionCount = filters.section && metadataText.includes(normalizeText(filters.section)) ? 1 : 0;
  const originMatched = filters.origin ? inferBookOriginStable(book) === filters.origin : false;

  return {
    matchedTokenCount,
    matchedGenreCount,
    matchedTagCount,
    matchedSectionCount,
    originMatched
  };
}

function hasMeaningfulAiSignal(signals, promptProfile, filters = {}) {
  if (filters.origin && !signals.originMatched) {
    return false;
  }

  if (signals.matchedTokenCount > 0 || signals.matchedGenreCount > 0 || signals.matchedTagCount > 0 || signals.matchedSectionCount > 0) {
    return true;
  }

  return !promptProfile.tokens.length && !filters.genres?.length && !filters.tags?.length && !filters.section && !filters.origin;
}

function filterAiCandidatesByRelevance(items, promptProfile, filters = {}, pinnedBookIds = []) {
  if (!items.length) {
    return [];
  }

  const pinnedIds = new Set(pinnedBookIds);
  const scoredItems = items.map((book) => ({
    book,
    score: scoreBookAgainstPrompt(book, promptProfile, filters),
    signals: collectAiCandidateSignals(book, promptProfile, filters)
  }));
  const bestScore = scoredItems[0]?.score ?? 0;
  const minimumScore = Math.max(
    promptProfile.tokens.length || filters.genres?.length || filters.tags?.length || filters.section || filters.origin ? 6 : 4,
    bestScore >= 28 ? bestScore * 0.58 : bestScore >= 16 ? bestScore * 0.5 : bestScore - 2
  );
  const relevanceFiltered = scoredItems.filter((entry) => {
    if (entry.score < minimumScore) {
      return false;
    }

    return hasMeaningfulAiSignal(entry.signals, promptProfile, filters);
  });

  return relevanceFiltered.map((entry) => entry.book);

  const filtered = scoredItems.filter((entry) => {
    if (pinnedIds.has(entry.book.id)) {
      return true;
    }

    if (entry.score < minimumScore) {
      return false;
    }

    return hasMeaningfulAiSignal(entry.signals, promptProfile, filters);
  });

  return filtered.map((entry) => entry.book);
}

function attachAiMetadata(items, suggestionMatches, filters, promptProfile) {
  const suggestionMetaByBookId = new Map(
    suggestionMatches.map((match) => [
      match.book.id,
      {
        aiReason: sanitizeAiReason((/[А-Яа-яЁё]/.test(match.reason ?? '') ? match.reason : '') || '') || buildReasonFragments(match.book, filters, promptProfile)[0] || '',
        aiMatchType: match.matchType
      }
    ])
  );

  return items.map((item) => {
    const aiMeta = suggestionMetaByBookId.get(item.id);

    return {
      ...item,
      aiReason: aiMeta?.aiReason || buildReasonFragments(item, filters, promptProfile)[0] || '',
      aiMatchType: aiMeta?.aiMatchType ?? null
    };
  });
}

function buildPublicAiFilters(filters) {
  const publicFilters = {
    ...filters
  };

  delete publicFilters.sort;
  delete publicFilters.minRating;
  delete publicFilters.maxRating;

  return publicFilters;
}

function buildAiSearchCacheKey(prompt, partialFilters) {
  return JSON.stringify({
    version: aiSearchCacheVersion,
    prompt: normalizeText(prompt),
    partialFilters: normalizeSearchFilters({
      genres: [],
      tags: [],
      page: partialFilters.page ?? 1,
      limit: partialFilters.limit ?? aiSearchDefaultLimit,
      sort: normalizeAiSortPreference(partialFilters.sort),
      ...partialFilters,
      minRating: undefined,
      maxRating: undefined,
      sort: normalizeAiSortPreference(partialFilters.sort)
    })
  });
}

function getAiSearchCache(key) {
  const cached = aiSearchResultCache.get(key);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    aiSearchResultCache.delete(key);
    return null;
  }

  return cached.value;
}

function setAiSearchCache(key, value) {
  aiSearchResultCache.set(key, {
    value,
    expiresAt: Date.now() + aiSearchResultCacheTtlMs
  });

  return value;
}

function createAiAssistantUnavailableWarning(error) {
  return {
    code: 'AI_ASSISTANT_UNAVAILABLE',
    provider: error?.provider ?? env.aiProvider,
    providerStatus: error?.statusCode ?? null,
    providerMessage: error?.details?.providerMessage ?? null
  };
}

function hasMeaningfulAiFilters(filters) {
  if (!filters) {
    return false;
  }

  const sort = normalizeAiSortPreference(filters.sort);

  return Boolean(
    filters.query ||
      filters.author ||
      filters.section ||
      filters.origin ||
      filters.language ||
      filters.yearFrom ||
      filters.yearTo ||
      (filters.genres?.length ?? 0) > 0 ||
      (filters.tags?.length ?? 0) > 0 ||
      (sort && sort !== 'newest_desc')
  );
}

export async function resolveAiSearchFilters(prompt, partialFilters = {}, curatedFilters = null, warning = null) {
  const heuristicFilters = heuristicInterpretSearchPromptStable(prompt);
  const baseFilters =
    curatedFilters && hasMeaningfulAiFilters(curatedFilters) ? curatedFilters : heuristicFilters;
  const mergedFilters = normalizeSearchFilters({
    genres: [],
    tags: [],
    page: 1,
    limit: partialFilters.limit ?? aiSearchDefaultLimit,
    sort: normalizeAiSortPreference(partialFilters.sort ?? baseFilters?.sort ?? heuristicFilters.sort ?? 'newest_desc'),
    ...heuristicFilters,
    ...baseFilters,
    ...partialFilters,
    minRating: undefined,
    maxRating: undefined,
    sort: normalizeAiSortPreference(partialFilters.sort ?? baseFilters?.sort ?? heuristicFilters.sort ?? 'newest_desc'),
    query: partialFilters.query ?? baseFilters.query ?? heuristicFilters.query
  });

  return {
    source: baseFilters === curatedFilters ? 'ai' : 'fallback',
    filters: mergedFilters,
    warning
  };
}

function paginateRankedItems(items, page, limit) {
  const safePage = Math.max(1, page ?? 1);
  const safeLimit = Math.max(1, limit ?? aiSearchDefaultLimit);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const start = (safePage - 1) * safeLimit;

  return {
    items: items.slice(start, start + safeLimit),
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages
    }
  };
}

export async function runAiSearch(prompt, partialFilters = {}) {
  const cacheKey = buildAiSearchCacheKey(prompt, partialFilters);
  const cached = getAiSearchCache(cacheKey);

  if (cached) {
    return cached;
  }

  const heuristicFilters = heuristicInterpretSearchPrompt(prompt);
  const providerPromptProfile = buildPromptProfileStable(prompt, heuristicFilters);
  const providerPrompt = buildAiProviderPrompt(prompt, heuristicFilters, providerPromptProfile);
  let curated = null;
  let assistantWarning = null;

  try {
    curated = await curateAiSearch(providerPrompt);
  } catch (error) {
    assistantWarning = createAiAssistantUnavailableWarning(error);
  }

  if (!curated) {
    assistantWarning = assistantWarning ?? createAiAssistantUnavailableWarning();
  }

  const interpreted = await resolveAiSearchFilters(prompt, partialFilters, curated?.filters ?? null, assistantWarning);
  const promptProfile = buildPromptProfileStable(prompt, interpreted.filters);
  const candidates = await collectAiCandidates(interpreted.filters);
  const rankedItems = [...candidates].sort((left, right) => {
    const leftScore = scoreBookAgainstPrompt(left, promptProfile, interpreted.filters);
    const rightScore = scoreBookAgainstPrompt(right, promptProfile, interpreted.filters);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return compareAiSearchTieBreakers(left, right);
  });

  const aiSuggestions = normalizeAiBookSuggestions(curated?.suggestions ?? []);
  let aiSuggestedMatches = [];

  if (aiSuggestions.length) {
    const catalogBooks = await collectCatalogBooksForSuggestionMatching();
    aiSuggestedMatches = matchAiSuggestionsToCatalog(aiSuggestions, catalogBooks, interpreted.filters);
  }

  const finalCandidates = mergeAiCatalogCandidates(rankedItems, aiSuggestedMatches, promptProfile, interpreted.filters);
  const filteredCandidates = filterAiCandidatesByRelevance(
    finalCandidates,
    promptProfile,
    interpreted.filters,
    aiSuggestedMatches.map((item) => item.book.id)
  );
  const derivedRecommendation =
    aiSuggestedMatches.length || curated?.answer
      ? {
          answer: curated?.answer ?? '',
          recommendedBookIds: aiSuggestedMatches.slice(0, 3).map((item) => item.book.id)
        }
      : null;

  if (derivedRecommendation?.recommendedBookIds?.length) {
    assistantWarning = null;
  }

  const assistant =
    normalizeAssistantRecommendation(derivedRecommendation, filteredCandidates) ??
    buildFallbackAssistant(prompt, interpreted.filters, promptProfile, filteredCandidates);
  const enrichedCandidates = attachAiMetadata(filteredCandidates, aiSuggestedMatches, interpreted.filters, promptProfile);
  const results = paginateRankedItems(
    prioritizeResults(enrichedCandidates, assistant.recommendedBookIds),
    interpreted.filters.page,
    interpreted.filters.limit
  );
  const publicFilters = buildPublicAiFilters(interpreted.filters);
  const response = {
    interpreted: {
      source: curated ? 'ai' : interpreted.source,
      filters: publicFilters
    },
    assistant,
    warning: assistantWarning
      ? {
          ...assistantWarning,
          message: 'ИИ-ответ временно недоступен. Показываем краткую подборку по каталогу.'
        }
      : null,
    results
  };

  return setAiSearchCache(cacheKey, response);
}
