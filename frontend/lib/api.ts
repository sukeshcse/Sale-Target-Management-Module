import type { ApiError } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    const message = body ? (Array.isArray(body.message) ? body.message.join(', ') : body.message) : res.statusText;
    throw new ApiRequestError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function apiGet<T>(path: string): Promise<T> {
  return fetch(`${API_BASE_URL}${path}`).then((res) => handleResponse<T>(res));
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).then((res) => handleResponse<T>(res));
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).then((res) => handleResponse<T>(res));
}

export function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  return fetch(`${API_BASE_URL}${path}`, { method: 'POST', body: formData }).then((res) => handleResponse<T>(res));
}
