import { useState } from 'react';
import { getParkingNearby } from '../services/parkingService';
import type { ParkingSpot } from '../services/parkingService';
import './ParkingPanel.css';

interface ParkingPanelProps {
  mapCenter: { lat: number; lon: number };
  onParkingSpots: (spots: ParkingSpot[]) => void;
  active: boolean;
  onToggle: (active: boolean) => void;
}

export default function ParkingPanel({
  mapCenter,
  onParkingSpots,
  active,
  onToggle,
}: Readonly<ParkingPanelProps>) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (active) {
      onParkingSpots([]);
      onToggle(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const spots = await getParkingNearby(mapCenter.lat, mapCenter.lon, 800);
      onParkingSpots(spots);
      onToggle(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load parking';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="parking-panel">
      <button
        className="parking-toggle-btn"
        onClick={handleToggle}
        disabled={loading}
        aria-label={active ? 'Hide parking spots' : 'Show nearby parking spots'}
        aria-pressed={active}
      >
        {loading ? 'Loading...' : (active ? 'Hide Parking' : 'Show Parking')}
      </button>

      {error && (
        <p className="parking-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}

