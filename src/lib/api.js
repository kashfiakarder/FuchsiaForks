/**
 * Authenticated fetch helper for the Django API.
 *
 * Callers pass Auth0's getAccessTokenSilently (and optionally loginWithRedirect
 * for 401 recovery). Base URL comes from VITE_API_BASE_URL.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(
  /\/$/,
  '',
);

export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * @param {object} options
 * @param {() => Promise<string>} options.getAccessTokenSilently
 * @param {() => void} [options.onUnauthorized]
 * @param {string} path - Absolute path beginning with /api/
 * @param {RequestInit} [init]
 */
export async function apiFetch(
  { getAccessTokenSilently, onUnauthorized },
  path,
  init = {},
) {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');

  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const token = await getAccessTokenSilently();
    headers.set('Authorization', `Bearer ${token}`);
  } catch (err) {
    onUnauthorized?.(err);
    throw err;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    onUnauthorized?.(new ApiError('Unauthorized', { status: 401 }));
    throw new ApiError('Unauthorized', { status: 401 });
  }

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const detail =
      (body && typeof body === 'object' && (body.detail || body.message)) ||
      response.statusText ||
      'Request failed';
    throw new ApiError(String(detail), { status: response.status, body });
  }

  return body;
}

/** Convenience: GET /api/profiles/me/ */
export function fetchMe(auth) {
  return apiFetch(auth, '/api/profiles/me/');
}
