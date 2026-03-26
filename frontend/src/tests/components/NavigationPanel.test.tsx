// @vitest-environment happy-dom
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import NavigationPanel from '../../components/NavigationPanel';

vi.mock('../../services/geocodingService', () => ({
  geocodeAddress: vi.fn(),
}));

vi.mock('../../services/routeService', () => ({
  getDirections: vi.fn(),
}));

import { geocodeAddress } from '../../services/geocodingService';
import { getDirections } from '../../services/routeService';

const mockGeocode = vi.mocked(geocodeAddress);
const mockGetDirections = vi.mocked(getDirections);

const PLACE_A = { lat: 45.5, lon: -73.6, displayName: 'Montreal, QC' };
const PLACE_B = { lat: 45.51, lon: -73.59, displayName: 'Laval, QC' };

const DRIVING_RESULT = {
  polyline: [[45.5, -73.6], [45.51, -73.59]] as [number, number][],
  distanceKm: 1.2,
  durationMin: 3,
  mode: 'DRIVING' as const,
  legs: [],
};

const BUS_RESULT = {
  polyline: [[45.5, -73.6], [45.51, -73.59]] as [number, number][],
  distanceKm: 1.5,
  durationMin: 17,
  mode: 'BUS' as const,
  legs: [
    { type: 'WALK' as const, lineLabel: null, transportMode: null, fromStop: null, toStop: null, durationMin: 5, polyline: [] },
    { type: 'TRANSIT' as const, lineLabel: '24', transportMode: 'bus', fromStop: 'Bus Stop Guy', toStop: 'Berri-UQAM', durationMin: 12, polyline: [] },
  ],
};

