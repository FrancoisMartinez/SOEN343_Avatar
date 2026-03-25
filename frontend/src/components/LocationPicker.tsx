import { useState, useEffect, useCallback } from 'react';
import { geocodeAddress, reverseGeocode } from '../services/geocodingService';
import type { GeocodingResult } from '../services/geocodingService';
import type { DraftLocation } from './VehicleFormModal';

interface LocationPickerProps {
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
  draftLocation: DraftLocation | null;
  onLocationChange: (loc: DraftLocation) => void;
  onClear?: () => void;
  onPickingModeChange?: (active: boolean) => void;
  placeholder?: string;
  label?: string;
}

export default function LocationPicker({
  initialAddress = '',
  initialLat,
  initialLng,
  draftLocation,
  onLocationChange,
  onPickingModeChange,
  placeholder = 'Search an address...',
  label = 'Location',
}: LocationPickerProps) {
  const [addressQuery, setAddressQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (draftLocation) {
      setAddressQuery(draftLocation.address);
      setGeocodeError(null);
    } else {
      setAddressQuery('');
    }
  }, [draftLocation]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let address = 'Current Location';
        
        try {
          address = await reverseGeocode(lat, lng);
        } catch (err) {
          console.warn('Reverse geocode failed, falling back to coordinates', err);
          address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }

        const loc: DraftLocation = { lat, lng, address };
        setAddressQuery(loc.address);
        onLocationChange(loc);
        setLocating(false);
      },
      (err) => {
        console.error('Error fetching location:', err);
        alert('Could not fetch your location. Please ensure location services are enabled.');
        setLocating(false);
      }
    );
  };

  const handleAddressSearch = useCallback(async () => {
    if (!addressQuery.trim()) return;
    setSearching(true);
    setGeocodeError(null);
    setSuggestions([]);
    try {
      const results = await geocodeAddress(addressQuery);
      if (results.length === 0) {
        setGeocodeError('No results found. Try a different address.');
      } else {
        setSuggestions(results);
      }
    } catch {
      setGeocodeError('Geocoding failed. Please try again.');
    } finally {
      setSearching(false);
    }
  }, [addressQuery]);

  const handleAddressKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddressSearch();
    }
  };

  const selectSuggestion = (result: GeocodingResult) => {
    const loc: DraftLocation = { lat: result.lat, lng: result.lon, address: result.displayName };
    setAddressQuery(result.displayName);
    setSuggestions([]);
    setGeocodeError(null);
    onLocationChange(loc);
  };

  const handleClear = () => {
    setAddressQuery('');
    setSuggestions([]);
    setGeocodeError(null);
    // Don't change lat/lng to 0,0, just clear the address to indicate no active location filter
    onLocationChange({ ... (draftLocation || { lat: 0, lng: 0 }), address: '' });
    onClear?.();
  };

  return (
    <div className="vehicle-form__group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        {label && <label>{label}</label>}
      </div>
      <div className="vehicle-form__address-row">
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={addressQuery}
            onChange={(e) => setAddressQuery(e.target.value)}
            onKeyDown={handleAddressKeyDown}
            placeholder={placeholder}
            style={{ paddingRight: addressQuery ? '2rem' : '0.5rem', width: '100%' }}
          />
          {addressQuery && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                position: 'absolute',
                right: '0.5rem',
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: '1.2rem',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Clear location"
            >
              &times;
            </button>
          )}
        </div>
        <button
          type="button"
          className="vehicle-form__btn vehicle-form__btn--search"
          onClick={handleAddressSearch}
          disabled={searching}
        >
          {searching ? '...' : 'Search'}
        </button>
      </div>

      {geocodeError && (
        <div className="vehicle-form__geo-error">{geocodeError}</div>
      )}

      {suggestions.length > 0 && (
        <ul className="vehicle-form__suggestions">
          {suggestions.map((s, i) => (
            <li key={i} onClick={() => selectSuggestion(s)}>
              {s.displayName}
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.1rem' }}>
        <div className="vehicle-form__map-hint">
          Or use your location or click on the map
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`vehicle-sidebar__location-btn ${locating ? 'vehicle-sidebar__location-btn--active' : ''}`}
            onClick={handleUseMyLocation}
            disabled={locating}
            style={{ flex: 1, padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
          >
            {locating ? 'Locating...' : '📍 Use My Location'}
          </button>
        </div>
      </div>

      {draftLocation && (
        <div className="vehicle-form__selected-location" style={{ marginTop: '0.5rem' }}>
          <span className="vehicle-form__selected-label">Selected:</span> {draftLocation.address}
        </div>
      )}
    </div>
  );
}
