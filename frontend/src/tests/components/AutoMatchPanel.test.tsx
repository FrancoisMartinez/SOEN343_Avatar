import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import AutoMatchPanel from '../../components/AutoMatchPanel';
import * as matchingService from '../../services/matchingService';
import * as bookingService from '../../services/bookingService';

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

  it('renders_formFieldsAndSubmitButton', () => {
    render(
      <AutoMatchPanel
        userLocation={{ lat: 45.5, lng: -73.5 }}
        onClose={() => {}}
        onMatchSelect={() => {}}
      />
    );

    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    expect(screen.getByText('Find Best Match')).toBeInTheDocument();
  });

  it('showsError_whenLocationIsNull', () => {
    render(
      <AutoMatchPanel
        userLocation={null}
        onClose={() => {}}
        onMatchSelect={() => {}}
      />
    );

    const submitBtn = screen.getByText('Find Best Match');
    fireEvent.click(submitBtn);

    expect(screen.getByText('Location access required for auto-match')).toBeInTheDocument();
  });

  it('showsRankedResults_afterSuccessfulMatch', async () => {
    const mockResults = [
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

    vi.mocked(matchingService.autoMatch).mockResolvedValue(mockResults);

    const { rerender } = render(
      <AutoMatchPanel
        userLocation={{ lat: 45.5, lng: -73.5 }}
        onClose={() => {}}
        onMatchSelect={() => {}}
      />
    );

    const dateInput = screen.getByDisplayValue('') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-04-08' } });

    fireEvent.click(screen.getByText('Find Best Match'));

    await waitFor(() => {
      expect(screen.getByText('Toyota')).toBeInTheDocument();
    });

    expect(screen.getByText('2.5 km')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
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

    const dateInput = screen.getByDisplayValue('') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-04-08' } });

    fireEvent.click(screen.getByText('Find Best Match'));

    await waitFor(() => {
      expect(screen.getByText('No matching cars found for your criteria.')).toBeInTheDocument();
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

    const dateInput = screen.getByDisplayValue('') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-04-08' } });

    fireEvent.click(screen.getByText('Find Best Match'));

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('createsBooking_whenBookThisClicked', async () => {
    const mockResults = [
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

    vi.mocked(matchingService.autoMatch).mockResolvedValue(mockResults);
    vi.mocked(bookingService.createBooking).mockResolvedValue({
      id: 1,
      carId: 1,
      userId: 1,
      date: '2026-04-08',
      startTime: '09:00',
      duration: 1,
      totalCost: 15.0,
      status: 'PENDING',
    });

    const onMatchSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <AutoMatchPanel
        userLocation={{ lat: 45.5, lng: -73.5 }}
        onClose={onClose}
        onMatchSelect={onMatchSelect}
      />
    );

    const dateInput = screen.getByDisplayValue('') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-04-08' } });

    fireEvent.click(screen.getByText('Find Best Match'));

    await waitFor(() => {
      expect(screen.getByText('Toyota')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Book This'));

    await waitFor(() => {
      expect(vi.mocked(bookingService.createBooking)).toHaveBeenCalledWith(
        expect.objectContaining({ carId: 1 })
      );
      expect(onMatchSelect).toHaveBeenCalledWith(expect.objectContaining({ carId: 1 }));
      expect(onClose).toHaveBeenCalled();
    });
  });
});
