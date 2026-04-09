import { useState, useEffect, useMemo } from 'react';
import type { CarData } from '../services/vehicleService';
import type { AvailabilitySlot } from '../types/availability';
import { createBooking } from '../services/bookingService';
import { useAuth } from '../contexts/AuthContext';
import type { InstructorData } from '../services/instructorService';
import { fetchInstructorAvailability } from '../services/availabilityService';
import { api } from '../services/apiClient';
import './BookingPanel.css';

interface BookingPanelProps {
  car?: CarData;
  instructor?: InstructorData;
  onClose: () => void;
  onBooked: () => void;
}

/** Day names in week order (Monday=0) matching Java DayOfWeek */
const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/** Convert minutes-from-midnight to "HH:mm" display */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Parse "HH:mm" to minutes from midnight */
function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Get day-of-week index (Monday=0) for a date string */
function dateToDayIndex(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00');
  return (d.getDay() + 6) % 7; // JS Sunday=0 → Monday=0
}

/** Get the day-of-week name for a date string */
function dateToDayName(dateStr: string): string {
  return DAY_ORDER[dateToDayIndex(dateStr)];
}

/** Get YYYY-MM-DD string in local time */
function getLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Represents a local-time availability window after UTC→local conversion.
 * A single UTC slot may split across two local days at day boundaries.
 */
