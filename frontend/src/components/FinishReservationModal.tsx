import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { reverseGeocode } from '../services/geocodingService';
import type { BookingData } from '../services/bookingService';
import 'leaflet/dist/leaflet.css';
import './FinishReservationModal.css';

interface FinishReservationModalProps {
  booking: BookingData;
  onConfirm: (lat: number, lng: number, address: string) => void;
  onCancel: () => void;
  submitting: boolean;
}

const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="#646cff"/>
    <circle cx="16" cy="16" r="7" fill="white"/>
  </svg>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function FinishReservationModal({ booking, onConfirm, onCancel, submitting }: FinishReservationModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
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
          Click on the map to set the new car location, then confirm.
        </p>

        <div className="finish-modal__map-container">
          <MapContainer
            center={[45.5017, -73.5673]}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onPick={handleMapClick} />
            {selectedLocation && (
              <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={pinIcon} />
            )}
          </MapContainer>
        </div>

        {resolving && (
          <p className="finish-modal__resolving">Resolving address...</p>
        )}

        {selectedLocation && !resolving && (
          <div className="finish-modal__selected">
            <span className="finish-modal__selected-label">Selected:</span> {selectedLocation.address}
          </div>
        )}

        {showConfirm && selectedLocation && (
          <div className="finish-modal__confirm-box">
            <p className="finish-modal__confirm-text">
              Are you sure you want to set this as the new car location?
            </p>
            <div className="finish-modal__confirm-actions">
              <button
                className="finish-modal__btn finish-modal__btn--confirm"
                onClick={handleFinalConfirm}
                disabled={submitting}
              >
                {submitting ? 'Finishing...' : 'Yes, Finish Reservation'}
              </button>
              <button
                className="finish-modal__btn finish-modal__btn--cancel"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        <div className="finish-modal__actions">
          {!showConfirm && (
            <>
              <button
                className="finish-modal__btn finish-modal__btn--primary"
                onClick={handleConfirmClick}
                disabled={!selectedLocation || resolving || submitting}
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
