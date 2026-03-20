import { useState, useEffect, useCallback } from 'react';
import type { CarData } from '../services/vehicleService';
import { geocodeAddress } from '../services/geocodingService';
import type { GeocodingResult } from '../services/geocodingService';

export interface DraftLocation {
  lat: number;
  lng: number;
  address: string;
}

interface VehicleFormProps {
  car: CarData | null;
  draftLocation: DraftLocation | null;
  onClose: () => void;
  onSubmit: (data: Omit<CarData, 'id'>) => Promise<void>;
  onLocationChange: (loc: DraftLocation) => void;
}

type VehicleFormData = Omit<CarData, 'id' | 'hourlyRate'> & { hourlyRate: number | '' };

const emptyForm: VehicleFormData = {
  makeModel: '',
  transmissionType: 'AUTOMATIC',
  location: '',
  latitude: undefined,
  longitude: undefined,
  available: true,
  hourlyRate: '',
};

export default function VehicleFormModal({ car, draftLocation, onClose, onSubmit, onLocationChange }: VehicleFormProps) {
  const [form, setForm] = useState<VehicleFormData>(emptyForm);
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (car) {
      setForm({
        makeModel: car.makeModel,
        transmissionType: car.transmissionType,
        location: car.location,
        latitude: car.latitude,
        longitude: car.longitude,
        available: car.available,
        hourlyRate: car.hourlyRate,
      });
      setAddressQuery(car.location);
    } else {
      setForm(emptyForm);
      setAddressQuery('');
    }
    setSuggestions([]);
    setGeocodeError(null);
  }, [car]);

  useEffect(() => {
    if (draftLocation) {
      setForm((prev) => ({
        ...prev,
        location: draftLocation.address,
        latitude: draftLocation.lat,
        longitude: draftLocation.lng,
      }));
      setAddressQuery(draftLocation.address);
      setGeocodeError(null);
    }
  }, [draftLocation]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked
             : type === 'number' ? (value === '' ? '' : Number(value))
             : value,
    }));
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
    setForm((prev) => ({
      ...prev,
      location: result.displayName,
      latitude: result.lat,
      longitude: result.lon,
    }));
    setAddressQuery(result.displayName);
    setSuggestions([]);
    setGeocodeError(null);
    onLocationChange(loc);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (form.hourlyRate === '') return;
    if (!form.latitude || !form.longitude) {
      setGeocodeError('Please select a location by searching an address or clicking the map.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        makeModel: form.makeModel,
        transmissionType: form.transmissionType,
        location: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
        available: form.available,
        hourlyRate: form.hourlyRate,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="vehicle-form-panel">
      <div className="vehicle-form-panel__header">
        <h2>{car ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
        <button className="modal-close" onClick={onClose} disabled={submitting}>&#x2715;</button>
      </div>

      <form onSubmit={handleSubmit} className="vehicle-form">
        <div className="vehicle-form__group">
          <label htmlFor="makeModel">Make &amp; Model</label>
          <input
            id="makeModel"
            name="makeModel"
            type="text"
            value={form.makeModel}
            onChange={handleChange}
            placeholder="e.g. Toyota Corolla 2024"
            required
          />
        </div>

        <div className="vehicle-form__group">
          <label htmlFor="transmissionType">Transmission</label>
          <select
            id="transmissionType"
            name="transmissionType"
            value={form.transmissionType}
            onChange={handleChange}
          >
            <option value="AUTOMATIC">Automatic</option>
            <option value="MANUAL">Manual</option>
          </select>
        </div>

        <div className="vehicle-form__group">
          <label htmlFor="hourlyRate">Hourly Rate ($)</label>
          <input
            id="hourlyRate"
            name="hourlyRate"
            type="number"
            step="0.01"
            min="0"
            value={form.hourlyRate}
            onChange={handleChange}
            required
          />
        </div>

        <div className="vehicle-form__group vehicle-form__group--checkbox">
          <label htmlFor="available">
            <input
              id="available"
              name="available"
              type="checkbox"
              checked={form.available}
              onChange={handleChange}
            />
            Available for booking
          </label>
        </div>

        <div className="vehicle-form__group">
          <label>Location</label>
          <div className="vehicle-form__address-row">
            <input
              type="text"
              value={addressQuery}
              onChange={(e) => setAddressQuery(e.target.value)}
              onKeyDown={handleAddressKeyDown}
              placeholder="Search an address..."
            />
            <button
              type="button"
              className="vehicle-form__btn vehicle-form__btn--search"
              onClick={handleAddressSearch}
              disabled={searching || submitting}
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

          <div className="vehicle-form__map-hint">
            Or click on the map to pick a location
          </div>
        </div>

        {form.location && (
          <div className="vehicle-form__selected-location">
            <span className="vehicle-form__selected-label">Selected:</span> {form.location}
          </div>
        )}

        <div className="vehicle-form__actions">
          <button type="button" className="vehicle-form__btn vehicle-form__btn--cancel" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="vehicle-form__btn vehicle-form__btn--submit" disabled={submitting}>
            {submitting ? (car ? 'Saving...' : 'Adding...') : (car ? 'Save Changes' : 'Add Vehicle')}
          </button>
        </div>
      </form>
    </div>
  );
}
