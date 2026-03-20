import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWeeklyAvailability, updateWeeklyAvailability } from '../services/availabilityService';
import type { AvailabilitySlot, DayName } from '../types/availability';

interface AvailabilityPanelProps {
  carId?: number;
  initialSlots?: AvailabilitySlot[];
  onSaveDraft?: (slots: AvailabilitySlot[]) => void;
  onClose: () => void;
}

export interface LocalInterval {
  id: string;
  dayOfWeek: DayName;
  startTime: string;
  endTime: string;
}

const DAYS: DayName[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const DAY_LABELS: Record<DayName, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

function buildTimeOptions(): string[] {
  const options: string[] = [];
  for (let minute = 0; minute <= 24 * 60; minute += 30) {
    const hour = Math.floor(minute / 60);
    const mins = minute % 60;
    if (hour === 24 && mins !== 0) continue;
    options.push(`${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
  }
  return options;
}

const TIME_OPTIONS = buildTimeOptions();

function buildEmptyDaySelection(): Record<DayName, boolean> {
  return DAYS.reduce((acc, day) => {
    acc[day] = false;
    return acc;
  }, {} as Record<DayName, boolean>);
}

function parseMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutes(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function dayIndex(day: DayName): number {
  return DAYS.indexOf(day);
}

function dayFromIndex(index: number): DayName {
  return DAYS[(index + 7) % 7];
}

export function applyIntervalToSelectedDays(
  intervals: LocalInterval[],
  selectedDays: Record<DayName, boolean>,
  startTime: string,
  endTime: string,
): LocalInterval[] {
  const daysToUpdate = DAYS.filter((day) => selectedDays[day]);
  if (daysToUpdate.length === 0) return intervals;

  const preserved = intervals.filter((slot) => !selectedDays[slot.dayOfWeek]);
  const replacements = daysToUpdate.map((day, index) => ({
    id: `${day}-${startTime}-${endTime}-updated-${index}`,
    dayOfWeek: day,
    startTime,
    endTime,
  }));

  return [...preserved, ...replacements];
}

function convertUtcSlotsToLocal(utcSlots: AvailabilitySlot[]): LocalInterval[] {
  const offsetMinutes = new Date().getTimezoneOffset();
  const weekMinutes = 7 * 24 * 60;
  const result: LocalInterval[] = [];

  for (const slot of utcSlots) {
    if (!slot.available) continue;

    const start = dayIndex(slot.dayOfWeek) * 24 * 60 + parseMinutes(slot.startTime);
    const end = dayIndex(slot.dayOfWeek) * 24 * 60 + parseMinutes(slot.endTime);
    const duration = end - start;
    if (duration <= 0) continue;

    const localStart = ((start - offsetMinutes) % weekMinutes + weekMinutes) % weekMinutes;
    let localEnd = localStart + duration;

    const pushRange = (rangeStart: number, rangeEnd: number) => {
      let current = rangeStart;
      while (current < rangeEnd) {
        const currentDayBase = Math.floor(current / (24 * 60)) * 24 * 60;
        const dayBoundary = currentDayBase + 24 * 60;
        const segmentEnd = Math.min(rangeEnd, dayBoundary);
        const day = dayFromIndex(Math.floor(current / (24 * 60)));
        const startMinute = current - currentDayBase;
        const endMinute = segmentEnd - currentDayBase;
        result.push({
          id: `${day}-${startMinute}-${endMinute}-${Math.random().toString(16).slice(2)}`,
          dayOfWeek: day,
          startTime: formatMinutes(startMinute),
          endTime: endMinute === 24 * 60 ? '24:00' : formatMinutes(endMinute),
        });
        current = segmentEnd;
      }
    };

    if (localEnd <= weekMinutes) {
      pushRange(localStart, localEnd);
    } else {
      pushRange(localStart, weekMinutes);
      localEnd -= weekMinutes;
      pushRange(0, localEnd);
    }
  }

  return result;
}

function convertLocalIntervalsToUtc(localIntervals: LocalInterval[]): AvailabilitySlot[] {
  const offsetMinutes = new Date().getTimezoneOffset();
  const weekMinutes = 7 * 24 * 60;
  const result: AvailabilitySlot[] = [];

  for (const interval of localIntervals) {
    const localStart = dayIndex(interval.dayOfWeek) * 24 * 60 + parseMinutes(interval.startTime);
    const localEnd = dayIndex(interval.dayOfWeek) * 24 * 60 + parseMinutes(interval.endTime);
    const duration = localEnd - localStart;
    if (duration <= 0) continue;

    const utcStart = ((localStart + offsetMinutes) % weekMinutes + weekMinutes) % weekMinutes;
    let utcEnd = utcStart + duration;

    const pushRange = (rangeStart: number, rangeEnd: number) => {
      let current = rangeStart;
      while (current < rangeEnd) {
        const currentDayBase = Math.floor(current / (24 * 60)) * 24 * 60;
        const dayBoundary = currentDayBase + 24 * 60;
        const segmentEnd = Math.min(rangeEnd, dayBoundary);
        const day = dayFromIndex(Math.floor(current / (24 * 60)));
        const startMinute = current - currentDayBase;
        const endMinute = segmentEnd - currentDayBase;
        result.push({
          dayOfWeek: day,
          startTime: formatMinutes(startMinute),
          endTime: endMinute === 24 * 60 ? '24:00' : formatMinutes(endMinute),
          available: true,
        });
        current = segmentEnd;
      }
    };

    if (utcEnd <= weekMinutes) {
      pushRange(utcStart, utcEnd);
    } else {
      pushRange(utcStart, weekMinutes);
      utcEnd -= weekMinutes;
      pushRange(0, utcEnd);
    }
  }

  return result;
}

export default function AvailabilityPanel({ carId, initialSlots, onSaveDraft, onClose }: AvailabilityPanelProps) {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intervals, setIntervals] = useState<LocalInterval[]>([]);
  const [selectedDays, setSelectedDays] = useState<Record<DayName, boolean>>(() => buildEmptyDaySelection());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  useEffect(() => {
    if (carId == null) {
      setIntervals(convertUtcSlotsToLocal(initialSlots ?? []));
      setLoading(false);
      return;
    }

    if (!userId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWeeklyAvailability(userId, carId);
        if (cancelled) return;
        setIntervals(convertUtcSlotsToLocal(response.slots));
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Failed to load availability.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [carId, initialSlots, userId]);

  const grouped = useMemo(() => {
    return DAYS.map((day) => ({
      day,
      slots: intervals
        .filter((slot) => slot.dayOfWeek === day)
        .sort((a, b) => parseMinutes(a.startTime) - parseMinutes(b.startTime)),
    }));
  }, [intervals]);

  const toggleDay = (day: DayName) => {
    setSelectedDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const updateInterval = () => {
    setError(null);
    if (parseMinutes(startTime) >= parseMinutes(endTime)) {
      setError('Start time must be before end time.');
      return;
    }

    const days = DAYS.filter((day) => selectedDays[day]);
    if (days.length === 0) {
      setError('Select at least one day.');
      return;
    }

    setIntervals((prev) => applyIntervalToSelectedDays(prev, selectedDays, startTime, endTime));
    setSelectedDays(buildEmptyDaySelection());
  };

  const removeInterval = (id: string) => {
    setIntervals((prev) => prev.filter((slot) => slot.id !== id));
  };

  const handleSave = async () => {
    const utcSlots = convertLocalIntervalsToUtc(intervals);

    if (carId == null) {
      onSaveDraft?.(utcSlots);
      onClose();
      return;
    }

    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      await updateWeeklyAvailability(userId, carId, { slots: utcSlots });
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Failed to save availability.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="vehicle-sidebar">
      <div className="availability-panel">
        <div className="availability-panel__header">
          <h2>{carId == null ? 'Availability (Draft)' : 'Availability'}</h2>
          <button className="modal-close" onClick={onClose} disabled={saving}>&#x2715;</button>
        </div>

        {loading ? (
          <div className="availability-panel__status">Loading availability...</div>
        ) : (
          <div className="availability-panel__content">
            <p className="availability-panel__hint">Click days below to select them, then update their interval. Times are local on this device.</p>

            <div className="availability-panel__interval-row">
              <select value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={saving}>
                {TIME_OPTIONS.slice(0, -1).map((time) => (
                  <option key={`start-${time}`} value={time}>{time}</option>
                ))}
              </select>
              <span>to</span>
              <select value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={saving}>
                {TIME_OPTIONS.slice(1).map((time) => (
                  <option key={`end-${time}`} value={time}>{time}</option>
                ))}
              </select>
              <button type="button" className="vehicle-form__btn vehicle-form__btn--search" onClick={updateInterval} disabled={saving}>Update</button>
            </div>

            {error && <div className="availability-panel__error">{error}</div>}

            <div className="availability-panel__list">
              {grouped.map(({ day, slots }) => (
                <div
                  key={day}
                  className={`availability-panel__day-block ${selectedDays[day] ? 'availability-panel__day-block--selected' : ''}`}
                  role="button"
                  tabIndex={saving ? -1 : 0}
                  aria-pressed={selectedDays[day]}
                  onClick={() => {
                    if (!saving) toggleDay(day);
                  }}
                  onKeyDown={(e) => {
                    if (saving) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleDay(day);
                    }
                  }}
                >
                  <h4>{DAY_LABELS[day]}</h4>
                  {slots.length === 0 ? (
                    <p className="availability-panel__empty">No intervals</p>
                  ) : (
                    slots.map((slot) => (
                      <div key={slot.id} className="availability-panel__slot-item">
                        <span>{slot.startTime} - {slot.endTime}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeInterval(slot.id);
                          }}
                          disabled={saving}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>

            <div className="availability-panel__actions">
              <button type="button" className="vehicle-form__btn vehicle-form__btn--cancel" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="button" className="vehicle-form__btn vehicle-form__btn--submit" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