interface LocalAvailabilityWindow {
  dayOfWeek: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

/**
 * Converts UTC availability slots to local-time windows.
 * Mirrors the AvailabilityPanel's convertUtcSlotsToLocal logic
 * so that times displayed in the booking form match what the provider set.
 */
function convertUtcSlotsToLocal(utcSlots: AvailabilitySlot[]): LocalAvailabilityWindow[] {
  const offsetMinutes = new Date().getTimezoneOffset(); // e.g. 240 for UTC-4
  const weekMinutes = 7 * 24 * 60;
  const result: LocalAvailabilityWindow[] = [];

  for (const slot of utcSlots) {
    if (!slot.available) continue;

    const dayIdx = DAY_ORDER.indexOf(slot.dayOfWeek);
    if (dayIdx < 0) continue;

    const utcStart = dayIdx * 24 * 60 + parseTimeToMinutes(slot.startTime);
    const utcEnd = dayIdx * 24 * 60 + parseTimeToMinutes(slot.endTime);
    const duration = utcEnd - utcStart;
    if (duration <= 0) continue;

    // Shift from UTC to local: local = utc - offset (getTimezoneOffset returns UTC-local)
    const localStart = ((utcStart - offsetMinutes) % weekMinutes + weekMinutes) % weekMinutes;
    let localEnd = localStart + duration;

    // Push segments, splitting at day boundaries
    const pushRange = (rangeStart: number, rangeEnd: number) => {
      let current = rangeStart;
      while (current < rangeEnd) {
        const dayBase = Math.floor(current / (24 * 60)) * 24 * 60;
        const dayBoundary = dayBase + 24 * 60;
        const segEnd = Math.min(rangeEnd, dayBoundary);
        const day = DAY_ORDER[Math.floor(current / (24 * 60)) % 7];
        const startMin = current - dayBase;
        const endMin = segEnd - dayBase;
        result.push({
          dayOfWeek: day,
          startTime: minutesToTime(startMin),
          endTime: endMin === 24 * 60 ? '24:00' : minutesToTime(endMin),
        });
        current = segEnd;
      }
    };

    if (localEnd <= weekMinutes) {
      pushRange(localStart, localEnd);
    } else {
      pushRange(localStart, weekMinutes);
      pushRange(0, localEnd - weekMinutes);
    }
  }

  // Merge contiguous intervals in the same day
  const merged: LocalAvailabilityWindow[] = [];
  for (const day of DAY_ORDER) {
    const dayIntervals = result
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

    if (dayIntervals.length === 0) continue;

    let current = { ...dayIntervals[0] };
    for (let i = 1; i < dayIntervals.length; i++) {
      const next = dayIntervals[i];
      const currentEndMin = parseTimeToMinutes(current.endTime === '24:00' ? '24:00' : current.endTime);
      const nextStartMin = parseTimeToMinutes(next.startTime);

      if (nextStartMin <= currentEndMin) {
        const nextEndMin = parseTimeToMinutes(next.endTime === '24:00' ? '24:00' : next.endTime);
        if (nextEndMin > currentEndMin) {
          current.endTime = next.endTime;
        }
      } else {
        merged.push(current);
        current = { ...next };
      }
    }
    merged.push(current);
  }

  return merged;
}

/**
 * Converts a local-time booking back to UTC for the backend.
 * Returns the UTC startTime string ("HH:mm").
 */
function convertLocalTimeToUtc(localTime: string): string {
  const offsetMinutes = new Date().getTimezoneOffset();
  const localMin = parseTimeToMinutes(localTime);
  // UTC = local + offset (getTimezoneOffset is UTC-local, so adding it converts local→UTC)
  const utcMin = ((localMin + offsetMinutes) % (24 * 60) + (24 * 60)) % (24 * 60);
  return minutesToTime(utcMin);
}

/**
 * BookingPanel: Displays a booking form when a learner wants to book a car.
 * Shows availability (converted to local time), lets user pick date/time/duration,
 * validates the selection, and submits.
 */
export default function BookingPanel({ car, instructor, onClose, onBooked }: BookingPanelProps) {
  const { userId } = useAuth();

  const [slots, setSlots] = useState<LocalAvailabilityWindow[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch the entity's weekly availability and convert UTC → local
  useEffect(() => {
    let cancelled = false;
    setLoadingSlots(true);
    setFetchError(null);

    const loadSlots = async () => {
      try {
        let utcSlots: AvailabilitySlot[];
        if (instructor) {
          const res = await fetchInstructorAvailability(instructor.id);
          utcSlots = res.slots.map(s => ({ ...s, dayOfWeek: s.dayOfWeek as any }));
        } else if (car) {
          utcSlots = await fetchCarAvailability(car.id!);
        } else {
          utcSlots = [];
        }

        if (cancelled) return;
        const localWindows = convertUtcSlotsToLocal(utcSlots);
        setSlots(localWindows);
        
        const entityIdStr = instructor ? `Instructor ${instructor.id}` : `Car ${car?.id}`;
        if (localWindows.length === 0 && utcSlots.length > 0) {
          console.warn(`[BookingPanel] ${entityIdStr} has ${utcSlots.length} UTC slots but 0 local windows after conversion`);
        }
        if (utcSlots.length === 0) {
          console.warn(`[BookingPanel] ${entityIdStr} has no availability slots in the database`);
        }
      } catch (err) {
        const entityIdStr = instructor ? `Instructor ${instructor.id}` : `Car ${car?.id}`;
        console.error(`[BookingPanel] Failed to fetch availability for ${entityIdStr}:`, err);
        if (!cancelled) {
          setSlots([]);
          setFetchError('Could not load availability. Please try again.');
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    };

    void loadSlots();

    return () => { cancelled = true; };
  }, [car?.id, instructor?.id]);

  // Available dates: next 14 days, filtered to days that have local availability windows
  const availableDates = useMemo(() => {
    const availableDays = new Set(slots.map((s) => s.dayOfWeek));
    const dates: string[] = [];
    const today = new Date();
    
    // Determine the earliest possible local minute for today (now + 60 mins)
    const now = new Date();
    const todayStr = getLocalDateString(now);
    const minMinuteToday = now.getHours() * 60 + now.getMinutes() + 60;

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = getLocalDateString(d);
      const dayName = dateToDayName(dateStr);

      if (availableDays.has(dayName)) {
        // If today, check if there's at least one slot that starts after minMinuteToday
        if (dateStr === todayStr) {
          const daySlots = slots.filter(s => s.dayOfWeek === dayName);
          const hasFutureSlot = daySlots.some(s => {
            const slotEnd = parseTimeToMinutes(s.endTime);
            return slotEnd > minMinuteToday;
          });
          if (!hasFutureSlot) continue;
        }
        dates.push(dateStr);
      }
    }
    return dates;
  }, [slots]);

  // Time options for the selected date, based on local availability windows
  const timeOptions = useMemo(() => {
    if (!selectedDate) return [];
    const dayName = dateToDayName(selectedDate);
    const daySlots = slots.filter((s) => s.dayOfWeek === dayName);

    const now = new Date();
    const isToday = selectedDate === getLocalDateString(now);
    const minMinute = isToday ? (now.getHours() * 60 + now.getMinutes() + 60) : -1;

    const times: string[] = [];
    for (const slot of daySlots) {
      const startMin = parseTimeToMinutes(slot.startTime);
      const endMin = parseTimeToMinutes(slot.endTime);
      
      // Start from the later of slot start or min lead time
      const effectiveStart = Math.max(startMin, minMinute);
      
      // Rounds up to the next 30-minute interval from the effective start
      const roundedStart = Math.ceil(effectiveStart / 30) * 30;

      for (let m = roundedStart; m < endMin; m += 30) {
        times.push(minutesToTime(m));
      }
    }
    return times;
  }, [selectedDate, slots]);

  // Validation: check if selected time + duration fits within a local availability window
  const validation = useMemo(() => {
    if (!selectedDate || !selectedTime || duration < 1) {
      return { valid: false, message: '' };
    }

    const dayName = dateToDayName(selectedDate);
    const daySlots = slots.filter((s) => s.dayOfWeek === dayName);
    const reqStart = parseTimeToMinutes(selectedTime);
    const reqEnd = reqStart + duration * 60;

    // Minimum 1 hour lead time check
    const now = new Date();
    const isToday = selectedDate === getLocalDateString(now);
    if (isToday) {
      const minMinute = now.getHours() * 60 + now.getMinutes() + 60;
      if (reqStart < minMinute) {
        return { valid: false, message: 'Bookings must be at least 1 hour in advance' };
      }
    }

    const fits = daySlots.some((slot) => {
      const slotStart = parseTimeToMinutes(slot.startTime);
      const slotEnd = parseTimeToMinutes(slot.endTime);
      return reqStart >= slotStart && reqEnd <= slotEnd;
    });

    if (!fits) {
      return { valid: false, message: 'Not available for this timeslot' };
    }
    return { valid: true, message: '' };
  }, [selectedDate, selectedTime, duration, slots]);

  const entityName = instructor ? instructor.fullName : car?.makeModel;
  const entityRate = instructor ? instructor.hourlyRate : (car?.hourlyRate || 0);
  const totalCost = duration * entityRate;

  const handleBook = async () => {
    if (!validation.valid || !userId) return;
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Convert the selected local time back to UTC for the backend
      const utcStartTime = convertLocalTimeToUtc(selectedTime);
      const res = await createBooking({
        carId: car?.id,
        instructorId: instructor?.id,
        userId,
        date: selectedDate,
        startTime: utcStartTime,
        duration,
      });
      
      if (res.status === 'PENDING') {
        setSuccessMessage('Booking requested! Waiting for instructor confirmation.');
      } else {
        setSuccessMessage('Booking successful!');
      }
      setTimeout(() => onBooked(), 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-panel">
      <div className="booking-panel__header">
        <h3 className="booking-panel__title">Book {entityName}</h3>
        <button className="booking-panel__close-btn" onClick={onClose}>&times;</button>
      </div>

      {/* Info summary */}
      <div className="booking-panel__car-info">
        {instructor ? (
          <>
            <div className="booking-panel__info-row">
              <span className="booking-panel__label">Instructor</span>
              <span>{instructor.fullName}</span>
            </div>
            {instructor.rating !== undefined && (
              <div className="booking-panel__info-row">
                <span className="booking-panel__label">Rating</span>
                <span>{instructor.rating.toFixed(1)} / 5.0</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="booking-panel__info-row">
              <span className="booking-panel__label">Location</span>
              <span>{car?.location}</span>
            </div>
            <div className="booking-panel__info-row">
              <span className="booking-panel__label">Transmission</span>
              <span>{car?.transmissionType}</span>
            </div>
          </>
        )}
        <div className="booking-panel__info-row">
          <span className="booking-panel__label">Hourly Rate</span>
          <span className="booking-panel__rate">${entityRate.toFixed(2)}/hr</span>
        </div>
      </div>

      {/* Availability display (local time) */}
      <div className="booking-panel__availability">
        <span className="booking-panel__section-title">Availability</span>
        {loadingSlots ? (
          <p className="booking-panel__loading">Loading availability...</p>
        ) : fetchError ? (
          <p className="booking-panel__error">{fetchError}</p>
        ) : slots.length === 0 ? (
          <p className="booking-panel__no-slots">No availability set.</p>
        ) : (
          <div className="booking-panel__slots">
            {DAY_ORDER.map((day) => {
              const daySlots = slots.filter((s) => s.dayOfWeek === day);
              if (daySlots.length === 0) return null;
              return (
                <div key={day} className="booking-panel__slot-row">
                  <span className="booking-panel__day">{day.slice(0, 3)}</span>
                  <span className="booking-panel__times">
                    {daySlots.map((s, i) => (
                      <span key={i}>{s.startTime} - {s.endTime}</span>
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking form */}
      <div className="booking-panel__form">
        <div className="booking-panel__field">
          <label className="booking-panel__label">Date</label>
          <select
            className="booking-panel__select"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedTime('');
            }}
          >
            <option value="">Select a date</option>
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
              </option>
            ))}
          </select>
        </div>

        <div className="booking-panel__field">
          <label className="booking-panel__label">Start Time</label>
          <select
            className="booking-panel__select"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            disabled={!selectedDate}
          >
            <option value="">Select a time</option>
            {timeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="booking-panel__field">
          <label className="booking-panel__label">Duration (hours)</label>
          <select
            className="booking-panel__select"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        {/* Dynamic total cost */}
        <div className="booking-panel__cost">
          <span className="booking-panel__label">Total Cost</span>
          <span className="booking-panel__cost-value">${totalCost.toFixed(2)}</span>
          <span className="booking-panel__cost-breakdown">
            ({duration}h x ${entityRate.toFixed(2)}/hr)
          </span>
        </div>
      </div>

      {/* Validation error */}
      {validation.message && (
        <p className="booking-panel__error">{validation.message}</p>
      )}

      {/* Server error */}
      {errorMessage && (
        <p className="booking-panel__error">{errorMessage}</p>
      )}

      {/* Success message */}
      {successMessage && (
        <p className="booking-panel__success">{successMessage}</p>
      )}

      {/* Book button — green when valid, grayed out when invalid */}
      <button
        className={`booking-panel__book-btn ${!validation.valid || submitting ? 'booking-panel__book-btn--disabled' : ''}`}
        disabled={!validation.valid || submitting}
        onClick={handleBook}
      >
        {submitting ? 'Booking...' : 'Book'}
      </button>
    </div>
  );
}

/**
 * Fetches car availability via the public endpoint.
 * Returns raw UTC slots from the backend.
 */
async function fetchCarAvailability(carId: number): Promise<AvailabilitySlot[]> {
  try {
    const data = await api.get<{ slots: AvailabilitySlot[] }>(`/api/cars/${carId}/availability`);
    return data.slots ?? [];
  } catch (err: any) {
    throw new Error(`Failed to fetch availability: ${err.message}`);
  }
}
