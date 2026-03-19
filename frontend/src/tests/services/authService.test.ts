import { afterEach, describe, expect, it, vi } from 'vitest';
import { loginUser, registerUser } from '../../services/authService';

describe('authService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loginUser returns data on successful response', async () => {
    const payload = { email: 'john@example.com', password: 'password123' };
    const responseData = { token: 'jwt-token', userId: 1, role: 'LEARNER' };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(responseData),
    });

    vi.stubGlobal('fetch', fetchMock);

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

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Email already registered' }),
    });

    vi.stubGlobal('fetch', fetchMock);

    await expect(registerUser(payload)).rejects.toThrow('Email already registered');
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });
});
