import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, afterEach } from 'vitest';
import ParkingPanel from '../../components/ParkingPanel';
import * as parkingService from '../../services/parkingService';

vi.mock('../../services/parkingService');

const mockGetParking = vi.mocked(parkingService.getParkingNearby);

const mockSpots = [
  { id: 1, name: 'Spot A', lat: 45.5, lon: -73.6, capacity: 10, free: 5 },
  { id: 2, name: 'Spot B', lat: 45.51, lon: -73.61, capacity: 20, free: 0 },
];

describe('ParkingPanel', () => {
  const onParkingSpots = vi.fn();
  const onToggle = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders Show Parking button when inactive', () => {
    render(
      <ParkingPanel
        mapCenter={{ lat: 45.5, lon: -73.6 }}
        onParkingSpots={onParkingSpots}
        active={false}
        onToggle={onToggle}
      />
    );

    const btn = screen.getByRole('button', { name: /show nearby parking spots/i });
    expect(btn).toBeTruthy();
    expect(btn.textContent).toBe('Show Parking');
  });

  it('renders Hide Parking button when active', () => {
    render(
      <ParkingPanel
        mapCenter={{ lat: 45.5, lon: -73.6 }}
        onParkingSpots={onParkingSpots}
        active={true}
        onToggle={onToggle}
      />
    );

    const btn = screen.getByRole('button', { name: /hide parking spots/i });
    expect(btn).toBeTruthy();
    expect(btn.textContent).toBe('Hide Parking');
  });

  it('calls getParkingNearby and onToggle when clicking Show Parking', async () => {
    mockGetParking.mockResolvedValueOnce(mockSpots);

    render(
      <ParkingPanel
        mapCenter={{ lat: 45.5, lon: -73.6 }}
        onParkingSpots={onParkingSpots}
        active={false}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByText('Show Parking'));

    expect(mockGetParking).toHaveBeenCalledWith(45.5, -73.6, 800);
    await waitFor(() => {
      expect(onParkingSpots).toHaveBeenCalledWith(mockSpots);
      expect(onToggle).toHaveBeenCalledWith(true);
    });
  });

  it('calls onParkingSpots([]) and onToggle(false) when clicking Hide Parking', async () => {
    render(
      <ParkingPanel
        mapCenter={{ lat: 45.5, lon: -73.6 }}
        onParkingSpots={onParkingSpots}
        active={true}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByText('Hide Parking'));

    expect(onParkingSpots).toHaveBeenCalledWith([]);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('shows error message if API fails', async () => {
    mockGetParking.mockRejectedValueOnce(new Error('Network failure'));

    render(
      <ParkingPanel
        mapCenter={{ lat: 45.5, lon: -73.6 }}
        onParkingSpots={onParkingSpots}
        active={false}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByText('Show Parking'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText('Network failure')).toBeTruthy();
    });
  });

  it('disables button while loading', async () => {
    // A promise that doesn't resolve immediately
    mockGetParking.mockReturnValue(new Promise(() => {}));

    render(
      <ParkingPanel
        mapCenter={{ lat: 45.5, lon: -73.6 }}
        onParkingSpots={onParkingSpots}
        active={false}
        onToggle={onToggle}
      />
    );

    const btn = screen.getByText('Show Parking');
    fireEvent.click(btn);

    expect((btn as HTMLButtonElement).disabled).toBe(true);
    expect(btn.textContent).toBe('Loading...');
  });
});
