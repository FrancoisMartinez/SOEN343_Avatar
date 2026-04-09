import { useState, useEffect, useCallback, useRef } from 'react';
import type { MatchResultData } from '../services/matchingService';
import { autoMatch } from '../services/matchingService';
import { useAuth } from '../contexts/AuthContext';
import BookingPanel from './BookingPanel';
import LocationPicker from './LocationPicker';
import type { DraftLocation } from './VehicleFormModal';
import './AutoMatchPanel.css';

interface AutoMatchPanelProps {
  userLocation: { lat: number; lng: number; address?: string } | null;
  onClose: () => void;
  onMatchSelect: (result: MatchResultData) => void;
  draftLocation?: DraftLocation | null;
  searchCenter?: DraftLocation | null;
  searchRadius?: number;
  onSearchRadiusChange?: (radius: number) => void;
  onFormOpen?: (item: any | null, purpose?: 'search' | 'vehicle' | 'instructor') => void;
  onFormClose?: () => void;
  onLocationChange?: (loc: DraftLocation | null) => void;
  onClearSearch?: () => void;
  onResults?: (results: MatchResultData[]) => void;
}

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
];

export default function AutoMatchPanel({
  userLocation,
  onClose,
  onMatchSelect,
  draftLocation,
  searchCenter,
  searchRadius = 50,
  onSearchRadiusChange,
  onFormOpen,
  onFormClose,
  onLocationChange,
  onClearSearch,
  onResults,
}: AutoMatchPanelProps) {
  const { userId } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<MatchResultData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKey, setSearchKey] = useState(0);

  // Filter state (synced with VehicleSidebar patterns)
  const [transmissionPreference, setTransmissionPreference] = useState('');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);
  const [searchDate, setSearchDate] = useState('');
  const [searchStartTime, setSearchStartTime] = useState('');
  const [searchDuration, setSearchDuration] = useState(0);

  const [selectedMatch, setSelectedMatch] = useState<MatchResultData | null>(null);

  const toSliderValue = (r: number) => (r === 0.5 ? 0 : r);
  const fromSliderValue = (v: number) => (v === 0 ? 0.5 : v);

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

  const handleAutoMatch = useCallback(async () => {
    setError(null);

    // Use searchCenter or userLocation as the primary lat/lng
    const activeLocation = searchCenter || userLocation;

    if (!activeLocation) {
      setError('Location access required for auto-match');
      return;
    }

    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const matchResults = await autoMatch({
        learnerId: userId,
        date: searchDate || undefined,
        startTime: searchStartTime || undefined,
        duration: searchDuration > 0 ? searchDuration / 60 : undefined,
        learnerLat: activeLocation.lat,
        learnerLng: activeLocation.lng,
        transmissionPreference: transmissionPreference || undefined,
        radius: searchRadius >= 50 ? undefined : searchRadius,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice === 100 ? undefined : maxPrice,
      });
      setResults(matchResults);
      onResults?.(matchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find matches');
    } finally {
      setLoading(false);
    }
  }, [userId, searchCenter, userLocation, searchDate, searchStartTime, searchDuration, transmissionPreference, searchRadius, minPrice, maxPrice, onResults]);

  // Handle Find Match button click
  const handleFindMatchClick = async () => {
    await handleAutoMatch();
    setShowFilters(false);
  };

  // Initial load - only if we haven't loaded yet and have a location
  const hasInitialLoaded = useRef(false);
  useEffect(() => {
    if (userLocation && userId && !hasInitialLoaded.current) {
      handleAutoMatch();
      hasInitialLoaded.current = true;
    }
  }, [userLocation?.lat, userLocation?.lng, userId, handleAutoMatch]);

  const handleBookNow = (result: MatchResultData) => {
    setSelectedMatch(result);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxPrice - 5);
    setMinPrice(val);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minPrice + 5);
    setMaxPrice(val);
  };

  const handleClearAll = () => {
    setTransmissionPreference('');
    setMinPrice(0);
    setMaxPrice(100);
    setSearchDate('');
    setSearchStartTime('');
    setSearchDuration(0);
    setSearchKey(prev => prev + 1);
    
    onLocationChange?.(null);
    onClearSearch?.();
  };

  return (
    <aside className="vehicle-sidebar auto-match-sidebar">
      <div className="vehicle-sidebar__header">
        <h2 className="vehicle-sidebar__title">
          {showFilters ? 'Filter Auto-Match' : 'Auto-Match Results'}
        </h2>
        <div className="vehicle-sidebar__header-actions">
          <button
            className="vehicle-sidebar__header-btn"
            onClick={() => setShowFilters(!showFilters)}
            title={showFilters ? 'Show matches' : 'Edit filters'}
          >
            {showFilters ? 'Matches' : 'Filters'}
          </button>
        </div>
      </div>

      {showFilters ? (
        <div className="vehicle-sidebar__filters vehicle-sidebar__filters--full">
          <div className="vehicle-sidebar__filter-group">
            <span className="vehicle-sidebar__filter-label">Transmission</span>
            <select
              className="vehicle-sidebar__filter-select"
              value={transmissionPreference}
              onChange={(e) => setTransmissionPreference(e.target.value)}
            >
              <option value="">Any Transmission</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>

          <div className="vehicle-sidebar__filter-group">
            <div className="vehicle-sidebar__price-label">
              <span className="vehicle-sidebar__filter-label">Total Hourly Rate</span>
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
            <span className="vehicle-sidebar__filter-label">Start Time</span>
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
              onLocationChange?.(loc);
            }}
            onClear={() => {
              onLocationChange?.(null);
              onClearSearch?.();
            }}
            label="Search Center"
            placeholder="Search address to center..."
          />

          <div className="vehicle-sidebar__filter-group">
            <div className="vehicle-sidebar__price-label">
              <span className="vehicle-sidebar__filter-label">Search Radius</span>
              <span className="vehicle-sidebar__price-current">{searchRadius >= 50 ? 'Unlimited' : `${searchRadius} km`}</span>
            </div>
            <div className="vehicle-sidebar__price-slider">
              <div className="vehicle-sidebar__price-slider-track" />
              <div
                className="vehicle-sidebar__price-slider-progress"
                style={{
                  left: '0%',
                  right: `${100 - (toSliderValue(searchRadius) / 50) * 100}%`,
                }}
              />
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={toSliderValue(searchRadius)}
                onChange={(e) => onSearchRadiusChange?.(fromSliderValue(Number(e.target.value)))}
              />
            </div>
          </div>

          {error && <div className="vehicle-sidebar__status vehicle-sidebar__status--error" style={{ padding: '0.5rem', fontSize: '0.8rem' }}>{error}</div>}

          <div className="vehicle-sidebar__filter-actions">
            <button className="vehicle-sidebar__search-btn" onClick={handleFindMatchClick}>
              Find Best Match
            </button>
            <button className="vehicle-sidebar__clear-all-btn" onClick={handleClearAll}>
              Clear All
            </button>
          </div>
        </div>
      ) : (
        <div className="vehicle-sidebar__list">
          {loading && (
            <div className="vehicle-sidebar__status">
              <div className="vehicle-sidebar__spinner" />
              Finding best matches...
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <div className="vehicle-sidebar__results-header">
                Best Matches Found ({results.length})
              </div>
              {results.map((result, idx) => (
                <div key={`${result.carId}-${result.instructorId}`} className="vehicle-card auto-match-result-card">
                  <div className="auto-match-panel__rank-badge">#{idx + 1}</div>
                  <div className="vehicle-card__header">
                    <h3 className="vehicle-card__title">{result.makeModel}</h3>
                    <span className="vehicle-card__badge vehicle-card__badge--available">
                      {result.compositeScore.toFixed(0)}% Match
                    </span>
                  </div>

                  <div className="vehicle-card__details">
                    <div className="vehicle-card__detail">
                      <span className="vehicle-card__label">Car Location</span>
                      <span className="vehicle-card__value">{result.location}</span>
                    </div>
                    <div className="vehicle-card__detail">
                      <span className="vehicle-card__label">Distance</span>
                      <span className="vehicle-card__value">{result.distanceKm.toFixed(1)} km</span>
                    </div>
                    <div className="vehicle-card__detail">
                      <span className="vehicle-card__label">Instructor</span>
                      <span className="vehicle-card__value">{result.instructorName}</span>
                    </div>
                    <div className="vehicle-card__detail">
                      <span className="vehicle-card__label">Total Rate</span>
                      <span className="vehicle-card__value" style={{ color: '#4ade80', fontWeight: 'bold' }}>
                        ${(result.hourlyRate + result.instructorHourlyRate).toFixed(2)}/hr
                      </span>
                    </div>
                  </div>

                  <div className="auto-match-panel__score-bar-container">
                    <div className="auto-match-panel__score-bar-bg">
                      <div
                        className="auto-match-panel__score-bar-fill"
                        style={{ width: `${result.compositeScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="vehicle-card__actions">
                    <button
                      className="vehicle-card__btn vehicle-card__btn--locate"
                      onClick={() => onMatchSelect(result)}
                    >
                      View on Map
                    </button>
                    <button
                      className="vehicle-card__btn vehicle-card__btn--confirm"
                      onClick={() => handleBookNow(result)}
                      disabled={loading}
                    >
                      Book Now
                    </button>
                  </div>

                  {selectedMatch?.carId === result.carId && selectedMatch?.instructorId === result.instructorId && (
                    <div className="vehicle-card__booking-overlay" onClick={(e) => e.stopPropagation()}>
                      <BookingPanel
                        car={{
                          id: result.carId,
                          makeModel: result.makeModel,
                          transmissionType: result.transmissionType,
                          location: result.location,
                          latitude: result.latitude,
                          longitude: result.longitude,
                          available: true,
                          hourlyRate: result.hourlyRate,
                        }}
                        instructor={{
                          id: result.instructorId,
                          fullName: result.instructorName,
                          email: '',
                          latitude: 0,
                          longitude: 0,
                          travelRadius: 0,
                          hourlyRate: result.instructorHourlyRate,
                          rating: result.instructorRating,
                        }}
                        onClose={() => setSelectedMatch(null)}
                        onBooked={() => {
                          setSelectedMatch(null);
                          onClose();
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {!loading && results.length === 0 && !error && (
            <div className="vehicle-sidebar__status vehicle-sidebar__status--empty">
              No matching pairs found for your criteria.
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
