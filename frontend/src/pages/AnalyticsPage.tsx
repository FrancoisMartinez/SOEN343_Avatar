import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchCarUtilizationAnalytics, type CarUtilization } from '../services/analyticsService';

export default function AnalyticsPage() {
  const { isAuthenticated, role, userId } = useAuth();
  const isCarProvider = isAuthenticated && role === 'CAR_PROVIDER';

  const [analytics, setAnalytics] = useState<CarUtilization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');

  const loadAnalytics = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const startDate = startDateInput ? `${startDateInput}T00:00:00` : undefined;
      const endDate = endDateInput ? `${endDateInput}T23:59:59` : undefined;

      const response = await fetchCarUtilizationAnalytics({
        providerId: userId,
        startDate,
        endDate,
      });

      setAnalytics(response.carUtilizations);
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [userId, startDateInput, endDateInput]);

  useEffect(() => {
    if (isCarProvider) {
      loadAnalytics();
    }
  }, [isCarProvider, loadAnalytics]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isCarProvider) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <h2 style={{ marginTop: 0 }}>Analytics</h2>
        <p>This dashboard is available for car providers only.</p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
      <section style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '0.75rem', background: '#fff' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.2rem' }}>Rental Analytics Dashboard</h2>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' }}>
            Start Date
            <input
              type="date"
              value={startDateInput}
              onChange={(e) => setStartDateInput(e.target.value)}
              style={{ padding: '0.4rem' }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.9rem' }}>
            End Date
            <input
              type="date"
              value={endDateInput}
              onChange={(e) => setEndDateInput(e.target.value)}
              style={{ padding: '0.4rem' }}
            />
          </label>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <button onClick={loadAnalytics} style={{ padding: '0.5rem 0.75rem' }}>
              Apply
            </button>
            <button
              onClick={() => {
                setStartDateInput('');
                setEndDateInput('');
              }}
              style={{ padding: '0.5rem 0.75rem' }}
            >
              Clear
            </button>
          </div>
        </div>

        {loading && <p style={{ margin: 0 }}>Loading analytics…</p>}
        {error && <p style={{ margin: 0, color: '#b91c1c' }}>{error}</p>}

        {!loading && !error && analytics.length === 0 && <p style={{ margin: 0 }}>No analytics available yet.</p>}

        {!loading && !error && analytics.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.25rem' }}>Car</th>
                  <th style={{ textAlign: 'right', padding: '0.4rem 0.25rem' }}>Bookings</th>
                  <th style={{ textAlign: 'right', padding: '0.4rem 0.25rem' }}>Hours</th>
                  <th style={{ textAlign: 'right', padding: '0.4rem 0.25rem' }}>Utilization</th>
                  <th style={{ textAlign: 'right', padding: '0.4rem 0.25rem' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((item) => (
                  <tr key={item.carId}>
                    <td style={{ padding: '0.4rem 0.25rem' }}>{item.makeModel}</td>
                    <td style={{ textAlign: 'right', padding: '0.4rem 0.25rem' }}>{item.totalBookings}</td>
                    <td style={{ textAlign: 'right', padding: '0.4rem 0.25rem' }}>{item.totalBookingHours}</td>
                    <td style={{ textAlign: 'right', padding: '0.4rem 0.25rem' }}>{item.utilizationPercentage.toFixed(1)}%</td>
                    <td style={{ textAlign: 'right', padding: '0.4rem 0.25rem' }}>${item.totalRevenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
