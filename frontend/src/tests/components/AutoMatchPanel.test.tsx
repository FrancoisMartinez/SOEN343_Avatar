import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import AutoMatchPanel from '../../components/AutoMatchPanel';
import * as matchingService from '../../services/matchingService';

vi.mock('../../services/matchingService');
vi.mock('../../services/bookingService');
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ userId: 1 }),
}));

describe('AutoMatchPanel', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders_headerAndMatchesListInitially', () => {
    render(
      <AutoMatchPanel
        userLocation={{ lat: 45.5, lng: -73.5 }}
        onClose={() => {}}
        onMatchSelect={() => {}}
      />
    );

    expect(screen.getByText('Auto-Match Results')).toBeTruthy();
    expect(screen.getByText('Filters')).toBeTruthy();
  });

  it('showsFilters_whenFiltersButtonClicked', () => {
    render(
      <AutoMatchPanel
        userLocation={{ lat: 45.5, lng: -73.5 }}
        onClose={() => {}}
        onMatchSelect={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Filters'));

    expect(screen.getByText('Filter Auto-Match')).toBeTruthy();
    expect(screen.getByDisplayValue('Any Transmission')).toBeTruthy();
    expect(screen.getByText('Find Best Match')).toBeTruthy();
  });

  it('showsError_whenLocationIsNull', () => {
    render(
      <AutoMatchPanel
        userLocation={null}
        onClose={() => {}}
        onMatchSelect={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Filters'));
    
    const submitBtn = screen.getByText('Find Best Match');
    fireEvent.click(submitBtn);

    expect(screen.getByText('Location access required for auto-match')).toBeTruthy();
  });

  it('showsRankedResults_afterSuccessfulMatch', async () => {
    const mockResults: matchingService.MatchResultData[] = [
      {
        carId: 1,
        makeModel: 'Toyota',
        transmissionType: 'Automatic',
        location: 'Downtown',
        latitude: 45.505,
        longitude: -73.495,
        hourlyRate: 50.0,
        instructorId: 10,
        instructorName: 'Jane Doe',
        instructorHourlyRate: 20.0,
        totalCost: 100.0,
        proximityScore: 95.0,
        budgetScore: 80.0,
        transmissionScore: 100.0,
        compositeScore: 88.0,
        distanceKm: 2.5,
      },
    ];

    vi.mocked(matchingService.autoMatch).mockResolvedValue(mockResults);

    render(
      <AutoMatchPanel
        userLocation={{ lat: 45.5, lng: -73.5 }}
        onClose={() => {}}
        onMatchSelect={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Toyota')).toBeTruthy();
    });

    expect(screen.getByText('2.5 km')).toBeTruthy();
    expect(screen.getByText('$70.00/hr')).toBeTruthy(); // 50 + 20
    expect(screen.getByText('Jane Doe')).toBeTruthy();
  });

  it('showsEmptyState_whenNoResults', async () => {
    vi.mocked(matchingService.autoMatch).mockResolvedValue([]);

    render(
      <AutoMatchPanel
        userLocation={{ lat: 45.5, lng: -73.5 }}
        onClose={() => {}}
        onMatchSelect={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No matching pairs found for your criteria.')).toBeTruthy();
    });
  });

  it('showsError_whenAutoMatchThrows', async () => {
    vi.mocked(matchingService.autoMatch).mockRejectedValue(new Error('API Error'));

    render(
      <AutoMatchPanel
        userLocation={{ lat: 45.5, lng: -73.5 }}
        onClose={() => {}}
        onMatchSelect={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeTruthy();
    });
  });
});
