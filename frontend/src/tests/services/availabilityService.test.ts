import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWeeklyAvailability,
  updateWeeklyAvailability,
} from '../../services/availabilityService';

describe('availabilityService', () => {
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

  it('fetchWeeklyAvailability returns availability data', async () => {
    const availability = {
      carId: 9,
      available: true,
      slots: [
        {
          dayOfWeek: 'MONDAY',
          startTime: '09:00',
          endTime: '12:00',
          available: true,
        },
      ],
    };

    getItemMock.mockReturnValue('token-111');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(availability),
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

    await expect(fetchWeeklyAvailability(5, 9)).resolves.toEqual(availability);
    expect(fetchMock).toHaveBeenCalledWith('/api/providers/5/cars/9/availability', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-111',
      },
    });
  });

  it('updateWeeklyAvailability throws backend error message', async () => {
    const payload = {
      slots: [
        {
          dayOfWeek: 'TUESDAY',
          startTime: '13:00',
          endTime: '15:00',
          available: true,
        },
      ],
    };

    getItemMock.mockReturnValue('token-222');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Overlapping slots' }),
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

    await expect(updateWeeklyAvailability(2, 4, payload)).rejects.toThrow('Overlapping slots');
    expect(fetchMock).toHaveBeenCalledWith('/api/providers/2/cars/4/availability', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-222',
      },
      body: JSON.stringify(payload),
    });
  });
});
