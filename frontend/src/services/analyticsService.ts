import { api } from './apiClient';

export interface UsageMetric {
  date: string;
  totalUsageTime: number; // In minutes
  bookingCount: number;
}

export interface RevenueMetric {
  date: string;
  totalRevenue: number;
}

export interface SystemAnalytics {
  activeUsers: number;
  activeCars: number;
  totalBookings: number;
  totalRevenue: number;
  usageByCarType: Record<string, number>;
  topLearners: Record<string, number>; // FullName -> BookingCount
}

const API_BASE = '/api/analytics';

/** Get system-wide analytics (Admin) */
export async function getSystemAnalytics(): Promise<SystemAnalytics> {
  return api.get<SystemAnalytics>(`${API_BASE}/system`);
}

/** Get usage metrics for a specific learner */
export async function getLearnerUsage(learnerId: number): Promise<UsageMetric[]> {
  return api.get<UsageMetric[]>(`${API_BASE}/learner/${learnerId}/usage`);
}

/** Get usage metrics for a specific car */
export async function getCarUsage(carId: number): Promise<UsageMetric[]> {
  return api.get<UsageMetric[]>(`${API_BASE}/car/${carId}/usage`);
}

/** Get revenue metrics for a specific provider */
export async function getProviderRevenue(providerId: number): Promise<RevenueMetric[]> {
  return api.get<RevenueMetric[]>(`${API_BASE}/provider/${providerId}/revenue`);
}

/** Get revenue metrics for a specific instructor */
export async function getInstructorRevenue(instructorId: number): Promise<RevenueMetric[]> {
  return api.get<RevenueMetric[]>(`${API_BASE}/instructor/${instructorId}/revenue`);
}

/** Trigger the calculation/consolidation of metrics (Admin/System) */
export async function calculateMetrics(): Promise<void> {
  return api.post(`${API_BASE}/calculate`);
}
