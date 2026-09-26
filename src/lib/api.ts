import type {
  AuthResponse,
  LoginChallengeResponse,
  MeResponse,
  MessageResponse,
} from '../shared';

const TOKEN_KEY = 'accessToken';

/** API base: set VITE_API_BASE for GitHub Pages / tunnel; empty = same-origin (Vite proxy). */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(
  /\/$/,
  '',
) || '';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data as { message?: string | string[] }).message ??
      res.statusText ??
      'Request failed';
    throw new Error(Array.isArray(msg) ? msg.join('; ') : String(msg));
  }
  return data as T;
}

export const api = {
  register: (body: unknown) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: unknown) =>
    request<LoginChallengeResponse | AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  verifyLogin: (body: unknown) =>
    request<AuthResponse>('/api/auth/verify-login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  verifyEmail: (body: unknown) =>
    request<MessageResponse>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  me: () => request<MeResponse>('/api/auth/me'),
  logout: () =>
    request<MessageResponse>('/api/auth/logout', { method: 'POST' }),
};
