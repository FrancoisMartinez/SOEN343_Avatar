import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createVehicle,
  deleteVehicle,
  fetchVehicles,
  updateVehicle,
} from '../../services/vehicleService';

describe('vehicleService', () => {
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

  it('fetchVehicles returns cars with auth header', async () => {
    const cars = [
      {
        id: 1,
        makeModel: 'Toyota Corolla',
        transmissionType: 'AUTOMATIC',
        location: 'Montreal',
        available: true,
        hourlyRate: 20,
      },
    ];

    getItemMock.mockReturnValue('token-123');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(cars),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: { getItem: getItemMock },
    });

    await expect(fetchVehicles(7)).resolves.toEqual(cars);
    expect(fetchMock).toHaveBeenCalledWith('/api/providers/7/cars', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-123',
      },
    });
  });

  it('createVehicle throws when backend fails', async () => {
    const payload = {
      makeModel: 'Honda Civic',
      transmissionType: 'MANUAL',
      location: 'Laval',
      available: true,
      hourlyRate: 22,
    };

    getItemMock.mockReturnValue(null);
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: { getItem: getItemMock },
    });

    await expect(createVehicle(3, payload)).rejects.toThrow('Failed to create vehicle');
    expect(fetchMock).toHaveBeenCalledWith('/api/providers/3/cars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  });

  it('updateVehicle sends PUT and returns updated car', async () => {
    const payload = {
      makeModel: 'Tesla Model 3',
      transmissionType: 'AUTOMATIC',
      location: 'Montreal',
      available: false,
      hourlyRate: 40,
    };

    const updated = { id: 9, ...payload };

    getItemMock.mockReturnValue('token-xyz');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(updated),
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: { getItem: getItemMock },
    });

    await expect(updateVehicle(5, 9, payload)).resolves.toEqual(updated);
    expect(fetchMock).toHaveBeenCalledWith('/api/providers/5/cars/9', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-xyz',
      },
      body: JSON.stringify(payload),
    });
  });

  it('deleteVehicle throws when response is not ok', async () => {
    getItemMock.mockReturnValue('token-del');
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
    });

    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: { getItem: getItemMock },
    });

    await expect(deleteVehicle(2, 8)).rejects.toThrow('Failed to delete vehicle');
    expect(fetchMock).toHaveBeenCalledWith('/api/providers/2/cars/8', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-del',
      },
    });
  });
});
