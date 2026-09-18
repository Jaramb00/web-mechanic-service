/**
 * HTTP klijent prema backendu.
 *
 * Token se NE dira iz JavaScripta — stiže i odlazi kao HttpOnly cookie, pa je
 * `credentials: 'include'` sve što treba. Zauzvrat je potreban CSRF token, koji
 * backend postavlja u čitljiv XSRF-TOKEN cookie i očekuje natrag u zaglavlju.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/** Greška s porukom koju je sigurno pokazati korisniku. */
export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, title: string, detail: string, fieldErrors: Record<string, string> = {}) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.title = title;
    this.fieldErrors = fieldErrors;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

let csrfReady: Promise<void> | null = null;

/**
 * Spring postavlja CSRF cookie tek kad se tokenu pristupi, pa ga prvi zahtjev
 * mora zatražiti. Poziv se pamti da se ne ponavlja pri svakoj mutaciji.
 */
async function ensureCsrfToken(): Promise<void> {
  if (readCookie('XSRF-TOKEN')) return;
  csrfReady ??= fetch(`${BASE_URL}/api/auth/csrf`, { credentials: 'include' })
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      csrfReady = null;
    });
  await csrfReady;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (method !== 'GET') {
    await ensureCsrfToken();
    const token = readCookie('XSRF-TOKEN');
    if (token) headers['X-XSRF-TOKEN'] = token;
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    // Mrežni ispad nema HTTP status; korisniku treba poruka koju razumije.
    throw new ApiError(0, 'Nema veze s poslužiteljem', 'Provjerite internetsku vezu i pokušajte ponovno.');
  }

  if (response.status === 204) return undefined as T;

  const isJson = response.headers.get('content-type')?.includes('json') ?? false;
  const payload: unknown = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw toApiError(response.status, payload);
  }
  return payload as T;
}

type ProblemDetail = {
  title?: string;
  detail?: string;
  fields?: Record<string, string>;
};

function toApiError(status: number, payload: unknown): ApiError {
  const problem = (payload ?? {}) as ProblemDetail;
  const fallback =
    status >= 500
      ? 'Dogodila se greška na poslužitelju. Pokušajte ponovno za koji trenutak.'
      : 'Zahtjev nije mogao biti obrađen.';
  return new ApiError(
    status,
    problem.title ?? 'Greška',
    problem.detail ?? fallback,
    problem.fields ?? {},
  );
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
