const API_BASE = '/api/auth';

export interface AuthResponseData {
  token: string;
  userId: number;
  role: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: string[];
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  const text = await res.text().catch(() => '');
  try {
    const body = JSON.parse(text);
    return body.error || body.message || fallback;
  } catch {
    return text.trim() || fallback;
  }
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponseData> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await extractErrorMessage(res, 'Login failed');
    console.error(`[Auth] Login failed (${res.status}):`, message);
    throw new Error(message);
  }

  return res.json();
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponseData> {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await extractErrorMessage(res, 'Registration failed');
    console.error(`[Auth] Registration failed (${res.status}):`, message);
    throw new Error(message);
  }

  return res.json();
}
