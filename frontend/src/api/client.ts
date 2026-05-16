import axios from 'axios';

const ACCESS_TOKEN_KEY = 'bookpoisk_access_token';

const AUTH_REFRESH_EXCLUDED_URLS = new Set(['/auth/login', '/auth/register', '/auth/refresh']);
export const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

export function getAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (token) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = typeof originalRequest?.url === 'string' ? originalRequest.url : '';

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !AUTH_REFRESH_EXCLUDED_URLS.has(requestUrl)
    ) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await api.post('/auth/refresh');
        const token = refreshResponse.data?.accessToken;

        if (token) {
          setAccessToken(token);
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
      }
    }

    throw error;
  }
);

export function getApiErrorMessage(error: unknown, fallback = 'Что-то пошло не так. Попробуйте ещё раз.') {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export function unwrapItems<T>(payload: { items?: T[] } | T[] | undefined) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.items ?? [];
}
