const API_BASE = '/api/analytics';

export interface CarUtilization {
  carId: number;
  makeModel: string;
  totalBookings: number;
  totalBookingHours: number;
  utilizationPercentage: number;
  totalRevenue: number;
}

export interface AnalyticsResponse {
  carUtilizations: CarUtilization[];
  timestamp: number;
}

export interface CarUtilizationQuery {
  providerId?: number;
  startDate?: string;
  endDate?: string;
}

function authHeaders(): Record<string, string> {
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function buildCarUtilizationUrl(query: CarUtilizationQuery = {}): string {
  const basePath = query.providerId != null
    ? `${API_BASE}/providers/${query.providerId}/car-utilization`
    : `${API_BASE}/car-utilization`;

  const params = new URLSearchParams();
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export async function fetchCarUtilizationAnalytics(
  query: CarUtilizationQuery = {},
): Promise<AnalyticsResponse> {
  const res = await fetch(buildCarUtilizationUrl(query), {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to fetch analytics');
  }

  return res.json();
}
