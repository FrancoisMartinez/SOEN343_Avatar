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
  onConfirm: (lat: number, lng: number, address: string) => void;
  onCancel: () => void;
  submitting: boolean;
}

export default function FinishReservationModal({ booking, onConfirm, onCancel, submitting }: FinishReservationModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<DraftLocation | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resolving, setResolving] = useState(false);

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
    if (!selectedLocation) return;
    setShowConfirm(true);
  };

  const handleFinalConfirm = () => {
    if (!selectedLocation) return;
    onConfirm(selectedLocation.lat, selectedLocation.lng, selectedLocation.address);
  };

  return (
    <div className="finish-modal__overlay">
      <div className="finish-modal">
        <div className="finish-modal__header">
          <h3 className="finish-modal__title">Finish Reservation - {booking.carName}</h3>
          <button className="finish-modal__close" onClick={onCancel} disabled={submitting}>&times;</button>
        </div>

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

        <div className="finish-modal__actions" style={{ marginTop: '0.5rem', minHeight: '42px', display: 'flex', alignItems: 'center', width: '100%' }}>
          {resolving ? (
            <span className="finish-modal__resolving">Resolving address...</span>
          ) : showConfirm && selectedLocation ? (
            <>
              <span style={{ flex: 1, fontSize: '0.9rem', color: '#ddd', fontWeight: 500 }}>
                Are you sure you want to set this as the new car location?
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
                disabled={!selectedLocation || submitting}
              >
                Set Location & Finish
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
