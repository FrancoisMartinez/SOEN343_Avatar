const API_BASE = '/api/matchings';

export interface AutoMatchRequest {
  learnerId: number;
  date?: string;
  startTime?: string;
  duration?: number;
  learnerLat: number;
  learnerLng: number;
  transmissionPreference?: string;
  radius?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface MatchResultData {
  carId: number;
  makeModel: string;
  transmissionType: string;
  location: string;
  latitude: number;
  longitude: number;
  hourlyRate: number;
  instructorId: number;
  instructorName: string;
  instructorHourlyRate: number;
  instructorRating?: number;
  instructorLatitude?: number;
  instructorLongitude?: number;
  totalCost: number;
  proximityScore: number;
  budgetScore: number;
  transmissionScore: number;
  compositeScore: number;
  distanceKm: number;
}

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function autoMatch(request: AutoMatchRequest): Promise<MatchResultData[]> {
  const res = await fetch(`${API_BASE}/auto`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Auto-match failed');
  }
  return res.json();
}
