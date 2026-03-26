import { useEffect, useRef, useState } from 'react';
import { geocodeAddress, reverseGeocode, type GeocodingResult } from '../services/geocodingService';
import { getDirections, type JourneyLeg, type RouteResult, type TransportMode } from '../services/routeService';
import AddressSearchField from './AddressSearchField';
import './NavigationPanel.css';

const MODES: { value: TransportMode; label: string; icon: string }[] = [
  { value: 'DRIVING', label: 'Drive', icon: '🚗' },
  { value: 'BUS', label: 'Bus', icon: '🚌' },
  { value: 'BICYCLE', label: 'Bike', icon: '🚲' },
  { value: 'WALK', label: 'Walk', icon: '🚶' },
];

function isGeolocationError(error: unknown): error is GeolocationPositionError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function getLocationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Location permission is blocked for this site. Please enable it in browser settings.';
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'Your location is currently unavailable. Please try again in a moment.';
  }
  if (error.code === error.TIMEOUT) {
    return 'Location request timed out. Please try again.';
  }
  return 'Could not get your location. Please try again.';
}

function requestCurrentPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

interface NavigationPanelProps {
  onRoute: (polyline: [number, number][], distanceKm: number, durationMin: number) => void;
  onClear: () => void;
}

export default function NavigationPanel({ onRoute, onClear }: Readonly<NavigationPanelProps>) {
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [fromCoords, setFromCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [toCoords, setToCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedMode, setSelectedMode] = useState<TransportMode>('DRIVING');
  const [routeInfo, setRouteInfo] = useState<Pick<RouteResult, 'distanceKm' | 'durationMin'> | null>(null);
  const [legs, setLegs] = useState<JourneyLeg[]>([]);
  const [fromSuggestions, setFromSuggestions] = useState<GeocodingResult[]>([]);
  const [toSuggestions, setToSuggestions] = useState<GeocodingResult[]>([]);
  const [fromSearching, setFromSearching] = useState(false);
  const [toSearching, setToSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const didAutoGps = useRef(false);

  const setFromToCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setError(null);

    try {
      let pos: GeolocationPosition;
      try {
        pos = await requestCurrentPosition({
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0,
        });
      } catch (primaryError) {
        if (isGeolocationError(primaryError) && primaryError.code === primaryError.PERMISSION_DENIED) {
          throw primaryError;
        }
        pos = await requestCurrentPosition({
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 300000,
        });
      }

      const { latitude, longitude } = pos.coords;
      setFromCoords({ lat: latitude, lon: longitude });
      setRouteInfo(null);
      setLegs([]);
      try {
        const address = await reverseGeocode(latitude, longitude);
        setFromAddress(address);
      } catch {
        setFromAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      }
      setFromSuggestions([]);
    } catch (error) {
      if (isGeolocationError(error)) {
        setError(getLocationErrorMessage(error));
      } else {
        setError('Could not get your location. Please try again.');
      }
    } finally {
      setGpsLoading(false);
    }
  };

  // Auto-detect user location on mount
  useEffect(() => {
    if (didAutoGps.current) return;
    didAutoGps.current = true;

    void setFromToCurrentLocation();
  }, []);

  const searchField = async (
    address: string,
    setSearching: (s: boolean) => void,
    setSuggestions: (results: GeocodingResult[]) => void
  ) => {
    if (!address.trim()) return;
    setSearching(true);
    setSuggestions([]);
    try {
      const results = await geocodeAddress(address);
      if (results.length === 0) {
        setError('Address not found. Try a more specific search.');
        return;
      }
      setSuggestions(results);
      setError(null);
    } catch {
      setError('Geocoding failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const selectFromSuggestion = (result: GeocodingResult) => {
    setFromAddress(result.displayName);
    setFromCoords({ lat: result.lat, lon: result.lon });
    setFromSuggestions([]);
    setRouteInfo(null);
    setLegs([]);
    setError(null);
  };

  const selectToSuggestion = (result: GeocodingResult) => {
    setToAddress(result.displayName);
    setToCoords({ lat: result.lat, lon: result.lon });
    setToSuggestions([]);
    setRouteInfo(null);
    setLegs([]);
    setError(null);
  };

  const clearFrom = () => {
    setFromAddress('');
    setFromCoords(null);
    setFromSuggestions([]);
    setRouteInfo(null);
    setLegs([]);
  };

  const clearTo = () => {
    setToAddress('');
    setToCoords(null);
    setToSuggestions([]);
    setRouteInfo(null);
    setLegs([]);
  };

  const handleGetDirections = async () => {
    if (!fromCoords || !toCoords) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getDirections(fromCoords.lat, fromCoords.lon, toCoords.lat, toCoords.lon, selectedMode);
      setRouteInfo({ distanceKm: result.distanceKm, durationMin: result.durationMin });
      setLegs(result.legs);
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
    setToSuggestions([]);
    setRouteInfo(null);
    setLegs([]);
    setError(null);
    onClear();
  };

  const handleModeChange = (mode: TransportMode) => {
    setSelectedMode(mode);
    setRouteInfo(null);
    setLegs([]);
  };

  const canGetDirections = !!fromCoords && !!toCoords && !loading;

  return (
    <div className="nav-panel">
      <div className="nav-panel__header">
        <span className="nav-panel__title">Directions</span>
        <button
          className="nav-panel__toggle"
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-label={isCollapsed ? 'Expand directions panel' : 'Collapse directions panel'}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <span className={`nav-panel__caret${isCollapsed ? ' nav-panel__caret--collapsed' : ''}`} aria-hidden="true">
            ▾
          </span>
        </button>
      </div>

      {!isCollapsed && (
        <>
      <div className="nav-panel__modes" role="group" aria-label="Transport mode">
        {MODES.map(({ value, label, icon }) => (
          <button
            key={value}
            className={`nav-panel__mode-btn${selectedMode === value ? ' nav-panel__mode-btn--active' : ''}`}
            onClick={() => handleModeChange(value)}
            title={label}
          >
            <span aria-hidden="true">{icon}</span>
            <span className="nav-panel__mode-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="nav-panel__field">
        <AddressSearchField
          inputId="nav-from"
          label="From"
          placeholder={gpsLoading ? 'Detecting location...' : 'Your location'}
          value={fromAddress}
          searching={fromSearching}
          suggestions={fromSuggestions}
          suggestionsAriaLabel="From suggestions"
          onChange={(value) => {
            setFromAddress(value);
            setFromCoords(null);
            setFromSuggestions([]);
            setRouteInfo(null);
          }}
          onSearch={() => {
            void searchField(fromAddress, setFromSearching, setFromSuggestions);
          }}
          onSelectSuggestion={selectFromSuggestion}
          onClear={clearFrom}
          clearAriaLabel="Clear start"
        />
        <button
          type="button"
          className="nav-panel__current-location"
          onClick={() => {
            void setFromToCurrentLocation();
          }}
          disabled={gpsLoading}
        >
          {gpsLoading ? 'Locating...' : 'Use current location'}
        </button>
      </div>

      <div className="nav-panel__field">
        <AddressSearchField
          inputId="nav-to"
          label="To"
          placeholder="Enter destination"
          value={toAddress}
          searching={toSearching}
          suggestions={toSuggestions}
          suggestionsAriaLabel="To suggestions"
          onChange={(value) => {
            setToAddress(value);
            setToCoords(null);
            setToSuggestions([]);
            setRouteInfo(null);
          }}
          onSearch={() => {
            void searchField(toAddress, setToSearching, setToSuggestions);
          }}
          onSelectSuggestion={selectToSuggestion}
          onClear={clearTo}
          clearAriaLabel="Clear destination"
        />
      </div>

      {error && <p className="nav-panel__error" role="alert" aria-live="polite">{error}</p>}

      {routeInfo && (
        <div className="nav-panel__info">
          <span><span aria-hidden="true">🛣</span> {routeInfo.distanceKm} km</span>
          <span><span aria-hidden="true">⏱</span> {routeInfo.durationMin} min</span>
          <button className="nav-panel__clear-route" onClick={handleClear}>
            Clear
          </button>
        </div>
      )}

      {legs.length > 0 && (
        <ol className="nav-panel__legs" aria-label="Journey steps">
          {legs.map((leg, i) => (
            <li key={`${leg.type}-${leg.fromStop ?? 'walk'}-${i}`} className="nav-panel__leg">
              {leg.type === 'WALK' ? (
                <span><span aria-hidden="true">🚶</span> Walk {leg.durationMin} min</span>
              ) : (
                <span>
                  <span aria-hidden="true">{leg.transportMode === 'subway' ? '🚇' : '🚌'}</span>
                  {' '}{leg.lineLabel && `Line ${leg.lineLabel}: `}{leg.fromStop} → {leg.toStop} ({leg.durationMin} min)
                </span>
              )}
            </li>
          ))}
        </ol>
      )}

      <button
        className="nav-panel__btn"
        onClick={handleGetDirections}
        disabled={!canGetDirections}
      >
        {loading ? 'Getting directions…' : 'Get Directions'}
      </button>
        </>
      )}
    </div>
  );
}
