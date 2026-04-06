import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getUserProfile, updateUserProfile } from '../../services/userService';

describe('userService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Mock sessionStorage
    const storage: Record<string, string> = {
      'token': 'test-token'
    };
    globalThis.sessionStorage = <any>{
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, value) => { storage[key] = value; }),
      removeItem: vi.fn((key) => { delete storage[key]; }),
      clear: vi.fn(() => { for (const key in storage) delete storage[key]; }),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: originalFetch,
    });
  });

  it('getUserProfile returns profile when request succeeds', async () => {
    const profile = {
      id: 1,
      fullName: 'John Doe',
      role: 'LEARNER',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(profile),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const result = await getUserProfile();
    expect(result).toEqual(profile);
    
    // Check that fetch was called with the correct headers from apiClient
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toBe('/api/users/me');
    expect(callArgs[1].headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('updateUserProfile throws API error message', async () => {
    const payload = { fullName: 'Jane Doe' };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue('{"error":"Invalid profile data"}'),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    await expect(updateUserProfile(payload)).rejects.toThrow('Invalid profile data');
  });
});
