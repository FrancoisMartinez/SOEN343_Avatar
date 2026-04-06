import { useState, useEffect } from 'react';
import type { CarData } from '../services/vehicleService';
import LocationPicker from './LocationPicker';

export interface DraftLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface VehicleFormDraft {
  form: VehicleFormData;
  addressQuery: string;
}

interface VehicleFormProps {
  car: CarData | null;
  draftLocation: DraftLocation | null;
  draftForm: VehicleFormDraft | null;
  onDraftChange: (draft: VehicleFormDraft) => void;
  onClose: () => void;
  onSubmit: (data: Omit<CarData, 'id' | 'providerId'>, editAvailabilityAfterSave?: boolean) => Promise<void>;
  onLocationChange: (loc: DraftLocation) => void;
  onEditAvailability: (carId?: number) => void;
}

type VehicleFormData = Omit<CarData, 'id' | 'providerId' | 'pricePerHour'> & { pricePerHour: number | '' };

const emptyForm: VehicleFormData = {
  name: '',
  type: 'AUTOMATIC',
  location: '',
  latitude: undefined as any,
  longitude: undefined as any,
  status: 'AVAILABLE',
  pricePerHour: '',
};

export default function VehicleFormModal({
  car,
  draftLocation,
  draftForm,
  onDraftChange,
  onClose,
  onSubmit,
  onLocationChange,
  onEditAvailability
}: VehicleFormProps) {
  const [form, setForm] = useState<VehicleFormData>(() => {
    if (draftForm) return draftForm.form;
    if (car) {
      return {
        name: car.name,
        type: car.type,
        location: car.location,
        latitude: car.latitude,
        longitude: car.longitude,
        status: car.status,
        pricePerHour: car.pricePerHour,
      };
    }
    return emptyForm;
  });
  
  const [addressQuery, setAddressQuery] = useState(() => (car ? car.location : draftForm?.addressQuery ?? ''));
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editAvailabilityAfterSave, setEditAvailabilityAfterSave] = useState(false);

  useEffect(() => {
    if (car) {
      setForm({
        name: car.name,
        type: car.type,
        location: car.location,
        latitude: car.latitude,
        longitude: car.longitude,
        status: car.status,
        pricePerHour: car.pricePerHour,
      });
      setAddressQuery(car.location ?? '');
    } else {
      setForm(draftForm?.form ?? emptyForm);
      setAddressQuery(draftForm?.addressQuery ?? '');
    }
    setGeocodeError(null);
  }, [car, draftForm]);

  useEffect(() => {
    if (!car) {
      onDraftChange({ form, addressQuery: addressQuery ?? '' });
    }
  }, [car, form, addressQuery, onDraftChange]);

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
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked ? 'AVAILABLE' : 'UNAVAILABLE' }));
    } else if (type === 'number') {
      setForm((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (form.pricePerHour === '') return;
    if (!form.latitude || !form.longitude) {
      setGeocodeError('Please select a location by searching an address or clicking the map.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name,
        type: form.type,
        location: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
        status: form.status,
        pricePerHour: form.pricePerHour,
      }, editAvailabilityAfterSave);
    } finally {
      setSubmitting(false);
      setEditAvailabilityAfterSave(false);
    }
  };

  return (
    <div className="vehicle-form-panel">
      <div className="vehicle-form-panel__header">
        <h2>{car ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
        <button className="modal-close" onClick={onClose} disabled={submitting}>&#x2715;</button>
      </div>

      <form onSubmit={handleSubmit} className="vehicle-form">
        {geocodeError && (
          <div className="vehicle-form__geo-error" style={{ color: '#ff6b6b', fontSize: '0.8rem' }}>
            {geocodeError}
          </div>
        )}

        <div className="vehicle-form__group">
          <label htmlFor="name">Make &amp; Model</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Toyota Corolla 2024"
            required
          />
        </div>

        <div className="vehicle-form__group">
          <label htmlFor="type">Transmission / Type</label>
          <select
            id="type"
            name="type"
            value={form.type}
            onChange={handleChange}
          >
            <option value="AUTOMATIC">Automatic</option>
            <option value="MANUAL">Manual</option>
          </select>
        </div>

        <div className="vehicle-form__group">
          <label htmlFor="pricePerHour">Hourly Rate ($)</label>
          <input
            id="pricePerHour"
            name="pricePerHour"
            type="number"
            step="0.01"
            min="0"
            value={form.pricePerHour}
            onChange={handleChange}
            required
          />
        </div>

        <div className="vehicle-form__group vehicle-form__group--checkbox">
          <label htmlFor="status">
            <input
              id="status"
              name="status"
              type="checkbox"
              checked={form.status === 'AVAILABLE'}
              onChange={handleChange}
            />
            Available for booking
          </label>
          {car?.id != null && (
            <button
              type="button"
              className="vehicle-form__btn vehicle-form__btn--search"
              onClick={() => onEditAvailability(car.id!)}
              disabled={submitting}
            >
              Edit Weekly Availability
            </button>
          )}
          {!car && (
            <button
              type="button"
              className="vehicle-form__btn vehicle-form__btn--search"
              onClick={() => onEditAvailability()}
              disabled={submitting}
            >
              Edit Weekly Availability
            </button>
          )}
        </div>

        <LocationPicker
          initialAddress={car ? (car.location ?? '') : draftForm?.addressQuery ?? ''}
          draftLocation={draftLocation}
          onLocationChange={(loc) => {
            onLocationChange(loc);
            setAddressQuery(loc.address);
          }}
          label="Location"
        />

        <div className="vehicle-form__actions">
          <button type="button" className="vehicle-form__btn vehicle-form__btn--cancel" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="submit"
            className="vehicle-form__btn vehicle-form__btn--submit"
            disabled={submitting}
            onClick={() => setEditAvailabilityAfterSave(false)}
          >
            {submitting ? (car ? 'Saving...' : 'Adding...') : (car ? 'Save Changes' : 'Add Vehicle')}
          </button>
        </div>
      </form>
    </div>
  );
}
