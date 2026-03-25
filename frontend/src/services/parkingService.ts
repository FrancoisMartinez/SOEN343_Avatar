const API_BASE = '/api/routes';

export interface ParkingSpot {
  name: string;
  lat: number;
  lon: number;
}

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function getParkingNearby(
  lat: number,
  lon: number,
  radius: number = 800
): Promise<ParkingSpot[]> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    radius: radius.toString(),
  });

  const res = await fetch(`${API_BASE}/parking?${params}`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to fetch parking spots');
  }

  return res.json();
}
