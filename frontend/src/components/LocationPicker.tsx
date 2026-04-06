import { useState, useEffect, useCallback } from 'react';
import { geocodeAddress, reverseGeocode } from '../services/geocodingService';
import type { GeocodingResult } from '../services/geocodingService';
import type { DraftLocation } from './VehicleFormModal';
import AddressSearchField from './AddressSearchField';

interface LocationPickerProps {
  initialAddress?: string;
  draftLocation: DraftLocation | null;
  onLocationChange: (loc: DraftLocation) => void;
  onClear?: () => void;
  placeholder?: string;
  label?: string;
  mapAvailable?: boolean;
}

export default function LocationPicker({
  initialAddress = '',
  draftLocation,
  onLocationChange,
  onClear,
  placeholder = 'Search an address...',
  label = 'Location',
  mapAvailable = true,
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
      <AddressSearchField
        label={label}
        value={addressQuery}
        placeholder={placeholder}
        searching={searching}
        suggestions={suggestions}
        suggestionsAriaLabel="Location suggestions"
        onChange={setAddressQuery}
        onSearch={() => {
          void handleAddressSearch();
        }}
        onSelectSuggestion={selectSuggestion}
        onClear={handleClear}
        clearAriaLabel="Clear location"
      />

      {geocodeError && (
        <div className="vehicle-form__geo-error">{geocodeError}</div>
      )}

      <div className="vehicle-form__location-row">
        {mapAvailable && (
          <div className="vehicle-form__map-hint vehicle-form__map-hint--compact">
            Or click on the map or use your location
          </div>
        )}
        <button
          type="button"
          className={`vehicle-sidebar__location-btn vehicle-sidebar__location-btn--compact ${locating ? 'vehicle-sidebar__location-btn--active' : ''}`}
          onClick={handleUseMyLocation}
          disabled={locating}
          title="Use My Location"
        >
          {locating ? '⏳' : '📍'}
        </button>
      </div>

      {draftLocation && (
        <div className="vehicle-form__selected-location vehicle-form__selected-location--spaced">
          <span className="vehicle-form__selected-label">Selected:</span> {draftLocation.address}
        </div>
      )}
    </div>
  );
}
