export const API_URL =
  process.env.NEXT_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://master-mcq-app-api.vercel.app/api'
    : 'http://localhost:5000/api');

let refreshPromise;

const refreshSession = () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    }).finally(() => {
      refreshPromise = undefined;
    });
  }
  return refreshPromise;
};

export async function api(path, options = {}) {
  const request = () =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },  
      credentials: 'include',
      cache: 'no-store',
    });
  let response = await request();
  const unauthenticatedAuthPaths = new Set([
    '/auth/login',
    '/auth/login/mfa',
    '/auth/register',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-email',
    '/auth/resend-verification',
  ]);
  const canRefresh = !unauthenticatedAuthPaths.has(path);
  if (response.status === 401 && typeof window !== 'undefined' && canRefresh) {
    const refreshed = await refreshSession();
    if (refreshed.ok) response = await request();
  }
  if (!response.ok) throw new Error((await response.json()).message || 'Something went wrong');
  return response.status === 204 ? null : response.json();
}
