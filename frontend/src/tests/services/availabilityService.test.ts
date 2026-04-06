import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWeeklyAvailability,
  updateWeeklyAvailability,
  fetchInstructorAvailability,
  updateInstructorAvailability,
} from '../../services/availabilityService';

describe('availabilityService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Mock sessionStorage
    const storage: Record<string, string> = {};
    globalThis.sessionStorage = <any>{
      getItem: vi.fn((key) => storage[key] || null),
      setItem: vi.fn((key, value) => { storage[key] = value; }),
      removeItem: vi.fn((key) => { delete storage[key]; }),
      clear: vi.fn(() => { for (const key in storage) delete storage[key]; }),
    });

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

  it('fetchWeeklyAvailability (Car) returns availability data', async () => {
    const response = {
      slots: [{ dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '12:00', available: true }],
    };

    sessionStorage.setItem('token', 'token-car');
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(response),
    } as any);

    const result = await fetchWeeklyAvailability(1, 10);
    expect(result).toEqual(response);
    expect(fetch).toHaveBeenCalledWith('/api/providers/1/cars/10/availability', expect.objectContaining({
      method: 'GET',
    }));
  });

  it('updateWeeklyAvailability (Car) sends PUT request', async () => {
    const payload = {
      slots: [{ dayOfWeek: 'TUESDAY', startTime: '10:00', endTime: '14:00', available: true }],
    };

    sessionStorage.setItem('token', 'token-car-update');
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(payload),
    } as any);

    await updateWeeklyAvailability(1, 10, payload);
    expect(fetch).toHaveBeenCalledWith('/api/providers/1/cars/10/availability', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify(payload),
    }));
  });

  it('fetchInstructorAvailability returns availability data', async () => {
    const response = {
      slots: [{ dayOfWeek: 'WEDNESDAY', startTime: '14:00', endTime: '18:00', available: true }],
    };

    sessionStorage.setItem('token', 'token-instr');
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(response),
    } as any);

    const result = await fetchInstructorAvailability(5);
    expect(result).toEqual(response);
    expect(fetch).toHaveBeenCalledWith('/api/instructors/5/availability', expect.objectContaining({
      method: 'GET',
    }));
    
    const lastCall = vi.mocked(fetch).mock.calls[0];
    const headers = new Headers(lastCall[1]?.headers);
    expect(headers.get('Authorization')).toBe('Bearer token-instr');
  });

  it('updateInstructorAvailability throws backend error message', async () => {
    const payload = {
      slots: [{ dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '12:00', available: true }],
    };

    sessionStorage.setItem('token', 'token-err');
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue(JSON.stringify({ error: 'Overlapping slots' })),
    } as any);

    await expect(updateInstructorAvailability(2, payload)).rejects.toThrow('Overlapping slots');
  });
});