describe('NavigationPanel', () => {
  const onRoute = vi.fn();
  const onClear = vi.fn();

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Disable auto-GPS so it doesn't interfere
    Object.defineProperty(window.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    });
  });

  it('renders From/To fields and a disabled Get Directions button', () => {
    render(<NavigationPanel onRoute={onRoute} onClear={onClear} />);

    expect(screen.getByLabelText('From')).toBeTruthy();
    expect(screen.getByLabelText('To')).toBeTruthy();
    const btn = screen.getByRole('button', { name: /get directions/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders mode selector with all four transport modes', () => {
    render(<NavigationPanel onRoute={onRoute} onClear={onClear} />);

    expect(screen.getByTitle('Drive')).toBeTruthy();
    expect(screen.getByTitle('Bus')).toBeTruthy();
    expect(screen.getByTitle('Bike')).toBeTruthy();
    expect(screen.getByTitle('Walk')).toBeTruthy();
  });

  it('Drive mode is active by default', () => {
    render(<NavigationPanel onRoute={onRoute} onClear={onClear} />);

    const driveBtn = screen.getByTitle('Drive');
    expect(driveBtn.getAttribute('aria-pressed')).toBe('true');
    expect(driveBtn.classList.contains('nav-panel__mode-btn--active')).toBe(true);
  });

  it('clicking Bus mode makes it active', () => {
    render(<NavigationPanel onRoute={onRoute} onClear={onClear} />);

    fireEvent.click(screen.getByTitle('Bus'));

    const busBtn = screen.getByTitle('Bus');
    expect(busBtn.getAttribute('aria-pressed')).toBe('true');
    const driveBtn = screen.getByTitle('Drive');
    expect(driveBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('shows error when geocoding returns no results', async () => {
    mockGeocode.mockResolvedValueOnce([]);

    render(<NavigationPanel onRoute={onRoute} onClear={onClear} />);
    const toInput = screen.getByLabelText('To');
    fireEvent.change(toInput, { target: { value: 'Nowhere' } });
    fireEvent.blur(toInput);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });
  });

  it('shows error when geocoding throws', async () => {
    mockGeocode.mockRejectedValueOnce(new Error('Network error'));

    render(<NavigationPanel onRoute={onRoute} onClear={onClear} />);
    const toInput = screen.getByLabelText('To');
    fireEvent.change(toInput, { target: { value: 'Bad Place' } });
    fireEvent.blur(toInput);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });
  });

  it('enables button and calls onRoute when directions succeed', async () => {
    mockGeocode.mockResolvedValueOnce([PLACE_A]).mockResolvedValueOnce([PLACE_B]);
    mockGetDirections.mockResolvedValueOnce(DRIVING_RESULT);

    render(<NavigationPanel onRoute={onRoute} onClear={onClear} />);

    fireEvent.change(screen.getByLabelText('From'), { target: { value: 'Montreal' } });
    fireEvent.blur(screen.getByLabelText('From'));
    await waitFor(() => expect(mockGeocode).toHaveBeenCalledWith('Montreal'));

    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'Laval' } });
    fireEvent.blur(screen.getByLabelText('To'));
    await waitFor(() => expect(mockGeocode).toHaveBeenCalledTimes(2));

    const btn = screen.getByRole('button', { name: /get directions/i });
    expect((btn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(btn);

    await waitFor(() => {
      expect(onRoute).toHaveBeenCalledWith([[45.5, -73.6], [45.51, -73.59]], 1.2, 3);
    });
  });

  it('passes selected mode to getDirections', async () => {
    mockGeocode.mockResolvedValueOnce([PLACE_A]).mockResolvedValueOnce([PLACE_B]);
    mockGetDirections.mockResolvedValueOnce(BUS_RESULT);

    render(<NavigationPanel onRoute={onRoute} onClear={onClear} />);

    fireEvent.click(screen.getByTitle('Bus'));

    fireEvent.change(screen.getByLabelText('From'), { target: { value: 'Montreal' } });
    fireEvent.blur(screen.getByLabelText('From'));
    await waitFor(() => expect(mockGeocode).toHaveBeenCalledWith('Montreal'));

    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'Laval' } });
    fireEvent.blur(screen.getByLabelText('To'));
    await waitFor(() => expect(mockGeocode).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole('button', { name: /get directions/i }));

    await waitFor(() => {
      expect(mockGetDirections).toHaveBeenCalledWith(
        PLACE_A.lat, PLACE_A.lon, PLACE_B.lat, PLACE_B.lon, 'BUS'
      );
    });
  });

  it('shows journey legs for bus route', async () => {
    mockGeocode.mockResolvedValueOnce([PLACE_A]).mockResolvedValueOnce([PLACE_B]);
    mockGetDirections.mockResolvedValueOnce(BUS_RESULT);

    render(<NavigationPanel onRoute={onRoute} onClear={onClear} />);

    fireEvent.click(screen.getByTitle('Bus'));

    fireEvent.change(screen.getByLabelText('From'), { target: { value: 'Montreal' } });
    fireEvent.blur(screen.getByLabelText('From'));
    await waitFor(() => expect(mockGeocode).toHaveBeenCalledWith('Montreal'));

    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'Laval' } });
    fireEvent.blur(screen.getByLabelText('To'));
    await waitFor(() => expect(mockGeocode).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole('button', { name: /get directions/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Journey steps')).toBeTruthy();
    });

    expect(screen.getByText(/Walk 5 min/)).toBeTruthy();
    expect(screen.getByText(/Bus Stop Guy.*Berri-UQAM/)).toBeTruthy();
  });

  it('shows error when getDirections fails', async () => {
    mockGeocode.mockResolvedValueOnce([PLACE_A]).mockResolvedValueOnce([PLACE_B]);
    mockGetDirections.mockRejectedValueOnce(new Error('No route found'));

    render(<NavigationPanel onRoute={onRoute} onClear={onClear} />);

    fireEvent.change(screen.getByLabelText('From'), { target: { value: 'Montreal' } });
    fireEvent.blur(screen.getByLabelText('From'));
    await waitFor(() => expect(mockGeocode).toHaveBeenCalledWith('Montreal'));

    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'Laval' } });
    fireEvent.blur(screen.getByLabelText('To'));
    await waitFor(() => expect(mockGeocode).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole('button', { name: /get directions/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });
  });

  it('clears route info when clear button is clicked', async () => {
    mockGeocode.mockResolvedValue([PLACE_A]);
    mockGetDirections.mockResolvedValueOnce({
      polyline: [[45.5, -73.6]],
      distanceKm: 0.5,
      durationMin: 1,
      mode: 'DRIVING' as const,
      legs: [],
    });

    render(<NavigationPanel onRoute={onRoute} onClear={onClear} />);

    fireEvent.change(screen.getByLabelText('From'), { target: { value: 'A' } });
    fireEvent.blur(screen.getByLabelText('From'));
    await waitFor(() => expect(mockGeocode).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText('To'), { target: { value: 'B' } });
    fireEvent.blur(screen.getByLabelText('To'));
    await waitFor(() => expect(mockGeocode).toHaveBeenCalledTimes(2));

    fireEvent.click(screen.getByRole('button', { name: /get directions/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Clear route' })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Clear route' }));
    expect(onClear).toHaveBeenCalled();
  });

  it('clears fromCoords and routeInfo when From input changes', () => {
    render(<NavigationPanel onRoute={onRoute} onClear={onClear} />);
    const fromInput = screen.getByLabelText('From');
    fireEvent.change(fromInput, { target: { value: 'New value' } });
    // Button should still be disabled (coords cleared)
    expect((screen.getByRole('button', { name: /get directions/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('geocodes on Enter keydown', async () => {
    mockGeocode.mockResolvedValueOnce([PLACE_A]);

    render(<NavigationPanel onRoute={onRoute} onClear={onClear} />);
    const fromInput = screen.getByLabelText('From');
    fireEvent.change(fromInput, { target: { value: 'Montreal' } });
    fireEvent.keyDown(fromInput, { key: 'Enter' });

    await waitFor(() => expect(mockGeocode).toHaveBeenCalledWith('Montreal'));
  });
});
