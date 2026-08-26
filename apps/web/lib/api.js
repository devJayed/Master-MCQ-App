const API_URL = process.env.NEXT_API_URL || 'http://localhost:5000/api';

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
  if (response.status === 401 && typeof window !== 'undefined' && !path.startsWith('/auth/')) {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refreshed.ok) response = await request();
  }
  if (!response.ok) throw new Error((await response.json()).message || 'Something went wrong');
  return response.status === 204 ? null : response.json();
}
