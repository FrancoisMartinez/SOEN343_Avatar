import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDirections } from '../../services/routeService';

describe('routeService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Mock sessionStorage
    const storage: Record<string, string> = {};
    globalThis.sessionStorage = <any>{
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, value) => { storage[key] = value; }),
      removeItem: vi.fn((key) => { delete storage[key]; }),
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

  it('getDirections returns route result with auth header', async () => {
    const mockResult = {
      polyline: [[45.5, -73.6], [45.51, -73.59]],
      distanceKm: 1.2,
      durationMin: 3,
      mode: 'DRIVING',
      legs: [],
    };

    sessionStorage.setItem('token', 'token-nav');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockResult),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });

    const result = await getDirections(45.5, -73.6, 45.51, -73.59);

    expect(result).toEqual(mockResult);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('fromLat=45.5');
    expect(url).toContain('fromLon=-73.6');
    expect(url).toContain('mode=DRIVING');
    expect(options.headers.get('Authorization')).toBe('Bearer token-nav');
  });

  it('getDirections sends no auth header when no token in sessionStorage', async () => {
    const mockResult = { polyline: [], distanceKm: 0, durationMin: 0, mode: 'DRIVING', legs: [] };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockResult),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });

    await getDirections(45.5, -73.6, 45.51, -73.59);

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.get('Authorization')).toBeNull();
  });

  it('getDirections includes mode param in URL', async () => {
    const mockResult = { polyline: [], distanceKm: 0, durationMin: 0, mode: 'BUS', legs: [] };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockResult),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });

    await getDirections(45.5, -73.6, 45.51, -73.59, 'BUS');

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('mode=BUS');
  });

  it('getDirections throws with server error message when response is not ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue('{"error":"Invalid coordinates"}'),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });

    await expect(getDirections(999, 0, 45, -73)).rejects.toThrow('Invalid coordinates');
  });
});
