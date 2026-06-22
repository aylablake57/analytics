// ── Auth helpers — client-side only ('use client' callers) ───────────────────
// Backend: Django REST Framework + simplejwt
// Endpoint: POST /api/auth/login/
// Response: { access: string, refresh: string }  (JWT, Bearer scheme)

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

const KEY_ACCESS  = 'auth_token';
const KEY_REFRESH = 'refresh_token';
const COOKIE_NAME = 'ict_session';

// ── login ────────────────────────────────────────────────────────────────────
// Calls the backend, stores tokens, sets the middleware cookie.
// Throws with a user-facing message on any failure.
export async function login(
  username: string,
  password: string,
  remember: boolean,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new Error('Unable to reach the server. Check your connection.');
  }

  let data: Record<string, unknown>;
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    throw new Error(
      res.ok
        ? 'Server returned an unexpected response format.'
        : `Server error (${res.status}). Make sure the backend is running and NEXT_PUBLIC_API_BASE_URL is set correctly.`,
    );
  }
  data = await res.json();

  if (!res.ok) {
    // DRF returns { detail: "..." } on 401
    throw new Error((data?.detail as string) ?? 'Login failed. Please try again.');
  }

  const { access, refresh } = data as { access: string; refresh: string };

  localStorage.setItem(KEY_ACCESS, access);
  localStorage.setItem(KEY_REFRESH, refresh);

  // Cookie for middleware route protection.
  // max-age mirrors the refresh token TTL (7 days) when "remember me" is on,
  // otherwise expires with the browser session.
  const maxAge = remember ? `; max-age=${7 * 24 * 3600}` : '';
  document.cookie = `${COOKIE_NAME}=${access}; path=/${maxAge}`;
}

// ── logout ───────────────────────────────────────────────────────────────────
export function logout(): void {
  localStorage.removeItem(KEY_ACCESS);
  localStorage.removeItem(KEY_REFRESH);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

// ── getToken ─────────────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY_ACCESS);
}

// ── isAuthenticated ──────────────────────────────────────────────────────────
// Checks the access token exists and hasn't expired (client-side clock).
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
