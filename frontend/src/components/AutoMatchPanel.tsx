import { useState } from 'react';
import type { CarData } from '../services/vehicleService';
import type { MatchResultData } from '../services/matchingService';
import { autoMatch } from '../services/matchingService';
import { useAuth } from '../contexts/AuthContext';
import './AutoMatchPanel.css';

interface AutoMatchPanelProps {
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onMatchSelect: (result: MatchResultData) => void;
}

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00',
];

function carDataFromResult(r: MatchResultData): CarData {
  return {
    id: r.carId,
    makeModel: r.makeModel,
    transmissionType: r.transmissionType,
    location: r.location,
    latitude: r.latitude,
    longitude: r.longitude,
    available: true,
    hourlyRate: r.hourlyRate,
  };
}

export default function AutoMatchPanel({
  userLocation,
  onClose,
  onMatchSelect,
}: AutoMatchPanelProps) {
  const { userId } = useAuth();
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(1);
  const [transmissionPreference, setTransmissionPreference] = useState('');
  const [results, setResults] = useState<MatchResultData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAutoMatch = async () => {
    setError(null);

    if (!userLocation) {
      setError('Location access required for auto-match');
      return;
    }

    if (!date || !startTime) {
      setError('Please select a date and time');
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
        date,
        startTime,
        duration,
        learnerLat: userLocation.lat,
        learnerLng: userLocation.lng,
        transmissionPreference: transmissionPreference || undefined,
      });
      setResults(matchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find matches');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auto-match-panel">
      <div className="auto-match-panel__header">
        <h3>Auto-Match</h3>
        <button className="auto-match-panel__close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="auto-match-panel__form">
        <div className="auto-match-panel__form-group">
          <label htmlFor="match-date">Date</label>
          <input
            id="match-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="auto-match-panel__form-group">
          <label htmlFor="match-time">Start Time</label>
          <select
            id="match-time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="auto-match-panel__form-group">
          <label htmlFor="match-duration">Duration (hrs)</label>
          <select
            id="match-duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <div className="auto-match-panel__form-group">
          <label htmlFor="match-transmission">Transmission</label>
          <select
            id="match-transmission"
            value={transmissionPreference}
            onChange={(e) => setTransmissionPreference(e.target.value)}
          >
            <option value="">Any</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </div>

        {error && <div className="auto-match-panel__error">{error}</div>}

        <button
          className="auto-match-panel__submit"
          onClick={handleAutoMatch}
          disabled={loading}
        >
          {loading ? 'Finding Matches...' : 'Find Best Match'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="auto-match-panel__results">
          {results.map((result, idx) => (
            <div key={result.carId} className="auto-match-panel__result-card">
              <div className="auto-match-panel__rank">#{idx + 1}</div>
              <div className="auto-match-panel__card-info">
                <div className="auto-match-panel__car-name">{result.makeModel}</div>
                <div className="auto-match-panel__location">{result.location}</div>
                <div className="auto-match-panel__distance">
                  {result.distanceKm.toFixed(1)} km
                </div>
                <div className="auto-match-panel__cost">${result.totalCost.toFixed(2)}</div>
              </div>
              <div className="auto-match-panel__score-container">
                <div className="auto-match-panel__score-label">Score</div>
                <div className="auto-match-panel__score-bar">
                  <div
                    className="auto-match-panel__score-fill"
                    style={{ width: `${result.compositeScore}%` }}
                  />
                </div>
                <div className="auto-match-panel__score-value">
                  {result.compositeScore.toFixed(0)}%
                </div>
              </div>
              <button
                className="auto-match-panel__book-btn"
                onClick={() => {
                  // Directly book with auto-match criteria and close panel
                  onMatchSelect(result);
                  onClose();
                }}
              >
                Book This
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && date && !error && (
        <div className="auto-match-panel__empty">No matching cars found for your criteria.</div>
      )}
    </div>
  );
}
