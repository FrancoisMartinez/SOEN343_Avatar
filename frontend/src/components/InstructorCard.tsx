import { useState } from 'react';
import type { InstructorData } from '../services/instructorService';
import BookingPanel from './BookingPanel';

interface InstructorCardProps {
  instructor: InstructorData;
  isSelected?: boolean;
  onLocate?: (instructorId: number) => void;
  cardRef?: (element: HTMLDivElement | null) => void;
}

export default function InstructorCard({ instructor, isSelected, onLocate, cardRef }: InstructorCardProps) {
  const [showBooking, setShowBooking] = useState(false);

  const hasCoords = instructor.latitude != null && instructor.longitude != null;

  return (
    <div
      className={`vehicle-card ${isSelected ? 'vehicle-card--selected' : ''}`}
      ref={cardRef}
      tabIndex={-1}
      onClick={() => hasCoords && onLocate?.(instructor.id)}
    >
      <div className="vehicle-card__header">
        <h3 className="vehicle-card__title">{instructor.fullName}</h3>
        <span className="vehicle-card__badge vehicle-card__badge--available">
           Available
        </span>
      </div>

      <div className="vehicle-card__details">
        <div className="vehicle-card__detail">
          <span className="vehicle-card__label">Rate</span>
          <span className="vehicle-card__value">${instructor.hourlyRate?.toFixed(2) ?? '0.00'}/hr</span>
        </div>
        {instructor.rating != null && (
          <div className="vehicle-card__detail">
            <span className="vehicle-card__label">Rating</span>
            <span className="vehicle-card__value">{instructor.rating.toFixed(1)} / 5</span>
          </div>
        )}
      </div>

      <div className="vehicle-card__actions" onClick={(e) => e.stopPropagation()}>
        {hasCoords && (
          <button
            className="vehicle-card__btn vehicle-card__btn--locate"
            onClick={() => onLocate?.(instructor.id)}
          >
            Locate
          </button>
        )}

        <button
          className="vehicle-card__btn vehicle-card__btn--confirm"
          onClick={() => setShowBooking(true)}
        >
          Book
        </button>
      </div>

      {showBooking && (
        <div className="vehicle-card__booking-overlay" onClick={(e) => e.stopPropagation()}>
          <BookingPanel
            instructor={instructor}
            onClose={() => setShowBooking(false)}
            onBooked={() => setShowBooking(false)}
          />
        </div>
      )}
    </div>
  );
}
