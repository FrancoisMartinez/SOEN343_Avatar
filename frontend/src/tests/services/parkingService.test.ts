import { afterEach, describe, expect, it, vi } from 'vitest';
import { getParkingNearby } from '../../services/parkingService';

describe('parkingService', () => {
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

  it('getParkingNearby returns spots with auth header', async () => {
    const mockSpots = [
      { name: 'Lot A', lat: 45.5, lon: -73.6 },
      { name: 'Public Parking', lat: 45.51, lon: -73.59 },
    ];

    getItemMock.mockReturnValue('token-park');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockSpots),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: getItemMock } });

    const result = await getParkingNearby(45.5, -73.6, 800);

    expect(result).toEqual(mockSpots);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/routes/parking?lat=45.5&lon=-73.6&radius=800',
      { headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-park' } }
    );
  });

  it('getParkingNearby uses default radius 800 when omitted', async () => {
    getItemMock.mockReturnValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: getItemMock } });

    await getParkingNearby(45.5, -73.6);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain('radius=800');
  });

  it('getParkingNearby sends no auth header when no token', async () => {
    getItemMock.mockReturnValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: getItemMock } });

    await getParkingNearby(45.5, -73.6, 500);

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers).not.toHaveProperty('Authorization');
  });

  it('getParkingNearby throws with server error message when response is not ok', async () => {
    getItemMock.mockReturnValue('token-park');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Parking service is temporarily unavailable' }),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: getItemMock } });

    await expect(getParkingNearby(45.5, -73.6, 800)).rejects.toThrow('Parking service is temporarily unavailable');
  });

  it('getParkingNearby throws fallback message when error body has no error field', async () => {
    getItemMock.mockReturnValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: getItemMock } });

    await expect(getParkingNearby(45.5, -73.6, 800)).rejects.toThrow('Failed to fetch parking spots');
  });

  it('getParkingNearby throws fallback message when json parsing fails on error response', async () => {
    getItemMock.mockReturnValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockRejectedValue(new Error('not json')),
    });

    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: getItemMock } });

    await expect(getParkingNearby(45.5, -73.6, 800)).rejects.toThrow('Failed to fetch parking spots');
  });
});
