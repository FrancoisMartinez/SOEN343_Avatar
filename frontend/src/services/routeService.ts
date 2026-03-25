const API_BASE = '/api/routes';

export interface RouteResult {
  polyline: [number, number][]; // [[lat, lon], ...]
  distanceKm: number;
  durationMin: number;
  steps: {
    instruction: string;
    distanceKm: number;
    durationMin: number;
    mode: string;
  }[];
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
  toLon: number
): Promise<RouteResult> {
  const params = new URLSearchParams({
    fromLat: fromLat.toString(),
    fromLon: fromLon.toString(),
    toLat: toLat.toString(),
    toLon: toLon.toString(),
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

export async function getTransitDirections(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): Promise<RouteResult> {
  const params = new URLSearchParams({
    fromLat: fromLat.toString(),
    fromLon: fromLon.toString(),
    toLat: toLat.toString(),
    toLon: toLon.toString(),
  });

  const res = await fetch(`${API_BASE}/transit?${params}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to fetch transit directions');
  }

  return res.json();
}
