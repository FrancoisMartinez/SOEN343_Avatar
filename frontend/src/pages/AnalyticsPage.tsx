import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchCarUtilizationAnalytics,
  fetchServiceHealthAnalytics,
  getDashboardAnalytics,
  calculateMetrics,
  type CarUtilization,
  type ServiceHealthMetric,
  type DashboardAnalytics,
} from '../services/analyticsService';
import './AnalyticsPage.css';

const STAT_LABELS: Record<string, string> = {
  activeUsers: 'Active Users',
  activeCars: 'Active Cars',
  activeInstructors: 'Active Instructors',
  totalBookings: 'Total Bookings',
  totalRevenue: 'Total Revenue',
  totalSpent: 'Total Spent',
  totalTimeSpentMinutes: 'Time Spent (Mins)',
  totalEarned: 'Total Earned',
};

const CHART_TITLES: Record<string, string> = {
  usageByCarType: 'Usage by Car Type',
  topLearners: 'Top Learners',
  topInstructors: 'Top Instructors',
  timeWithInstructor: 'Time Spent with Instructors',
  bookingsByCar: 'Bookings by Car',
};

export default function AnalyticsPage() {
  const { isAuthenticated, role } = useAuth();
  const isAdmin = isAuthenticated && role === 'ADMIN';
  const isProvider = isAuthenticated && (role === 'CAR_PROVIDER' || role === 'PROVIDER');

  // Generic Dashboard Data (Stats & Charts)
  const [dashboard, setDashboard] = useState<DashboardAnalytics | null>(null);
  
  // Detailed Rental/Car Data (Admin & Provider)
  const [carAnalytics, setCarAnalytics] = useState<CarUtilization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Service Health Data (Admin only)
  const [serviceHealth, setServiceHealth] = useState<ServiceHealthMetric[]>([]);
  const [serviceHealthLoading, setServiceHealthLoading] = useState(false);
  const [serviceHealthError, setServiceHealthError] = useState<string | null>(null);

  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDashboardAnalytics();
      setDashboard(data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCarAnalytics = useCallback(async () => {
    if (!isAdmin && !isProvider) return;
    try {
      setLoading(true);
      setError(null);
      const startDate = startDateInput ? `${startDateInput}T00:00:00` : undefined;
      const endDate = endDateInput ? `${endDateInput}T23:59:59` : undefined;

      const response = await fetchCarUtilizationAnalytics({ startDate, endDate });
      setCarAnalytics(response.carUtilizations);
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch car utilization analytics');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isProvider, startDateInput, endDateInput]);

  const loadServiceHealth = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setServiceHealthLoading(true);
      setServiceHealthError(null);
      const response = await fetchServiceHealthAnalytics();
      setServiceHealth(response);
    } catch (err: any) {
      setServiceHealthError(err.message ?? 'Failed to fetch service health');
    } finally {
      setServiceHealthLoading(false);
    }
  }, [isAdmin]);

  const handleCalculateMetrics = async () => {
    try {
      await calculateMetrics();
      await loadDashboard();
      if (isAdmin || isProvider) await loadCarAnalytics();
    } catch (err: any) {
      alert('Failed to calculate metrics: ' + err.message);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
      if (isAdmin || isProvider) loadCarAnalytics();
      if (isAdmin) loadServiceHealth();
    }
  }, [isAuthenticated, isAdmin, isProvider, loadDashboard, loadCarAnalytics, loadServiceHealth]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Charts from Car Analytics (Utilization & Revenue)
  const utilizationChartData = [...carAnalytics].sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);
  const revenueChartData = [...carAnalytics].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const maxRevenue = revenueChartData.length > 0 ? revenueChartData[0].totalRevenue : 0;

  // Service Health calculations
  const slowestEndpoints = [...serviceHealth]
    .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)
    .slice(0, 5);
  const maxServiceLatency = slowestEndpoints.length > 0 ? slowestEndpoints[0].avgLatencyMs : 0;

  return (
    <div className="analytics-page">
      <section className="analytics-card">
        <h2 className="analytics-title">
          {isAdmin ? 'System Analytics Dashboard' : (isProvider ? 'Rental Analytics Dashboard' : 'My Analytics Dashboard')}
        </h2>

        {(isAdmin || isProvider) && (
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
              <button onClick={loadCarAnalytics}>Apply</button>
              <button onClick={() => { setStartDateInput(''); setEndDateInput(''); }}>Clear</button>
              {isAdmin && <button onClick={handleCalculateMetrics}>Calculate Metrics Now</button>}
            </div>
          </div>
        )}

        {loading && <p>Loading analytics…</p>}
        {error && <p className="analytics-error">{error}</p>}

        {!loading && dashboard && (
          <>
            <div className="analytics-stats-grid">
              {Object.entries(dashboard.stats).map(([key, value]) => (
                <div className="analytics-stat-card" key={key}>
                  <div className="analytics-stat-label">{STAT_LABELS[key] || key}</div>
                  <div className="analytics-stat-value">
                    {key.toLowerCase().includes('revenue') || key.toLowerCase().includes('spent') || key.toLowerCase().includes('earned')
                      ? `$${Number(value).toFixed(2)}`
                      : String(value)}
                  </div>
                </div>
              ))}
            </div>

            <div className="analytics-charts-grid">
              {/* Specialized Car Charts for Admin/Provider */}
              {(isAdmin || isProvider) && carAnalytics.length > 0 && (
                <>
                  <section className="analytics-chart-section">
                    <h3 className="analytics-chart-title">Utilization by Car</h3>
                    <div className="analytics-chart-list">
                      {utilizationChartData.slice(0, 5).map((item) => (
                        <div key={`util-${item.carId}`}>
                          <div className="analytics-chart-item-header">
                            <span>{item.makeModel}</span>
                            <span>{item.utilizationPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="analytics-chart-bar-container">
                            <div className="analytics-chart-bar" style={{ width: `${Math.min(100, item.utilizationPercentage)}%`, background: '#6366f1' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="analytics-chart-section">
                    <h3 className="analytics-chart-title">Revenue by Car</h3>
                    <div className="analytics-chart-list">
                      {revenueChartData.slice(0, 5).map((item) => (
                        <div key={`rev-${item.carId}`}>
                          <div className="analytics-chart-item-header">
                            <span>{item.makeModel}</span>
                            <span>${item.totalRevenue.toFixed(2)}</span>
                          </div>
                          <div className="analytics-chart-bar-container">
                            <div className="analytics-chart-bar" style={{ width: `${maxRevenue > 0 ? (item.totalRevenue / maxRevenue) * 100 : 0}%`, background: '#22c55e' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {/* Dynamic Dashboard Charts */}
              {Object.entries(dashboard.charts).map(([chartKey, chartData]) => {
                const title = CHART_TITLES[chartKey] || chartKey;
                const dataEntries = Object.entries(chartData);
                if (dataEntries.length === 0) return null;
                const maxVal = Math.max(...dataEntries.map(([, v]) => v), 1);

                return (
                  <section className="analytics-chart-section" key={chartKey}>
                    <h3 className="analytics-chart-title">{title}</h3>
                    <div className="analytics-chart-list">
                      {dataEntries.slice(0, 5).map(([label, count]) => (
                        <div key={`${chartKey}-${label}`}>
                          <div className="analytics-chart-item-header">
                            <span>{label}</span>
                            <span>{count}</span>
                          </div>
                          <div className="analytics-chart-bar-container">
                            <div className="analytics-chart-bar" style={{ width: `${(count / maxVal) * 100}%`, background: '#818cf8' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}

        {/* Detailed Utilization Table for Admin/Provider */}
        {(isAdmin || isProvider) && carAnalytics.length > 0 && (
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
                {carAnalytics.map((item) => (
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
        )}

        {/* Service Health for Admin only */}
        {isAdmin && (
          <section className="analytics-health-section">
            <div className="analytics-health-header">
              <h3 className="analytics-health-title">Service Health</h3>
              <button onClick={loadServiceHealth} className="analytics-refresh-btn">Refresh</button>
            </div>

            {serviceHealthLoading && <p>Loading service health…</p>}
            {serviceHealthError && <p className="analytics-error">{serviceHealthError}</p>}

            {!serviceHealthLoading && serviceHealth.length > 0 && (
              <>
                <section className="analytics-chart-section analytics-health-slowest">
                  <h4 className="analytics-chart-title analytics-health-sub">Top 5 Slowest Endpoints</h4>
                  <div className="analytics-chart-list">
                    {slowestEndpoints.map((item) => (
                      <div key={`slow-${item.method}-${item.path}`}>
                        <div className="analytics-chart-item-header">
                          <span>{item.method} {item.path}</span>
                          <span>{item.avgLatencyMs.toFixed(1)} ms</span>
                        </div>
                        <div className="analytics-chart-bar-container">
                          <div className="analytics-chart-bar" style={{ width: `${(item.avgLatencyMs / maxServiceLatency) * 100}%`, background: '#f97316' }} />
                        </div>
                      </div>
                    ))}
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
        )}
      </section>
    </div>
  );
}
