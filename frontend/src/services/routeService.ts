import { api } from './apiClient';

export type TransportMode = 'DRIVING' | 'BUS' | 'BICYCLE' | 'WALK';

export interface JourneyLeg {
  type: 'WALK' | 'TRANSIT' | 'STEP';
  transportMode?: string;
  fromStop?: string;
  toStop?: string;
  lineLabel?: string;
  durationMin: number;
  instruction?: string;
  distanceKm?: number;
  subSteps?: string[];
}

export interface RouteResult {
  polyline: [number, number][];
  distanceKm: number;
  durationMin: number;
  mode: string;
  legs: JourneyLeg[];
}

const API_BASE = '/api/routes';

/** Fetch a route between two points */
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
    mode: mode,
  });
  return api.get<RouteResult>(`${API_BASE}/directions?${params.toString()}`);
}

/** Search for cars nearby with routing info */
export async function searchCarsNearby(lat: number, lon: number, radius: number = 2000): Promise<any> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    radius: radius.toString(),
  });
  return api.get<any>(`${API_BASE}/cars?${params.toString()}`);
}
