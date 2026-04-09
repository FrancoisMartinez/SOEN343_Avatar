import { useState } from 'react';
import { reverseGeocode } from '../services/geocodingService';
import type { BookingData } from '../services/bookingService';
import MapComponent from './MapComponent';
import LocationPicker from './LocationPicker';
import type { DraftLocation } from './VehicleFormModal';
import './FinishReservationModal.css';
import './VehicleSidebar.css'; // needed for LocationPicker styles

interface FinishReservationModalProps {
  booking: BookingData;
  onConfirm: (lat?: number, lng?: number, address?: string, rating?: number) => void;
  onCancel: () => void;
  submitting: boolean;
}

export default function FinishReservationModal({ booking, onConfirm, onCancel, submitting }: FinishReservationModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<DraftLocation | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resolving, setResolving] = useState(false);

  const isClassOnly = !!booking.instructorId && !booking.carId;

  const handleMapClick = async (lat: number, lng: number) => {
    setResolving(true);
    let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    try {
      address = await reverseGeocode(lat, lng);
    } catch {
      // fallback to coordinates
    }
    setSelectedLocation({ lat, lng, address });
    setResolving(false);
    setShowConfirm(false);
  };

  const handleLocationChange = (loc: DraftLocation) => {
    setSelectedLocation(loc);
    setShowConfirm(false);
  };

  const handleConfirmClick = () => {
    if (!isClassOnly && !selectedLocation) return;
    setShowConfirm(true);
  };

  const handleFinalConfirm = () => {
    onConfirm(
      selectedLocation?.lat,
      selectedLocation?.lng,
      selectedLocation?.address,
      booking.instructorId ? rating : undefined
    );
  };

  const renderStars = () => {
    return (
      <div className="rating-stars" style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0', justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => setRating(s)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '2.5rem',
              cursor: 'pointer',
              color: s <= rating ? '#fbbf24' : '#444',
              transition: 'all 0.2s'
            }}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="finish-modal__overlay">
      <div className={`finish-modal ${isClassOnly ? 'finish-modal--small' : ''}`}>
        <div className="finish-modal__header">
          <h3 className="finish-modal__title">
            Finish {isClassOnly ? 'Class' : 'Reservation'} - {booking.carName || booking.instructorName}
          </h3>
          <button className="finish-modal__close" onClick={onCancel} disabled={submitting}>&times;</button>
        </div>

        {isClassOnly ? (
          <div className="finish-modal__body" style={{ textAlign: 'center' }}>
            <p className="finish-modal__hint">How was your class with {booking.instructorName}?</p>
            {renderStars()}
            <p style={{ color: '#888', fontSize: '0.9rem' }}>Select a rating to finish the class.</p>
          </div>
        ) : (
          <>
            <p className="finish-modal__hint">
              Search for an address or click on the map to set the new car location, then confirm.
            </p>

            <div style={{ marginBottom: '0.5rem' }}>
              <LocationPicker
                draftLocation={selectedLocation}
                onLocationChange={handleLocationChange}
                label="New Car Location"
                placeholder="Search for an address..."
              />
            </div>

            <div className="finish-modal__map-container" style={{ position: 'relative' }}>
              <MapComponent
                pickingMode={true}
                pickingPurpose="vehicle"
                draftLocation={selectedLocation}
                onLocationPick={handleMapClick}
                vehicles={[]}
                parkingSpots={[]}
              />
            </div>
            
            {booking.instructorId && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
                <p className="finish-modal__hint">Rate your instructor:</p>
                {renderStars()}
              </div>
            )}
          </>
        )}

        <div className="finish-modal__actions" style={{ marginTop: '1rem', minHeight: '42px', display: 'flex', alignItems: 'center', width: '100%' }}>
          {resolving ? (
            <span className="finish-modal__resolving">Resolving address...</span>
          ) : showConfirm ? (
            <>
              <span style={{ flex: 1, fontSize: '0.9rem', color: '#ddd', fontWeight: 500 }}>
                {isClassOnly ? 'Finish this class and submit rating?' : 'Set car location and finish reservation?'}
              </span>
              <button
                className="finish-modal__btn finish-modal__btn--confirm"
                onClick={handleFinalConfirm}
                disabled={submitting}
                style={{ flex: '0 0 auto', padding: '0.6rem 1.5rem' }}
              >
                {submitting ? 'Finishing...' : 'Yes'}
              </button>
              <button
                className="finish-modal__btn finish-modal__btn--cancel"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                style={{ flex: '0 0 auto', padding: '0.6rem 1.5rem' }}
              >
                Go Back
              </button>
            </>
          ) : (
            <>
              <button
                className="finish-modal__btn finish-modal__btn--primary"
                onClick={handleConfirmClick}
                disabled={(!isClassOnly && !selectedLocation) || submitting}
              >
                {isClassOnly ? 'Finish Class' : 'Set Location & Finish'}
              </button>
              <button
                className="finish-modal__btn finish-modal__btn--secondary"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
