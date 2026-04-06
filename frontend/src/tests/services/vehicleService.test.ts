import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createVehicle,
  deleteVehicle,
  fetchProviderVehicles,
  updateVehicle,
} from '../../services/vehicleService';

describe('vehicleService', () => {
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

  it('fetchProviderVehicles returns cars with auth header', async () => {
    const cars = [
      {
        id: 1,
        name: 'Toyota Corolla',
        type: 'SEDAN',
        latitude: 45,
        longitude: -73,
        pricePerHour: 20,
        providerId: 7,
        status: 'AVAILABLE'
      },
    ];

    sessionStorage.setItem('token', 'token-123');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(cars),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const result = await fetchProviderVehicles(7);
    expect(result).toEqual(cars);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/cars/provider/7');
    expect(options.headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('createVehicle throws when backend fails', async () => {
    const payload = {
      name: 'Honda Civic',
      type: 'SEDAN',
      latitude: 45,
      longitude: -73,
      pricePerHour: 22,
      providerId: 3
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue('{"error":"Failed to create vehicle"}'),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    await expect(createVehicle(payload)).rejects.toThrow('Failed to create vehicle');
  });

  it('updateVehicle sends PUT and returns updated car', async () => {
    const payload = {
      name: 'Tesla Model 3',
      pricePerHour: 40,
    };

    const updated = { id: 9, ...payload };

    sessionStorage.setItem('token', 'token-xyz');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(updated),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    const result = await updateVehicle(9, payload);
    expect(result).toEqual(updated);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/cars/9');
    expect(options.method).toBe('PUT');
  });

  it('deleteVehicle throws when response is not ok', async () => {
    sessionStorage.setItem('token', 'token-del');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('{"error":"Internal Server Error"}'),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    await expect(deleteVehicle(8)).rejects.toThrow('Internal Server Error');
  });
});
