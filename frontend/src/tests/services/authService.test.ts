import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loginUser, registerUser } from '../../services/authService';

describe('authService', () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = vi.fn();

  beforeEach(() => {
    // Mock sessionStorage
    const storageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
      };
    })();

    Object.defineProperty(globalThis, 'sessionStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });
  });

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

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(responseData),
      text: vi.fn().mockResolvedValue(JSON.stringify(responseData)),
    });

    const result = await loginUser(payload);
    expect(result).toEqual(responseData);
    
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }));

    const lastCall = fetchMock.mock.calls[0];
    const headers = lastCall[1].headers;
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('registerUser throws backend error message on failure', async () => {
    const payload = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      password: 'password123',
      roles: ['LEARNER'],
    };

    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue(JSON.stringify({ error: 'Email already registered' })),
      json: vi.fn().mockResolvedValue({ error: 'Email already registered' }),
    });

    await expect(registerUser(payload)).rejects.toThrow('Email already registered');
    
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }));
  });
});
