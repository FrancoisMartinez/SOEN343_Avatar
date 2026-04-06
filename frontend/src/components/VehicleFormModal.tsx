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

type VehicleFormData = Omit<CarData, 'id' | 'providerId' | 'hourlyRate'> & { hourlyRate: number | '' };

const emptyForm: VehicleFormData = {
  makeModel: '',
  transmissionType: 'AUTOMATIC',
  location: '',
  latitude: undefined as any,
  longitude: undefined as any,
  available: true,
  hourlyRate: '',
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
        makeModel: car.makeModel,
        transmissionType: car.transmissionType,
        location: car.location,
        latitude: car.latitude,
        longitude: car.longitude,
        available: car.available,
        hourlyRate: car.hourlyRate,
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
        makeModel: car.makeModel,
        transmissionType: car.transmissionType,
        location: car.location,
        latitude: car.latitude,
        longitude: car.longitude,
        available: car.available,
        hourlyRate: car.hourlyRate,
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
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setForm((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
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
          <label htmlFor="transmissionType">Transmission / Type</label>
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
