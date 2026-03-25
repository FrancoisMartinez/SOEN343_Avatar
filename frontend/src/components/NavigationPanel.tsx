import { useEffect, useRef, useState } from 'react';
import { geocodeAddress } from '../services/geocodingService';
import { getDirections, type RouteResult } from '../services/routeService';
import './NavigationPanel.css';

interface NavigationPanelProps {
  onRoute: (polyline: [number, number][], distanceKm: number, durationMin: number) => void;
  onClear: () => void;
}

export default function NavigationPanel({ onRoute, onClear }: Readonly<NavigationPanelProps>) {
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [fromCoords, setFromCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [toCoords, setToCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<Pick<RouteResult, 'distanceKm' | 'durationMin'> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const didAutoGps = useRef(false);

  // Auto-detect user location on mount
  useEffect(() => {
    if (didAutoGps.current) return;
    didAutoGps.current = true;

    if (!navigator.geolocation) return;

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setFromCoords({ lat: latitude, lon: longitude });
        try {
          const results = await geocodeAddress(`${latitude},${longitude}`);
          setFromAddress(results[0]?.displayName ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } catch {
          setFromAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  const geocodeField = async (
    address: string,
    setCoords: (c: { lat: number; lon: number } | null) => void,
    setAddress: (a: string) => void
  ) => {
    if (!address.trim()) return;
    try {
      const results = await geocodeAddress(address);
      if (results.length === 0) {
        setError('Address not found. Try a more specific search.');
        setCoords(null);
        return;
      }
      setCoords({ lat: results[0].lat, lon: results[0].lon });
      setAddress(results[0].displayName);
      setError(null);
    } catch {
      setError('Geocoding failed. Please try again.');
      setCoords(null);
    }
  };

  const handleGetDirections = async () => {
    if (!fromCoords || !toCoords) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getDirections(fromCoords.lat, fromCoords.lon, toCoords.lat, toCoords.lon);
      setRouteInfo({ distanceKm: result.distanceKm, durationMin: result.durationMin });
      onRoute(result.polyline, result.distanceKm, result.durationMin);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not get directions.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setToAddress('');
    setToCoords(null);
    setRouteInfo(null);
    setError(null);
    onClear();
  };

  const canGetDirections = !!fromCoords && !!toCoords && !loading;

  return (
    <div className="nav-panel">
      <div className="nav-panel__header">
        <span className="nav-panel__title">Directions</span>
        {routeInfo && (
          <button className="nav-panel__clear" onClick={handleClear} aria-label="Clear route">
            ✕
          </button>
        )}
      </div>

      <div className="nav-panel__field">
        <label htmlFor="nav-from" className="nav-panel__label">From</label>
        <input
          id="nav-from"
          className="nav-panel__input"
          type="text"
          placeholder={gpsLoading ? 'Detecting location…' : 'Your location'}
          value={fromAddress}
          onChange={(e) => {
            setFromAddress(e.target.value);
            setFromCoords(null);
            setRouteInfo(null);
          }}
          onBlur={() => geocodeField(fromAddress, setFromCoords, setFromAddress)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') geocodeField(fromAddress, setFromCoords, setFromAddress);
          }}
        />
      </div>

      <div className="nav-panel__field">
        <label htmlFor="nav-to" className="nav-panel__label">To</label>
        <input
          id="nav-to"
          className="nav-panel__input"
          type="text"
          placeholder="Enter destination"
          value={toAddress}
          onChange={(e) => {
            setToAddress(e.target.value);
            setToCoords(null);
            setRouteInfo(null);
          }}
          onBlur={() => geocodeField(toAddress, setToCoords, setToAddress)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') geocodeField(toAddress, setToCoords, setToAddress);
          }}
        />
      </div>

      {error && <p className="nav-panel__error" role="alert" aria-live="polite">{error}</p>}

      {routeInfo && (
        <div className="nav-panel__info">
          <span><span aria-hidden="true">🛣</span> {routeInfo.distanceKm} km</span>
          <span><span aria-hidden="true">⏱</span> {routeInfo.durationMin} min</span>
        </div>
      )}

      <button
        className="nav-panel__btn"
        onClick={handleGetDirections}
        disabled={!canGetDirections}
        aria-disabled={!canGetDirections}
      >
        {loading ? 'Getting directions…' : 'Get Directions'}
      </button>
    </div>
  );
}
