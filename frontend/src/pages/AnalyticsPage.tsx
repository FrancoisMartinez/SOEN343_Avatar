import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchCarUtilizationAnalytics,
  fetchServiceHealthAnalytics,
  type CarUtilization,
  type ServiceHealthMetric,
} from '../services/analyticsService';
import './AnalyticsPage.css';

export default function AnalyticsPage() {
  const { isAuthenticated, role } = useAuth();
  const isAdmin = isAuthenticated && role === 'ADMIN';

  const [analytics, setAnalytics] = useState<CarUtilization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealthMetric[]>([]);
  const [serviceHealthLoading, setServiceHealthLoading] = useState(false);
  const [serviceHealthError, setServiceHealthError] = useState<string | null>(null);

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
  const slowestEndpoints = [...serviceHealth]
    .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)
    .slice(0, 5);
  const maxServiceLatency = slowestEndpoints.length > 0 ? slowestEndpoints[0].avgLatencyMs : 0;

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = startDateInput ? `${startDateInput}T00:00:00` : undefined;
      const endDate = endDateInput ? `${endDateInput}T23:59:59` : undefined;

      const response = await fetchCarUtilizationAnalytics({
        startDate,
        endDate,
      });

      setAnalytics(response.carUtilizations);
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [startDateInput, endDateInput]);

  const loadServiceHealth = useCallback(async () => {
    try {
      setServiceHealthLoading(true);
      setServiceHealthError(null);
      const response = await fetchServiceHealthAnalytics();
      setServiceHealth(response);
    } catch (err: any) {
      setServiceHealthError(err.message ?? 'Failed to fetch service health analytics');
    } finally {
      setServiceHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
      loadServiceHealth();
    }
  }, [isAdmin, loadAnalytics, loadServiceHealth]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="analytics-page">
        <h2 className="analytics-title">Analytics</h2>
        <p>This dashboard is available for admins only.</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <section className="analytics-card">
        <h2 className="analytics-title">Rental Analytics Dashboard</h2>

        <div className="analytics-filters">
          <label className="analytics-filter-group">
            <span className="analytics-filter-label">Start Date</span>
            <input
              type="date"
              value={startDateInput}
              onChange={(e) => setStartDateInput(e.target.value)}
              className="analytics-input"
            />
          </label>

          <label className="analytics-filter-group">
            <span className="analytics-filter-label">End Date</span>
            <input
              type="date"
              value={endDateInput}
              onChange={(e) => setEndDateInput(e.target.value)}
              className="analytics-input"
            />
          </label>

          <div className="analytics-btn-group">
            <button onClick={loadAnalytics}>
              Apply
            </button>
            <button
              onClick={() => {
                setStartDateInput('');
                setEndDateInput('');
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {loading && <p>Loading analytics…</p>}
        {error && <p className="analytics-error">{error}</p>}

        {!loading && !error && analytics.length === 0 && <p>No analytics available yet.</p>}

        {!loading && !error && analytics.length > 0 && (
          <>
            <div className="analytics-stats-grid">
              <div className="analytics-stat-card">
                <div className="analytics-stat-label">Total Bookings</div>
                <div className="analytics-stat-value">{totalBookings}</div>
              </div>
              <div className="analytics-stat-card">
                <div className="analytics-stat-label">Total Hours</div>
                <div className="analytics-stat-value">{totalHours}</div>
              </div>
              <div className="analytics-stat-card">
                <div className="analytics-stat-label">Total Revenue</div>
                <div className="analytics-stat-value">${totalRevenue.toFixed(2)}</div>
              </div>
              <div className="analytics-stat-card">
                <div className="analytics-stat-label">Avg Utilization</div>
                <div className="analytics-stat-value">{avgUtilization.toFixed(1)}%</div>
              </div>
            </div>

            <div className="analytics-charts-grid">
              <section className="analytics-chart-section">
                <h3 className="analytics-chart-title">Utilization by Car</h3>
                <div className="analytics-chart-list">
                  {utilizationChartData.map((item) => {
                    const widthPercent = Math.max(0, Math.min(100, item.utilizationPercentage));
                    return (
                      <div key={`util-${item.carId}`}>
                        <div className="analytics-chart-item-header">
                          <span>{item.makeModel}</span>
                          <span>{item.utilizationPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="analytics-chart-bar-container">
                          <div
                            className="analytics-chart-bar"
                            style={{
                              width: `${widthPercent}%`,
                              background: '#6366f1',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="analytics-chart-section">
                <h3 className="analytics-chart-title">Revenue by Car</h3>
                <div className="analytics-chart-list">
                  {revenueChartData.map((item) => {
                    const widthPercent = maxRevenue > 0 ? (item.totalRevenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={`rev-${item.carId}`}>
                        <div className="analytics-chart-item-header">
                          <span>{item.makeModel}</span>
                          <span>${item.totalRevenue.toFixed(2)}</span>
                        </div>
                        <div className="analytics-chart-bar-container">
                          <div
                            className="analytics-chart-bar"
                            style={{
                              width: `${widthPercent}%`,
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

            <div className="analytics-table-container">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Car</th>
                    <th className="analytics-table-num">Bookings</th>
                    <th className="analytics-table-num">Hours</th>
                    <th className="analytics-table-num">Utilization</th>
                    <th className="analytics-table-num">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.map((item) => (
                    <tr key={item.carId}>
                      <td>{item.makeModel}</td>
                      <td className="analytics-table-num">{item.totalBookings}</td>
                      <td className="analytics-table-num">{item.totalBookingHours}</td>
                      <td className="analytics-table-num">{item.utilizationPercentage.toFixed(1)}%</td>
                      <td className="analytics-table-num">${item.totalRevenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <section className="analytics-health-section">
          <div className="analytics-health-header">
            <h3 className="analytics-health-title">Service Health</h3>
            <button onClick={loadServiceHealth} className="analytics-refresh-btn">Refresh</button>
          </div>

          {serviceHealthLoading && <p>Loading service health…</p>}
          {serviceHealthError && <p className="analytics-error">{serviceHealthError}</p>}
          {!serviceHealthLoading && !serviceHealthError && serviceHealth.length === 0 && (
            <p>No service metrics captured yet.</p>
          )}

          {!serviceHealthLoading && !serviceHealthError && serviceHealth.length > 0 && (
            <>
              <section className="analytics-chart-section analytics-health-slowest">
                <h4 className="analytics-chart-title analytics-health-sub">Top 5 Slowest Endpoints</h4>
                <div className="analytics-chart-list">
                  {slowestEndpoints.map((item) => {
                    const widthPercent = maxServiceLatency > 0 ? (item.avgLatencyMs / maxServiceLatency) * 100 : 0;
                    return (
                      <div key={`slow-${item.method}-${item.path}`}>
                        <div className="analytics-chart-item-header">
                          <span>{item.method} {item.path}</span>
                          <span>{item.avgLatencyMs.toFixed(1)} ms</span>
                        </div>
                        <div className="analytics-chart-bar-container">
                          <div
                            className="analytics-chart-bar"
                            style={{
                              width: `${widthPercent}%`,
                              background: '#f97316',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="analytics-table-container">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Method</th>
                      <th>Path</th>
                      <th className="analytics-table-num">Requests</th>
                      <th className="analytics-table-num">Errors</th>
                      <th className="analytics-table-num">Avg Latency (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceHealth.map((item) => (
                      <tr key={`${item.method}-${item.path}`}>
                        <td>{item.method}</td>
                        <td>{item.path}</td>
                        <td className="analytics-table-num">{item.requestCount}</td>
                        <td className="analytics-table-num">{item.errorCount}</td>
                        <td className="analytics-table-num">{item.avgLatencyMs.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </section>
    </div>
  );
}
