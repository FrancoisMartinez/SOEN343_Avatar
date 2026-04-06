import { api } from './apiClient';

const API_BASE = '/api/routes';

export interface ParkingSpot {
  name: string;
  lat: number;
  lon: number;
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

  return api.get<ParkingSpot[]>(`${API_BASE}/parking?${params}`);
}
