import { environment } from '../../environments/environment';

export const API_BASE = environment.apiBase;

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export function fullUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  return `${API_BASE}${pathOrUrl}`;
}
