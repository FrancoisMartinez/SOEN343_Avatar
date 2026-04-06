import { useState } from 'react';
import type { CarData } from '../services/vehicleService';
import BookingPanel from './BookingPanel';

interface VehicleCardProps {
  car: CarData;
  isSelected?: boolean;
  mode?: 'manage' | 'search';
  onEdit?: (car: CarData) => void;
  onDelete?: (carId: number) => Promise<void>;
  onOpenAvailability?: (carId: number) => void;
  onLocate?: (carId: number) => void;
  cardRef?: (element: HTMLDivElement | null) => void;
}

export default function VehicleCard({ car, isSelected, mode = 'manage', onEdit, onDelete, onOpenAvailability, onLocate, cardRef }: VehicleCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);

  const hasCoords = car.latitude != null && car.longitude != null;

  const handleConfirmDelete = async () => {
    if (deleting || !onDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(car.id!);
      setConfirmDelete(false);
    } catch (err: any) {
      console.error(`[VehicleCard] Failed to delete car ${car.id}:`, err);
      setDeleteError(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`vehicle-card ${isSelected ? 'vehicle-card--selected' : ''}`}
      ref={cardRef}
      tabIndex={-1}
      onClick={() => hasCoords && onLocate?.(car.id!)}
    >
      <div className="vehicle-card__header">
        <h3 className="vehicle-card__title">{car.name}</h3>
        {mode === 'manage' ? (
          <button
            type="button"
            className={`vehicle-card__badge vehicle-card__badge-btn ${car.status === 'AVAILABLE' ? 'vehicle-card__badge--available' : 'vehicle-card__badge--unavailable'}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenAvailability?.(car.id!);
            }}
            disabled={deleting}
          >
            {car.status === 'AVAILABLE' ? 'Available' : 'Unavailable'}
          </button>
        ) : (
          <span className={`vehicle-card__badge ${car.status === 'AVAILABLE' ? 'vehicle-card__badge--available' : 'vehicle-card__badge--unavailable'}`}>
             {car.status === 'AVAILABLE' ? 'Available' : 'Unavailable'}
          </span>
        )}
      </div>

      <div className="vehicle-card__details">
        <div className="vehicle-card__detail">
          <span className="vehicle-card__label">Transmission</span>
          <span className="vehicle-card__value">{car.type}</span>
        </div>
        <div className="vehicle-card__detail">
          <span className="vehicle-card__label">Location</span>
          <span className="vehicle-card__value">{car.location}</span>
        </div>
        <div className="vehicle-card__detail">
          <span className="vehicle-card__label">Rate</span>
          <span className="vehicle-card__value">${car.pricePerHour.toFixed(2)}/hr</span>
        </div>
      </div>

      <div className="vehicle-card__actions" onClick={(e) => e.stopPropagation()}>
        {hasCoords && (
          <button
            className="vehicle-card__btn vehicle-card__btn--locate"
            onClick={() => onLocate?.(car.id!)}
            disabled={deleting}
          >
            Locate
          </button>
        )}

        {mode === 'manage' && (
          <>
            <button className="vehicle-card__btn vehicle-card__btn--edit" onClick={() => onEdit?.(car)} disabled={deleting}>
              Edit
            </button>
            {confirmDelete ? (
              <div className="vehicle-card__confirm-group">
                <button className="vehicle-card__btn vehicle-card__btn--confirm" onClick={handleConfirmDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Confirm'}
                </button>
                <button className="vehicle-card__btn vehicle-card__btn--cancel" onClick={() => { setConfirmDelete(false); setDeleteError(null); }} disabled={deleting}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className="vehicle-card__btn vehicle-card__btn--delete" onClick={() => setConfirmDelete(true)} disabled={deleting}>
                Delete
              </button>
            )}
            {deleteError && (
              <div className="vehicle-card__error">{deleteError}</div>
            )}
          </>
        )}

        {mode === 'search' && car.status === 'AVAILABLE' && (
          <button
            className="vehicle-card__btn vehicle-card__btn--confirm"
            onClick={() => setShowBooking(true)}
          >
            Book
          </button>
        )}
      </div>

      {/* Booking panel slides in when learner clicks Book */}
      {showBooking && (
        <div className="vehicle-card__booking-overlay" onClick={(e) => e.stopPropagation()}>
          <BookingPanel
            car={car}
            onClose={() => setShowBooking(false)}
            onBooked={() => setShowBooking(false)}
          />
        </div>
      )}
    </div>
  );
}
