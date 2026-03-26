import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchProviderBookings, type BookingData } from '../services/bookingService';
import ReservationCard from '../components/ReservationCard';
import './ReservationsPage.css';

/**
 * ProviderReservationsPage: Read-only dashboard showing all reservations
 * for cars owned by the logged-in car provider.
 */
export default function ProviderReservationsPage() {
  const { userId, isAuthenticated, role } = useAuth();

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchProviderBookings(userId);
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isAuthenticated && role === 'CAR_PROVIDER') {
      loadBookings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, role, loadBookings]);

  if (!isAuthenticated || role !== 'CAR_PROVIDER') {
    return (
      <div className="reservations-page">
        <div className="reservations-page__empty">
          Please log in as a car provider to view reservations.
        </div>
      </div>
    );
  }

  return (
    <div className="reservations-page">
      <div className="reservations-page__header">
        <h2 className="reservations-page__title">Car Reservations</h2>
      </div>

      {loading && (
        <div className="reservations-page__status">
          <div className="reservations-page__spinner" />
          Loading reservations...
        </div>
      )}

      {error && (
        <div className="reservations-page__status reservations-page__status--error">
          {error}
          <button className="reservations-page__retry-btn" onClick={loadBookings}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="reservations-page__empty">
          No reservations yet for your cars.
        </div>
      )}

      <div className="reservations-page__grid">
        {bookings.map((booking) => (
          <ReservationCard
            key={booking.id}
            booking={booking}
            readOnly
          />
        ))}
      </div>
    </div>
  );
}
