import { afterEach, describe, expect, it, vi } from 'vitest';
import { loginUser, registerUser } from '../../services/authService';

describe('authService', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: originalFetch,
    });
  });

  it('loginUser returns data on successful response', async () => {
    const payload = { email: 'john@example.com', password: 'password123' };
    const responseData = { token: 'jwt-token', userId: 1, role: 'LEARNER' };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(responseData),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    await expect(loginUser(payload)).resolves.toEqual(responseData);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });

  it('registerUser throws backend error message on failure', async () => {
    const payload = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'password123',
      roles: ['LEARNER'],
    };

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue('{"error":"Email already registered"}'),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    await expect(registerUser(payload)).rejects.toThrow('Email already registered');
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(consoleSpy).toHaveBeenCalledWith('[Auth] Registration failed (400):', 'Email already registered');
    consoleSpy.mockRestore();
  });
});
