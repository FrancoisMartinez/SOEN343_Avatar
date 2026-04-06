import { useEffect, useRef, useState } from 'react';
import InstructorCard from './InstructorCard';
import LocationPicker from './LocationPicker';
import type { DraftLocation } from './VehicleFormModal';
import type { InstructorData } from '../services/instructorService';
import './VehicleSidebar.css';

interface InstructorSearchSidebarProps {
  onSearch?: (filters: {
    lat?: number;
    lng?: number;
    radius?: number;
    minPrice?: number;
    maxPrice?: number;
    dayOfWeek?: string;
    startMinute?: number;
    endMinute?: number;
  }) => void;
  onClearSearch?: () => void;
  instructors: InstructorData[];
  loading: boolean;
  error: string | null;
  selectedInstructorId: number | null;
  draftLocation?: DraftLocation | null;
  searchCenter?: DraftLocation | null;
  onLocateInstructor?: (instructorId: number) => void;
  onRetry: () => void;
  onFormOpen?: (instructor: InstructorData | null, purpose?: 'search' | 'vehicle' | 'instructor') => void;
  onFormClose?: () => void;
  onLocationChange?: (loc: DraftLocation) => void;
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

function buildTimeOptions(): string[] {
  const options: string[] = [];
  for (let minute = 0; minute < 24 * 60; minute += 30) {
    const hour = Math.floor(minute / 60);
    const mins = minute % 60;
    options.push(`${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
  }
  return options;
}
const TIME_OPTIONS = buildTimeOptions();

const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '1h 30m', value: 90 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '4 hours', value: 240 },
  { label: '6 hours', value: 360 },
  { label: '8 hours', value: 480 },
  { label: '12 hours', value: 720 },
];

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default function InstructorSearchSidebar({
  onSearch,
  onClearSearch,
  instructors,
  loading,
  error,
  selectedInstructorId,
  draftLocation,
  searchCenter,
  onLocateInstructor,
  onRetry,
  onFormOpen,
  onFormClose,
  onLocationChange,
}: InstructorSearchSidebarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);
  const [searchDate, setSearchDate] = useState('');
  const [searchStartTime, setSearchStartTime] = useState('');
  const [searchEndTime, setSearchEndTime] = useState('');
  const [searchDuration, setSearchDuration] = useState(0);
  const [userLocation, setUserLocation] = useState<DraftLocation | null>(null);
  const [searchKey, setSearchKey] = useState(0);

  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxPrice - 5);
    setMinPrice(val);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minPrice + 5);
    setMaxPrice(val);
  };

  const lastShowFilters = useRef(showFilters);

  useEffect(() => {
    if (showFilters !== lastShowFilters.current) {
      if (showFilters) {
        onFormOpen?.(null, 'search');
      } else {
        onFormClose?.();
      }
      lastShowFilters.current = showFilters;
    }
  }, [showFilters, onFormOpen, onFormClose]);

  useEffect(() => {
    if (searchCenter) {
      setUserLocation(searchCenter);
    }
  }, [searchCenter]);

  useEffect(() => {
    if (showFilters && draftLocation) {
      setUserLocation(draftLocation);
    }
  }, [showFilters, draftLocation]);

  useEffect(() => {
    if (selectedInstructorId == null) return;
    const selectedCard = cardRefs.current[selectedInstructorId];
    if (!selectedCard) return;

    selectedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    selectedCard.focus({ preventScroll: true });
  }, [selectedInstructorId]);

  const handleClearAll = () => {
    setMinPrice(0);
    setMaxPrice(100);
    setSearchDate('');
    setSearchStartTime('');
    setSearchEndTime('');
    setSearchDuration(0);
    setSearchKey(prev => prev + 1);

    const clearedLoc = { ...(draftLocation || { lat: 0, lng: 0 }), address: '' };
    setUserLocation(clearedLoc);
    onLocationChange?.(clearedLoc);

    setUserLocation(null);
    onClearSearch?.();
  };

  const handleSearch = () => {
    let dayOfWeek: string | undefined;
    let startMinute: number | undefined;
    let endMinute: number | undefined;

    if (searchDate) {
      const d = new Date(searchDate + 'T12:00:00');
      dayOfWeek = DAYS[(d.getDay() + 6) % 7];
    }

    if (searchStartTime) {
      startMinute = parseTimeToMinutes(searchStartTime);
    }

    if (searchEndTime) {
      endMinute = parseTimeToMinutes(searchEndTime);
    } else if (startMinute != null && searchDuration > 0) {
      endMinute = startMinute + searchDuration;
    }

    onSearch?.({
      minPrice: minPrice === 0 ? undefined : minPrice,
      maxPrice: maxPrice === 100 ? undefined : maxPrice,
      dayOfWeek,
      startMinute,
      endMinute,
      lat: (userLocation && userLocation.address) ? userLocation.lat : undefined,
      lng: (userLocation && userLocation.address) ? userLocation.lng : undefined,
    });
    setShowFilters(false);
  };

  return (
    <aside className="vehicle-sidebar">
      <div className="vehicle-sidebar__header">
        <h2 className="vehicle-sidebar__title">
          {showFilters ? 'Filter Instructors' : 'Instructors Available'}
        </h2>
        <div className="vehicle-sidebar__header-actions">
          <button
            className="vehicle-sidebar__header-btn"
            onClick={() => setShowFilters(!showFilters)}
            title={showFilters ? 'Show instructors' : 'Edit filters'}
          >
            {showFilters ? 'Instructors' : 'Filters'}
          </button>
        </div>
      </div>

      {showFilters ? (
        <div className="vehicle-sidebar__filters vehicle-sidebar__filters--full">
          <div className="vehicle-sidebar__filter-group">
            <div className="vehicle-sidebar__price-label">
              <span className="vehicle-sidebar__filter-label">Hourly Price</span>
              <span className="vehicle-sidebar__price-current">
                ${minPrice} — {maxPrice === 100 ? 'Any' : `$${maxPrice}`}
              </span>
            </div>
            <div className="vehicle-sidebar__price-slider">
              <div className="vehicle-sidebar__price-slider-track" />
              <div
                className="vehicle-sidebar__price-slider-progress"
                style={{
                  left: `${(minPrice / 100) * 100}%`,
                  right: `${100 - (maxPrice / 100) * 100}%`,
                }}
              />
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minPrice}
                onChange={handleMinPriceChange}
              />
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={maxPrice}
                onChange={handleMaxPriceChange}
              />
            </div>
          </div>

          <div className="vehicle-sidebar__filter-group">
            <span className="vehicle-sidebar__filter-label">Date</span>
            <input
              type="date"
              className="vehicle-sidebar__filter-input"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
            />
          </div>

          <div className="vehicle-sidebar__filter-group">
            <span className="vehicle-sidebar__filter-label">Time Interval</span>
            <div className="vehicle-sidebar__filter-row">
              <select
                className="vehicle-sidebar__filter-select"
                value={searchStartTime}
                onChange={(e) => setSearchStartTime(e.target.value)}
              >
                <option value="">Any Start</option>
                {TIME_OPTIONS.map((time) => (
                  <option key={`start-${time}`} value={time}>{time}</option>
                ))}
              </select>
              <select
                className="vehicle-sidebar__filter-select"
                value={searchEndTime}
                onChange={(e) => setSearchEndTime(e.target.value)}
              >
                <option value="">Any End</option>
                {TIME_OPTIONS.map((time) => (
                  <option key={`end-${time}`} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="vehicle-sidebar__filter-group">
            <span className="vehicle-sidebar__filter-label">Duration</span>
            <select
              className="vehicle-sidebar__filter-select"
              value={searchDuration}
              onChange={(e) => setSearchDuration(Number(e.target.value))}
            >
              <option value="0">Any Duration</option>
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <LocationPicker
            key={searchKey}
            initialAddress={userLocation?.address || ''}
            draftLocation={showFilters ? (draftLocation || null) : (userLocation ? { lat: userLocation.lat, lng: userLocation.lng, address: userLocation.address || '' } : null)}
            onLocationChange={(loc) => {
              setUserLocation(loc);
              onLocationChange?.(loc);
            }}
            onClear={() => {
              setUserLocation(null);
              onClearSearch?.();
            }}
            label="Search Center"
            placeholder="Search address to center..."
          />

          <div className="vehicle-sidebar__filter-actions">
            <button className="vehicle-sidebar__search-btn" onClick={handleSearch}>
              Search Instructors
            </button>
            <button className="vehicle-sidebar__clear-all-btn" onClick={handleClearAll}>
              Clear All
            </button>
          </div>
        </div>
      ) : (
        <>
          {!loading && instructors.length > 0 && (
            <div className="vehicle-sidebar__results-header">
              Instructors Found ({instructors.length})
            </div>
          )}

          <div className="vehicle-sidebar__list">
            {loading && (
              <div className="vehicle-sidebar__status">
                <div className="vehicle-sidebar__spinner" />
                Loading instructors...
              </div>
            )}

            {error && (
              <div className="vehicle-sidebar__status vehicle-sidebar__status--error">
                {error}
                <button className="vehicle-sidebar__retry-btn" onClick={onRetry}>Retry</button>
              </div>
            )}

            {!loading && !error && instructors.length === 0 && (
              <div className="vehicle-sidebar__status vehicle-sidebar__status--empty">
                <p>No instructors found.</p>
                <button
                  className="vehicle-sidebar__retry-btn"
                  onClick={() => setShowFilters(true)}
                  style={{ color: '#646cff', borderColor: '#646cff' }}
                >
                  Adjust Filters
                </button>
              </div>
            )}

            {instructors.map((instructor) => (
              <InstructorCard
                key={instructor.id}
                instructor={instructor}
                isSelected={instructor.id === selectedInstructorId}
                onLocate={onLocateInstructor}
                cardRef={(el) => {
                  cardRefs.current[instructor.id] = el;
                }}
              />
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
