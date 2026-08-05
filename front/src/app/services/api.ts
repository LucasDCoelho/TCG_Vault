export const API_BASE = 'http://localhost:8000';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export function fullUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  return `${API_BASE}${pathOrUrl}`;
}
