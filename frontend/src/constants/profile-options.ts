export const SUPPORT_EMAIL = 'buk.poisk.supp@yandex.ru';

export const CITY_OPTIONS = [
  'Москва',
  'Санкт-Петербург',
  'Казань',
  'Екатеринбург',
  'Новосибирск',
  'Нижний Новгород',
  'Краснодар',
  'Ростов-на-Дону',
  'Самара',
  'Уфа',
  'Челябинск',
  'Пермь',
  'Воронеж',
  'Волгоград',
  'Красноярск',
  'Омск',
  'Тюмень',
  'Сочи',
  'Владивосток',
  'Иваново',
  'Минск'
] as const;

export const GENRE_OPTIONS = [
  'Фантастика',
  'Фэнтези',
  'Детектив',
  'Триллер',
  'Мистика и ужасы',
  'Современная проза',
  'Классика',
  'Любовный роман',
  'Исторический роман',
  'Young Adult',
  'Нон-фикшн',
  'Биография'
] as const;

export function parseFavoriteGenres(value?: string | null) {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinFavoriteGenres(values: string[]) {
  return values.join(', ');
}
