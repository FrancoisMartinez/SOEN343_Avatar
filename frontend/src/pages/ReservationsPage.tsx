import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchLearnerBookings, finishBooking, type BookingData } from '../services/bookingService';
import { getUserProfile } from '../services/userService';
import ReservationCard from '../components/ReservationCard';
import FinishReservationModal from '../components/FinishReservationModal';
import './ReservationsPage.css';

/**
 * ReservationsPage: Dashboard showing all of a learner's bookings.
 * "Finish Reservation" opens a map modal for location selection,
 * then deducts balance and updates the car location.
 */
export default function ReservationsPage() {
  const { userId, token, isAuthenticated, role } = useAuth();

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finishingBooking, setFinishingBooking] = useState<BookingData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

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

  const loadBalance = useCallback(async () => {
    if (!token) return;
    try {
      const profile = await getUserProfile(token);
      setBalance(profile.balance);
    } catch {
      // non-critical
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && role === 'LEARNER') {
      loadBookings();
      loadBalance();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, role, loadBookings, loadBalance]);

  const handleFinishClick = (bookingId: number) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    // Check balance before opening modal
    if (balance !== null && balance < booking.totalCost) {
      alert(`Insufficient balance. You need $${booking.totalCost.toFixed(2)} but only have $${balance.toFixed(2)}. Please add funds in your profile.`);
      return;
    }

    setFinishingBooking(booking);
  };

  const handleFinishConfirm = async (lat: number, lng: number, address: string) => {
    if (!finishingBooking?.id) return;
    setSubmitting(true);
    try {
      const updated = await finishBooking(finishingBooking.id, {
        latitude: lat,
        longitude: lng,
        location: address,
      });
      setBookings((prev) => prev.map((b) => (b.id === finishingBooking.id ? updated : b)));
      setFinishingBooking(null);
      // Refresh balance after deduction
      loadBalance();
    } catch (err: any) {
      alert(err.message || 'Failed to finish reservation');
    } finally {
      setSubmitting(false);
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
        {balance !== null && (
          <span className="reservations-page__balance">
            Balance: <strong>${balance.toFixed(2)}</strong>
          </span>
        )}
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
            onFinish={handleFinishClick}
            finishing={submitting && finishingBooking?.id === booking.id}
          />
        ))}
      </div>

      {finishingBooking && (
        <FinishReservationModal
          booking={finishingBooking}
          onConfirm={handleFinishConfirm}
          onCancel={() => setFinishingBooking(null)}
          submitting={submitting}
        />
      )}
    </div>
  );
}
