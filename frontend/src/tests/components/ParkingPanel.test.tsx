// @vitest-environment happy-dom
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ParkingPanel from '../../components/ParkingPanel';

vi.mock('../../services/parkingService', () => ({
  getParkingNearby: vi.fn(),
}));

import { getParkingNearby } from '../../services/parkingService';

const mockGetParking = vi.mocked(getParkingNearby);

const MAP_CENTER = { lat: 45.5, lon: -73.6 };
const SPOTS = [
  { name: 'Lot A', lat: 45.501, lon: -73.601 },
  { name: 'Public Parking', lat: 45.502, lon: -73.602 },
];

describe('ParkingPanel', () => {
  const onParkingSpots = vi.fn();
  const onNavigateTo = vi.fn();
  const onToggle = vi.fn();

  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Show Parking button when inactive', () => {
    render(
      <ParkingPanel
        mapCenter={MAP_CENTER}
        onParkingSpots={onParkingSpots}
        onNavigateTo={onNavigateTo}
        active={false}
        onToggle={onToggle}
      />
    );

    const btn = screen.getByRole('button', { name: /show nearby parking spots/i });
    expect(btn).toBeTruthy();
    expect((btn as HTMLButtonElement).getAttribute('aria-pressed')).toBe('false');
  });

  it('renders Hide Parking button when active', () => {
    render(
      <ParkingPanel
        mapCenter={MAP_CENTER}
        onParkingSpots={onParkingSpots}
        onNavigateTo={onNavigateTo}
        active={true}
        onToggle={onToggle}
      />
    );

    const btn = screen.getByRole('button', { name: /hide parking spots/i });
    expect(btn).toBeTruthy();
    expect((btn as HTMLButtonElement).getAttribute('aria-pressed')).toBe('true');
  });

  it('calls getParkingNearby and onParkingSpots when toggled on', async () => {
    mockGetParking.mockResolvedValueOnce(SPOTS);

    render(
      <ParkingPanel
        mapCenter={MAP_CENTER}
        onParkingSpots={onParkingSpots}
        onNavigateTo={onNavigateTo}
        active={false}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(onParkingSpots).toHaveBeenCalledWith(SPOTS);
      expect(onToggle).toHaveBeenCalledWith(true);
    });
  });

  it('clears spots and toggles off when active and clicked', () => {
    render(
      <ParkingPanel
        mapCenter={MAP_CENTER}
        onParkingSpots={onParkingSpots}
        onNavigateTo={onNavigateTo}
        active={true}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    expect(onParkingSpots).toHaveBeenCalledWith([]);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('shows error when getParkingNearby fails', async () => {
    mockGetParking.mockRejectedValueOnce(new Error('Parking service unavailable'));

    render(
      <ParkingPanel
        mapCenter={MAP_CENTER}
        onParkingSpots={onParkingSpots}
        onNavigateTo={onNavigateTo}
        active={false}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });
    expect(onToggle).not.toHaveBeenCalledWith(true);
  });

  it('shows error for unknown rejection', async () => {
    mockGetParking.mockRejectedValueOnce('string error');

    render(
      <ParkingPanel
        mapCenter={MAP_CENTER}
        onParkingSpots={onParkingSpots}
        onNavigateTo={onNavigateTo}
        active={false}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });
  });
});
