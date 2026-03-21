import { afterEach, describe, expect, it, vi } from 'vitest';
import { geocodeAddress, reverseGeocode } from '../../services/geocodingService';

describe('geocodingService', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: originalFetch,
    });
  });

  it('geocodeAddress maps API response to short display names', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          lat: '45.5017',
          lon: '-73.5673',
          display_name: '123 Main St, Montreal, Quebec, Canada',
          address: { house_number: '123', road: 'Main St', city: 'Montreal' },
        },
      ]),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    await expect(geocodeAddress('123 Main St')).resolves.toEqual([
      { lat: 45.5017, lon: -73.5673, displayName: '123 Main St, Montreal' },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reverseGeocode falls back to coordinates when no address is returned', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ lat: '45.5', lon: '-73.5' }),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    await expect(reverseGeocode(45.5, -73.5)).resolves.toBe('45.50000, -73.50000');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('geocodeAddress throws on non-ok response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    await expect(geocodeAddress('fail')).rejects.toThrow('Geocoding request failed');
  });
});
