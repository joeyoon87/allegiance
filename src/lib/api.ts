/**
 * Client-side helper for calling the separate Cloudflare Worker backend
 * (see /worker). The public site is a static export with no server of its
 * own, so every dynamic feature — forms, the estimator's distance lookup,
 * the facility portal — goes through this.
 *
 * NEXT_PUBLIC_API_BASE_URL is baked in at build time (it's a static site,
 * there's no runtime env). Defaults to a placeholder so a build without it
 * configured fails loudly in the browser console instead of silently
 * posting nowhere.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.REPLACE_ME.example";

const SESSION_STORAGE_KEY = "allegiance_portal_session";

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

export function setSessionToken(token: string) {
  window.localStorage.setItem(SESSION_STORAGE_KEY, token);
}

export function clearSessionToken() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (options.auth) {
    const token = getSessionToken();
    if (!token) throw new ApiError("Not signed in.", 401);
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? (options.body ? "POST" : "GET"),
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      (data && data.message) || `Request failed (${res.status})`,
      res.status,
      data?.fieldErrors,
    );
  }

  return data as T;
}
