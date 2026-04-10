import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { 
  getSystemAnalytics, 
  getProviderRevenue, 
  calculateMetrics, 
  getDashboardAnalytics,
  fetchCarUtilizationAnalytics,
  fetchServiceHealthAnalytics
} from '../../services/analyticsService';

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

  it('getDashboardAnalytics fetches personalized analytics', async () => {
    const payload = { stats: {}, charts: {} };
    sessionStorage.setItem('token', 'token-abc');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(payload),
    });

    const result = await getDashboardAnalytics();
    expect(result).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith('/api/analytics/dashboard', expect.any(Object));
  });

  it('fetchCarUtilizationAnalytics fetches global analytics without date filters', async () => {
    const payload = { carUtilizations: [], timestamp: 12345 };
    sessionStorage.setItem('token', 'token-abc');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(payload),
    });

    const result = await fetchCarUtilizationAnalytics();
    expect(result).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith('/api/analytics/car-utilization', expect.any(Object));
  });

  it('fetchServiceHealthAnalytics fetches technical health metrics', async () => {
    const payload = [{ method: 'GET', path: '/api/test', requestCount: 1, errorCount: 0, avgLatencyMs: 10 }];
    sessionStorage.setItem('token', 'token-abc');
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(payload),
    });

    const result = await fetchServiceHealthAnalytics();
    expect(result).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith('/api/analytics/service-health', expect.any(Object));
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
    expect(fetchMock).toHaveBeenCalledWith('/api/analytics/system', expect.any(Object));
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
    expect(fetchMock).toHaveBeenCalledWith('/api/analytics/provider/7/revenue', expect.any(Object));
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
