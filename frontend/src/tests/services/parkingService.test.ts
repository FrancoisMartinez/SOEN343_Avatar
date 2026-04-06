import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getParkingNearby } from '../../services/parkingService';

describe('parkingService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Mock sessionStorage
    const storage: Record<string, string> = {};
    globalThis.sessionStorage = {
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, value) => { storage[key] = value; }),
      removeItem: vi.fn((key) => { delete storage[key]; }),
      clear: vi.fn(() => { for (const key in storage) delete storage[key]; }),
    } as any;

    globalThis.fetch = vi.fn() as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: originalFetch,
    });
  });

  it('getParkingNearby returns spots with auth header', async () => {
    const mockSpots = [
      { name: 'Lot A', lat: 45.5, lon: -73.6 },
      { name: 'Public Parking', lat: 45.51, lon: -73.59 },
    ];

    sessionStorage.setItem('token', 'token-park');
    (fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockSpots),
    } as any);

    const result = await getParkingNearby(45.5, -73.6, 800);

    expect(result).toEqual(mockSpots);
    const lastCall = (fetch as any).mock.calls[0];
    const headers = new Headers(lastCall[1]?.headers);
    expect(headers.get('Authorization')).toBe('Bearer token-park');
  });

  it('getParkingNearby uses default radius 800 when omitted', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([]),
    } as any);

    await getParkingNearby(45.5, -73.6);

    const [url] = (fetch as any).mock.calls[0];
    expect(url).toContain('radius=800');
  });

  it('getParkingNearby sends no auth header when no token', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([]),
    } as any);

    await getParkingNearby(45.5, -73.6, 500);

    const [, options] = (fetch as any).mock.calls[0];
    const headers = new Headers(options?.headers);
    expect(headers.get('Authorization')).toBeNull();
  });

  it('getParkingNearby throws with server error message when response is not ok', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue(JSON.stringify({ error: 'Parking service is temporarily unavailable' })),
    } as any);

    await expect(getParkingNearby(45.5, -73.6, 800)).rejects.toThrow('Parking service is temporarily unavailable');
  });

  it('getParkingNearby throws fallback message when error body has no error field', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('{}'),
    } as any);

    await expect(getParkingNearby(45.5, -73.6, 800)).rejects.toThrow('Request failed');
  });

  it('getParkingNearby throws fallback message when json parsing fails on error response', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(new Error('not json')),
    } as any);

    await expect(getParkingNearby(45.5, -73.6, 800)).rejects.toThrow('Request failed');
  });
});
