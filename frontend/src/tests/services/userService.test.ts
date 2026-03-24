import { afterEach, describe, expect, it, vi } from 'vitest';
import { getUserProfile, updateUserProfile } from '../../services/userService';

describe('userService', () => {
  const originalFetch = globalThis.fetch;

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
      email: 'john@example.com',
      licenseNumber: null,
      licenseIssueDate: null,
      licenseRegion: null,
      role: 'LEARNER',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(profile),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    await expect(getUserProfile('token-123')).resolves.toEqual(profile);
    expect(fetchMock).toHaveBeenCalledWith('/api/users/me', {
      headers: { Authorization: 'Bearer token-123' },
    });
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

    await expect(updateUserProfile('token-abc', payload)).rejects.toThrow('Invalid profile data');
    expect(fetchMock).toHaveBeenCalledWith('/api/users/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-abc',
      },
      body: JSON.stringify(payload),
    });
  });
});
