import type { RootState } from "@/store";

/**
 * Returns headers object with Authorization Bearer token if available.
 * Use in API calls: { ...getAuthHeaders(getState()), 'Content-Type': 'application/json' }
 */
export function getAuthHeaders(getState: () => RootState): HeadersInit {
  const state = getState();
  const token = state.auth.token;
  const headers: HeadersInit = {};
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Helper to build fetch options with auth token from getState.
 * Usage: fetch(url, withAuth(getState(), { method: 'GET' }))
 */
export function withAuth(
  getState: () => RootState,
  init: RequestInit = {},
): RequestInit {
  const state = getState();
  const token = state.auth.token;
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return { ...init, headers };
}
