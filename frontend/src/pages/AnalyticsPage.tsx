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

  const totalBookings = analytics.reduce((sum, item) => sum + item.totalBookings, 0);
  const totalHours = analytics.reduce((sum, item) => sum + item.totalBookingHours, 0);
  const totalRevenue = analytics.reduce((sum, item) => sum + item.totalRevenue, 0);
  const avgUtilization = analytics.length > 0
    ? analytics.reduce((sum, item) => sum + item.utilizationPercentage, 0) / analytics.length
    : 0;
  const utilizationChartData = [...analytics].sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);
  const revenueChartData = [...analytics].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const maxRevenue = revenueChartData.length > 0 ? revenueChartData[0].totalRevenue : 0;

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
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total Bookings</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{totalBookings}</div>
              </div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total Hours</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{totalHours}</div>
              </div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Total Revenue</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>${totalRevenue.toFixed(2)}</div>
              </div>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Avg Utilization</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{avgUtilization.toFixed(1)}%</div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <section style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.6rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Utilization by Car</h3>
                <div style={{ display: 'grid', gap: '0.45rem' }}>
                  {utilizationChartData.map((item) => {
                    const widthPercent = Math.max(0, Math.min(100, item.utilizationPercentage));
                    return (
                      <div key={`util-${item.carId}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
                          <span>{item.makeModel}</span>
                          <span>{item.utilizationPercentage.toFixed(1)}%</span>
                        </div>
                        <div style={{ height: '8px', borderRadius: '999px', background: '#f1f5f9', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${widthPercent}%`,
                              height: '100%',
                              borderRadius: '999px',
                              background: '#6366f1',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.6rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Revenue by Car</h3>
                <div style={{ display: 'grid', gap: '0.45rem' }}>
                  {revenueChartData.map((item) => {
                    const widthPercent = maxRevenue > 0 ? (item.totalRevenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={`rev-${item.carId}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
                          <span>{item.makeModel}</span>
                          <span>${item.totalRevenue.toFixed(2)}</span>
                        </div>
                        <div style={{ height: '8px', borderRadius: '999px', background: '#f1f5f9', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${widthPercent}%`,
                              height: '100%',
                              borderRadius: '999px',
                              background: '#22c55e',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

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
          </>
        )}
      </section>
    </div>
  );
}
