const API_BASE = '/api/routes';

export type TransportMode = 'DRIVING' | 'BICYCLE' | 'WALK' | 'BUS';

export interface JourneyLeg {
  type: 'WALK' | 'TRANSIT';
  lineLabel: string | null;
  transportMode: string | null;
  fromStop: string | null;
  toStop: string | null;
  durationMin: number;
  polyline: [number, number][];
}

export interface RouteResult {
  polyline: [number, number][];
  distanceKm: number;
  durationMin: number;
  mode: TransportMode;
  legs: JourneyLeg[];
}

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getDirections(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  mode: TransportMode = 'DRIVING'
): Promise<RouteResult> {
  const params = new URLSearchParams({
    fromLat: fromLat.toString(),
    fromLon: fromLon.toString(),
    toLat: toLat.toString(),
    toLon: toLon.toString(),
    mode,
  });

  const res = await fetch(`${API_BASE}/directions?${params}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to fetch directions');
  }

  return res.json();
}
