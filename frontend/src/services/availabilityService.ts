import type { WeeklyAvailability, WeeklyAvailabilityRequest } from '../types/availability';

const API_BASE = '/api/providers';

function authHeaders(): Record<string, string> {
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchWeeklyAvailability(providerId: number, carId: number): Promise<WeeklyAvailability> {
  const res = await fetch(`${API_BASE}/${providerId}/cars/${carId}/availability`, {
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error('Failed to fetch availability');
  return res.json();
}

export async function updateWeeklyAvailability(
  providerId: number,
  carId: number,
  payload: WeeklyAvailabilityRequest,
): Promise<WeeklyAvailability> {
  const res = await fetch(`${API_BASE}/${providerId}/cars/${carId}/availability`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to update availability');
  }

  return res.json();
}
