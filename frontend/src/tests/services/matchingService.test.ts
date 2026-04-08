import { afterEach, describe, expect, it, vi } from 'vitest';
import { autoMatch, AutoMatchRequest } from '../../services/matchingService';

describe('matchingService', () => {
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

  it('autoMatch_validRequest_returnsRankedResults', async () => {
    const results = [
      {
        carId: 1,
        makeModel: 'Toyota',
        transmissionType: 'Automatic',
        location: 'Downtown',
        latitude: 45.505,
        longitude: -73.495,
        hourlyRate: 50.0,
        totalCost: 100.0,
        proximityScore: 95.0,
        budgetScore: 80.0,
        transmissionScore: 100.0,
        compositeScore: 88.0,
        distanceKm: 2.5,
      },
    ];

    getItemMock.mockReturnValue('token-123');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(results),
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

    const request: AutoMatchRequest = {
      learnerId: 1,
      date: '2026-04-08',
      startTime: '14:30',
      duration: 2,
      learnerLat: 45.5,
      learnerLng: -73.5,
      transmissionPreference: 'Automatic',
    };

    await expect(autoMatch(request)).resolves.toEqual(results);
    expect(fetchMock).toHaveBeenCalledWith('/api/matchings/auto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-123',
      },
      body: JSON.stringify(request),
    });
  });

  it('autoMatch_learnerNotFound_throwsError', async () => {
    getItemMock.mockReturnValue('token-123');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Learner not found' }),
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

    const request: AutoMatchRequest = {
      learnerId: 99,
      date: '2026-04-08',
      startTime: '14:30',
      duration: 2,
      learnerLat: 45.5,
      learnerLng: -73.5,
    };

    await expect(autoMatch(request)).rejects.toThrow('Learner not found');
  });

  it('autoMatch_networkFailure_throwsGenericError', async () => {
    getItemMock.mockReturnValue('token-123');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockRejectedValue(new Error('Parse error')),
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

    const request: AutoMatchRequest = {
      learnerId: 1,
      date: '2026-04-08',
      startTime: '14:30',
      duration: 2,
      learnerLat: 45.5,
      learnerLng: -73.5,
    };

    await expect(autoMatch(request)).rejects.toThrow('Auto-match failed');
  });

  it('autoMatch_includesAuthHeader_whenTokenPresent', async () => {
    getItemMock.mockReturnValue('token-xyz');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
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

    const request: AutoMatchRequest = {
      learnerId: 1,
      date: '2026-04-08',
      startTime: '14:30',
      duration: 2,
      learnerLat: 45.5,
      learnerLng: -73.5,
    };

    await autoMatch(request);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/matchings/auto',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-xyz',
        }),
      })
    );
  });
});
