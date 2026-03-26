import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDirections } from '../../services/routeService';

describe('routeService', () => {
  const originalFetch = globalThis.fetch;
  const getItemMock = vi.fn();

  afterEach(() => {
    vi.restoreAllMocks();
    getItemMock.mockReset();

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: originalFetch,
    });

    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: { getItem: getItemMock },
    });
  });

  it('getDirections returns route result with auth header', async () => {
    const mockResult = {
      polyline: [[45.5, -73.6], [45.51, -73.59]] as [number, number][],
      distanceKm: 1.2,
      durationMin: 3,
      mode: 'DRIVING' as const,
      legs: [],
    };

    getItemMock.mockReturnValue('token-nav');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResult),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: getItemMock } });

    const result = await getDirections(45.5, -73.6, 45.51, -73.59);

    expect(result).toEqual(mockResult);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/routes/directions?fromLat=45.5&fromLon=-73.6&toLat=45.51&toLon=-73.59&mode=DRIVING',
      { headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-nav' } }
    );
  });

  it('getDirections sends no auth header when no token in sessionStorage', async () => {
    const mockResult = { polyline: [], distanceKm: 0, durationMin: 0, mode: 'DRIVING' as const, legs: [] };

    getItemMock.mockReturnValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResult),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: getItemMock } });

    await getDirections(45.5, -73.6, 45.51, -73.59);

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers).not.toHaveProperty('Authorization');
  });

  it('getDirections includes mode param in URL', async () => {
    const mockResult = { polyline: [], distanceKm: 0, durationMin: 0, mode: 'BUS' as const, legs: [] };

    getItemMock.mockReturnValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResult),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: getItemMock } });

    await getDirections(45.5, -73.6, 45.51, -73.59, 'BUS');

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('mode=BUS');
  });

  it('getDirections throws with server error message when response is not ok', async () => {
    getItemMock.mockReturnValue('token-nav');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Invalid coordinates: latitude out of range' }),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: getItemMock } });

    await expect(getDirections(999, 0, 45, -73)).rejects.toThrow('Invalid coordinates: latitude out of range');
  });

  it('getDirections throws fallback message when error body has no error field', async () => {
    getItemMock.mockReturnValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: getItemMock } });

    await expect(getDirections(45, -73, 45.1, -73.1)).rejects.toThrow('Failed to fetch directions');
  });

  it('getDirections throws when json parsing fails on error response', async () => {
    getItemMock.mockReturnValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockRejectedValue(new Error('not json')),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: getItemMock } });

    await expect(getDirections(45, -73, 45.1, -73.1)).rejects.toThrow('Failed to fetch directions');
  });
});
