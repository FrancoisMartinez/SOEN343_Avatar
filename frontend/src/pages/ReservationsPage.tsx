import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchLearnerBookings, finishBooking, type BookingData } from '../services/bookingService';
import ReservationCard from '../components/ReservationCard';
import './ReservationsPage.css';

/**
 * ReservationsPage: Dashboard showing all of a learner's bookings.
 * Displays each reservation with details and a "Finish Reservation" action.
 */
export default function ReservationsPage() {
  const { userId, isAuthenticated, role } = useAuth();

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finishingId, setFinishingId] = useState<number | null>(null);

  const loadBookings = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLearnerBookings(userId);
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isAuthenticated && role === 'LEARNER') {
      loadBookings();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, role, loadBookings]);

  const handleFinish = async (bookingId: number) => {
    setFinishingId(bookingId);
    try {
      const updated = await finishBooking(bookingId);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? updated : b))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to finish reservation');
    } finally {
      setFinishingId(null);
    }
  };

  if (!isAuthenticated || role !== 'LEARNER') {
    return (
      <div className="reservations-page">
        <div className="reservations-page__empty">
          Please log in as a learner to view your reservations.
        </div>
      </div>
    );
  }

  return (
    <div className="reservations-page">
      <div className="reservations-page__header">
        <h2 className="reservations-page__title">My Reservations</h2>
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
          No reservations yet. Book a car from the map to get started!
        </div>
      )}

      <div className="reservations-page__grid">
        {bookings.map((booking) => (
          <ReservationCard
            key={booking.id}
            booking={booking}
            onFinish={handleFinish}
            finishing={finishingId === booking.id}
          />
        ))}
      </div>
    </div>
  );
}
