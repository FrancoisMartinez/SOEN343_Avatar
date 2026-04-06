import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSystemAnalytics, getProviderRevenue, getCarUsage, calculateMetrics } from '../../services/analyticsService';

describe('analyticsService', () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = vi.fn();

  beforeEach(() => {
    // Mock sessionStorage
    const storageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
      };
    })();

    Object.defineProperty(globalThis, 'sessionStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: fetchMock,
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

  it('getSystemAnalytics fetches global analytics', async () => {
    const payload = { 
      activeUsers: 10, 
      activeCars: 5, 
      totalBookings: 100, 
      totalRevenue: 5000,
      usageByCarType: {},
      topLearners: {}
    };

    sessionStorage.setItem('token', 'token-abc');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(payload),
    });

    const result = await getSystemAnalytics();
    expect(result).toEqual(payload);
    
    expect(fetchMock).toHaveBeenCalledWith('/api/analytics/system', expect.objectContaining({
      method: 'GET',
    }));

    const lastCall = fetchMock.mock.calls[0];
    const headers = lastCall[1].headers;
    expect(headers.get('Authorization')).toBe('Bearer token-abc');
  });

  it('getProviderRevenue fetches revenue metrics', async () => {
    const payload = [{ date: '2026-03-01', totalRevenue: 150 }];

    sessionStorage.setItem('token', 'token-provider');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(payload),
    });

    const result = await getProviderRevenue(7);
    expect(result).toEqual(payload);

    expect(fetchMock).toHaveBeenCalledWith('/api/analytics/provider/7/revenue', expect.objectContaining({
      method: 'GET',
    }));
  });

  it('getCarUsage throws backend error message when request fails', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue(JSON.stringify({ error: 'Car not found' })),
      json: vi.fn().mockResolvedValue({ error: 'Car not found' }),
    });

    await expect(getCarUsage(99)).rejects.toThrow('Car not found');
  });

  it('calculateMetrics sends POST request', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    });

    await calculateMetrics();
    expect(fetchMock).toHaveBeenCalledWith('/api/analytics/calculate', expect.objectContaining({
      method: 'POST',
    }));
  });
});
