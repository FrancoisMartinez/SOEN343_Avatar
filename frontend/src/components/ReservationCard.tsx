import type { BookingData } from '../services/bookingService';
import './ReservationCard.css';

interface ReservationCardProps {
  booking: BookingData;
  onFinish?: (bookingId: number) => void;
  onConfirm?: (bookingId: number) => void;
  onCancel?: (bookingId: number) => void;
  finishing?: boolean;
  confirming?: boolean;
  cancelling?: boolean;
  readOnly?: boolean;
  isInstructorView?: boolean;
}

/**
 * ReservationCard: Displays a single reservation with its details.
 * Supports learner view (finish), instructor view (confirm/cancel), and provider view (read-only).
 */
export default function ReservationCard({
  booking,
  onFinish,
  onConfirm,
  onCancel,
  finishing,
  confirming,
  cancelling,
  readOnly,
  isInstructorView = false,
}: ReservationCardProps) {
  const isFinished = booking.status === 'FINISHED';
  const isCancelled = booking.status === 'CANCELLED';
  const isPending = booking.status === 'PENDING';
  
  const showFinishBtn = !readOnly && !isFinished && !isCancelled && !isPending && onFinish;
  const showConfirmBtn = !readOnly && isPending && onConfirm;
  const showCancelBtn = !readOnly && (isPending || booking.status === 'CONFIRMED') && onCancel;

  const getTitle = () => {
    if (booking.carName && booking.instructorName) {
      if (isInstructorView && booking.learnerName) return `Class with ${booking.learnerName}`;
      return `Class with ${booking.instructorName} in ${booking.carName}`;
    }
    if (booking.carName) return booking.carName;
    if (isInstructorView && booking.learnerName) return `Class with ${booking.learnerName}`;
    if (booking.instructorName) return `Class with ${booking.instructorName}`;
    return 'Reservation';
  };

  return (
    <div className={`reservation-card ${isFinished ? 'reservation-card--finished' : ''} ${isCancelled ? 'reservation-card--cancelled' : ''}`}>
      <div className="reservation-card__header">
        <h3 className="reservation-card__title">
          {getTitle()}
        </h3>
        <span className={`reservation-card__status reservation-card__status--${booking.status.toLowerCase()}`}>
          {booking.status}
        </span>
      </div>

      <div className="reservation-card__details">
        {booking.learnerName && (
          <div className="reservation-card__detail">
            <span className="reservation-card__label">Learner</span>
            <span className="reservation-card__value">{booking.learnerName}</span>
          </div>
        )}
        {booking.carName && booking.instructorName && (
          <div className="reservation-card__detail">
            <span className="reservation-card__label">Car</span>
            <span className="reservation-card__value">{booking.carName}</span>
          </div>
        )}
        <div className="reservation-card__detail">
          <span className="reservation-card__label">Date</span>
          <span className="reservation-card__value">
            {new Date(booking.date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
            })}
          </span>
        </div>
        <div className="reservation-card__detail">
          <span className="reservation-card__label">Start Time</span>
          <span className="reservation-card__value">{booking.startTime}</span>
        </div>
        <div className="reservation-card__detail">
          <span className="reservation-card__label">Duration</span>
          <span className="reservation-card__value">{booking.duration} hour{booking.duration > 1 ? 's' : ''}</span>
        </div>
        <div className="reservation-card__detail">
          <span className="reservation-card__label">Total Cost</span>
          <span className="reservation-card__value reservation-card__cost">${booking.totalCost.toFixed(2)}</span>
        </div>
      </div>

      <div className="reservation-card__actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        {showConfirmBtn && (
          <button
            className="reservation-card__finish-btn"
            style={{ backgroundColor: '#28a745', flex: 1 }}
            onClick={() => onConfirm(booking.id!)}
            disabled={confirming}
          >
            {confirming ? 'Confirming...' : 'Confirm'}
          </button>
        )}

        {showCancelBtn && (
          <button
            className="reservation-card__finish-btn"
            style={{ backgroundColor: '#dc3545', flex: 1 }}
            onClick={() => onCancel(booking.id!)}
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        )}

        {showFinishBtn && (
          <button
            className="reservation-card__finish-btn"
            style={{ flex: 1 }}
            onClick={() => onFinish(booking.id!)}
            disabled={finishing}
          >
            {finishing ? 'Finishing...' : 'Finish Reservation'}
          </button>
        )}
      </div>
    </div>
  );
}
