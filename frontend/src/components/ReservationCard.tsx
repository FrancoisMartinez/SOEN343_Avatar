import type { BookingData } from '../services/bookingService';
import './ReservationCard.css';

interface ReservationCardProps {
  booking: BookingData;
  onFinish: (bookingId: number) => void;
  finishing?: boolean;
}

/**
 * ReservationCard: Displays a single reservation with its details
 * and a "Finish Reservation" action button.
 */
export default function ReservationCard({ booking, onFinish, finishing }: ReservationCardProps) {
  const isFinished = booking.status === 'FINISHED';

  return (
    <div className={`reservation-card ${isFinished ? 'reservation-card--finished' : ''}`}>
      <div className="reservation-card__header">
        <h3 className="reservation-card__title">{booking.carName}</h3>
        <span className={`reservation-card__status reservation-card__status--${booking.status.toLowerCase()}`}>
          {booking.status}
        </span>
      </div>

      <div className="reservation-card__details">
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

      {!isFinished && (
        <button
          className="reservation-card__finish-btn"
          onClick={() => onFinish(booking.id!)}
          disabled={finishing}
        >
          {finishing ? 'Finishing...' : 'Finish Reservation'}
        </button>
      )}
    </div>
  );
}
