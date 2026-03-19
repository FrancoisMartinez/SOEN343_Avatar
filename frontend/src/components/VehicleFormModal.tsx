import { useState, useEffect } from 'react';
import type { CarData } from '../services/vehicleService';

interface VehicleFormModalProps {
  isOpen: boolean;
  car: CarData | null; // null = create mode, non-null = edit mode
  onClose: () => void;
  onSubmit: (data: Omit<CarData, 'id'>) => void;
}

const emptyForm: Omit<CarData, 'id'> = {
  makeModel: '',
  transmissionType: 'AUTOMATIC',
  location: '',
  available: true,
  accessibilityFeatures: '',
  hourlyRate: 0,
};

export default function VehicleFormModal({ isOpen, car, onClose, onSubmit }: VehicleFormModalProps) {
  const [form, setForm] = useState<Omit<CarData, 'id'>>(emptyForm);

  useEffect(() => {
    if (car) {
      setForm({
        makeModel: car.makeModel,
        transmissionType: car.transmissionType,
        location: car.location,
        available: car.available,
        accessibilityFeatures: car.accessibilityFeatures,
        hourlyRate: car.hourlyRate,
      });
    } else {
      setForm(emptyForm);
    }
  }, [car, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked
             : type === 'number' ? parseFloat(value) || 0
             : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{car ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="vehicle-form">
          <div className="vehicle-form__group">
            <label htmlFor="makeModel">Make & Model</label>
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
            <label htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              type="text"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Downtown Montreal"
              required
            />
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

          <div className="vehicle-form__group">
            <label htmlFor="accessibilityFeatures">Accessibility Features</label>
            <input
              id="accessibilityFeatures"
              name="accessibilityFeatures"
              type="text"
              value={form.accessibilityFeatures}
              onChange={handleChange}
              placeholder="e.g. Wheelchair ramp, hand controls"
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

          <div className="vehicle-form__actions">
            <button type="button" className="vehicle-form__btn vehicle-form__btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="vehicle-form__btn vehicle-form__btn--submit">
              {car ? 'Save Changes' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
