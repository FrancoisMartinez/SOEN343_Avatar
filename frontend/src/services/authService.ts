import { api } from './apiClient';

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

const API_BASE = '/api/auth';

/**
 * Log in a user. skipAuth is true because we don't have a token yet,
 * and we don't want the global 401 interceptor to redirect during login.
 */
export async function loginUser(payload: LoginPayload): Promise<AuthResponseData> {
  return api.post<AuthResponseData>(`${API_BASE}/login`, payload, { skipAuth: true });
}

/**
 * Register a new user.
 */
export async function registerUser(payload: RegisterPayload): Promise<AuthResponseData> {
  return api.post<AuthResponseData>(`${API_BASE}/register`, payload, { skipAuth: true });
}
