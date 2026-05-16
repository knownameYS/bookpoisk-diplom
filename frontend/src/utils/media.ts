import { api } from '../api/client';

function getApiOrigin() {
  const baseUrl = typeof api.defaults.baseURL === 'string' ? api.defaults.baseURL : 'http://localhost:4000/api';
  return baseUrl.replace(/\/api\/?$/, '');
}

export function resolveMediaUrl(url?: string | null) {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${getApiOrigin()}${url.startsWith('/') ? url : `/${url}`}`;
}
