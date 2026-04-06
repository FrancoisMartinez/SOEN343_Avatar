import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getSystemAnalytics,
  calculateMetrics,
  type SystemAnalytics,
} from '../services/analyticsService';
import './AnalyticsPage.css';

export default function AnalyticsPage() {
  const { isAuthenticated, role } = useAuth();
  const isAdmin = isAuthenticated && role === 'ADMIN';

  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSystemAnalytics();
      setAnalytics(response);
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCalculateMetrics = async () => {
    try {
      await calculateMetrics();
      await loadAnalytics();
    } catch (err: any) {
      alert('Failed to calculate metrics: ' + err.message);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin, loadAnalytics]);

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
        <h2 className="analytics-title">System Analytics Dashboard</h2>

        <div className="analytics-filters">
          <div className="analytics-btn-group">
            <button onClick={loadAnalytics}>
              Refresh
            </button>
            <button onClick={handleCalculateMetrics}>
              Calculate Metrics Now
            </button>
          </div>
        </div>

        {loading && <p>Loading analytics…</p>}
        {error && <p className="analytics-error">{error}</p>}

        {!loading && !error && !analytics && <p>No analytics available yet.</p>}

        {!loading && !error && analytics && (
          <>
            <div className="analytics-stats-grid">
              <div className="analytics-stat-card">
                <div className="analytics-stat-label">Active Users</div>
                <div className="analytics-stat-value">{analytics.activeUsers}</div>
              </div>
              <div className="analytics-stat-card">
                <div className="analytics-stat-label">Active Cars</div>
                <div className="analytics-stat-value">{analytics.activeCars}</div>
              </div>
              <div className="analytics-stat-card">
                <div className="analytics-stat-label">Total Bookings</div>
                <div className="analytics-stat-value">{analytics.totalBookings}</div>
              </div>
              <div className="analytics-stat-card">
                <div className="analytics-stat-label">Total Revenue</div>
                <div className="analytics-stat-value">${analytics.totalRevenue.toFixed(2)}</div>
              </div>
            </div>

            <div className="analytics-charts-grid">
              <section className="analytics-chart-section">
                <h3 className="analytics-chart-title">Usage by Car Type</h3>
                <div className="analytics-chart-list">
                  {Object.entries(analytics.usageByCarType).map(([type, count]) => {
                    const widthPercent = analytics.totalBookings > 0 ? (count / analytics.totalBookings) * 100 : 0;
                    return (
                      <div key={`type-${type}`}>
                        <div className="analytics-chart-item-header">
                          <span>{type}</span>
                          <span>{count} bookings</span>
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
                <h3 className="analytics-chart-title">Top Learners</h3>
                <div className="analytics-chart-list">
                  {Object.entries(analytics.topLearners).map(([name, count]) => {
                    const maxBookings = Math.max(...Object.values(analytics.topLearners), 1);
                    const widthPercent = (count / maxBookings) * 100;
                    return (
                      <div key={`learner-${name}`}>
                        <div className="analytics-chart-item-header">
                          <span>{name}</span>
                          <span>{count} bookings</span>
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
          </>
        )}
      </section>
    </div>
  );
}
