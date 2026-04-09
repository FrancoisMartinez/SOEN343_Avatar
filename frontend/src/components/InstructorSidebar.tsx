import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchInstructorBookings, confirmBooking, cancelBooking, type BookingData } from '../services/bookingService';
import ReservationCard from './ReservationCard';
import AvailabilityPanel from './AvailabilityPanel';
import './VehicleSidebar.css';

export default function InstructorSidebar() {
  const { userId, role } = useAuth();
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const loadData = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const bookingsData = await fetchInstructorBookings(userId);
      setBookings(bookingsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'INSTRUCTOR' && userId) {
      loadData();
    }
  }, [userId, role]);

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

  if (role !== 'INSTRUCTOR') {
    return null;
  }

  if (isEditingAvailability && userId) {
    return (
      <aside className="vehicle-sidebar">
        <AvailabilityPanel
          entityId={userId}
          entityType="instructor"
          onClose={() => setIsEditingAvailability(false)}
        />
      </aside>
    );
  }

  return (
    <aside className="vehicle-sidebar">
      <div className="vehicle-sidebar__header">
        <h2 className="vehicle-sidebar__title">Instructor Dashboard</h2>
        <div className="vehicle-sidebar__header-actions">
          <button className="vehicle-sidebar__add-btn" onClick={() => setIsEditingAvailability(true)}>
            Edit Availability
          </button>
        </div>
      </div>

      <div className="vehicle-sidebar__list">
        {loading ? (
          <div className="vehicle-sidebar__status">
            <div className="vehicle-sidebar__spinner" />
            Loading bookings...
          </div>
        ) : error ? (
          <div className="vehicle-sidebar__status vehicle-sidebar__status--error">
            {error}
            <button className="vehicle-sidebar__retry-btn" onClick={loadData}>Retry</button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="vehicle-sidebar__status vehicle-sidebar__status--empty">
            <p>You have no bookings yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
            {bookings.map((b) => (
              <ReservationCard
                key={b.id}
                booking={b}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirming={actionId === b.id}
                cancelling={actionId === b.id}
                readOnly={false}
                isInstructorView={true}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

