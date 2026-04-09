import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchInstructorBookings, confirmBooking, cancelBooking, type BookingData } from '../services/bookingService';
import ReservationCard from '../components/ReservationCard';
import './ReservationsPage.css';

/**
 * InstructorReservationsPage: Dashboard showing all reservations for an instructor.
 * Allows confirming pending bookings and cancelling others.
 */
export default function InstructorReservationsPage() {
  const { userId, isAuthenticated, role } = useAuth();

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchInstructorBookings(userId);
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isAuthenticated && role === 'INSTRUCTOR') {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, role, loadData]);

  const handleConfirm = async (bookingId: number) => {
    try {
      setActionId(bookingId);
      const updated = await confirmBooking(bookingId);
      setBookings(prev => prev.map(b => b.id === bookingId ? updated : b));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      setActionId(bookingId);
      const updated = await cancelBooking(bookingId);
      setBookings(prev => prev.map(b => b.id === bookingId ? updated : b));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionId(null);
    }
  };

  if (!isAuthenticated || role !== 'INSTRUCTOR') {
    return (
      <div className="reservations-page">
        <div className="reservations-page__empty">
          Please log in as an instructor to view your dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="reservations-page">
      <div className="reservations-page__header">
        <h2 className="reservations-page__title">Class Reservations</h2>
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
          <button className="reservations-page__retry-btn" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="reservations-page__empty">
          No class reservations yet. Learners can find you on the map to book a class.
        </div>
      )}

      <div className="reservations-page__grid">
        {bookings.map((booking) => (
        <ReservationCard
        key={booking.id}
        booking={booking}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirming={actionId === booking.id}
        cancelling={actionId === booking.id}
        readOnly={false}
        isInstructorView={true}
        />
        ))}      </div>
    </div>
  );
}
