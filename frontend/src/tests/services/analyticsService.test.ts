import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCarUtilizationAnalytics, fetchServiceHealthAnalytics } from '../../services/analyticsService';

describe('analyticsService', () => {
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

  it('fetches global analytics without date filters', async () => {
    const payload = { carUtilizations: [], timestamp: 12345 };

    getItemMock.mockReturnValue('token-abc');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(payload),
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

    await expect(fetchCarUtilizationAnalytics()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith('/api/analytics/car-utilization', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-abc',
      },
    });
  });

  it('fetches provider analytics with date range query params', async () => {
    const payload = { carUtilizations: [], timestamp: 999 };

    getItemMock.mockReturnValue(null);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(payload),
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

    await expect(
      fetchCarUtilizationAnalytics({
        providerId: 7,
        startDate: '2026-03-01T00:00:00',
        endDate: '2026-03-31T23:59:59',
      }),
    ).resolves.toEqual(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/analytics/providers/7/car-utilization?startDate=2026-03-01T00%3A00%3A00&endDate=2026-03-31T23%3A59%3A59',
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('throws backend error message when request fails', async () => {
    getItemMock.mockReturnValue('token-err');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Invalid date range' }),
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

    await expect(fetchCarUtilizationAnalytics()).rejects.toThrow('Invalid date range');
  });

  it('fetches service health analytics', async () => {
    const payload = [
      {
        method: 'GET',
        path: '/api/analytics/car-utilization',
        requestCount: 12,
        errorCount: 1,
        avgLatencyMs: 35.4,
      },
    ];

    getItemMock.mockReturnValue('token-health');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(payload),
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

    await expect(fetchServiceHealthAnalytics()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith('/api/analytics/service-health', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-health',
      },
    });
  });
});
