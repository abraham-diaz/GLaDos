import { getToken } from './client';

export async function login(username: string, password: string): Promise<{ token: string }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Error de autenticacion');
  }

  return data;
}

export async function verify(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  try {
    const res = await fetch('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return true; // Network error — assume valid (offline mode)
  }
}
