const API_BASE = '/api/providers';

export interface CarData {
  id?: number;
  makeModel: string;
  transmissionType: string;
  location: string;
  latitude?: number;
  longitude?: number;
  available: boolean;
  hourlyRate: number;
}

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchVehicles(providerId: number): Promise<CarData[]> {
  const res = await fetch(`${API_BASE}/${providerId}/cars`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch vehicles');
  return res.json();
}

export interface SearchFilters {
  transmissionType?: string;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  lat?: number;
  lng?: number;
  radius?: number;
  dayOfWeek?: string;
  startMinute?: number;
  endMinute?: number;
}

export async function searchVehicles(filters: SearchFilters): Promise<CarData[]> {
  const queryParams = new URLSearchParams();
  if (filters.transmissionType) queryParams.append('transmissionType', filters.transmissionType);
  if (filters.minPrice !== undefined) queryParams.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice !== undefined) queryParams.append('maxPrice', filters.maxPrice.toString());
  if (filters.isAvailable !== undefined) queryParams.append('isAvailable', filters.isAvailable.toString());
  if (filters.lat !== undefined) queryParams.append('lat', filters.lat.toString());
  if (filters.lng !== undefined) queryParams.append('lng', filters.lng.toString());
  if (filters.radius !== undefined) queryParams.append('radius', filters.radius.toString());
  if (filters.dayOfWeek) queryParams.append('dayOfWeek', filters.dayOfWeek);
  if (filters.startMinute !== undefined) queryParams.append('startMinute', filters.startMinute.toString());
  if (filters.endMinute !== undefined) queryParams.append('endMinute', filters.endMinute.toString());

  const res = await fetch(`/api/cars/search?${queryParams.toString()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to search vehicles');
  return res.json();
}

export async function createVehicle(providerId: number, data: Omit<CarData, 'id'>): Promise<CarData> {
  const res = await fetch(`${API_BASE}/${providerId}/cars`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create vehicle');
  return res.json();
}

export async function updateVehicle(providerId: number, carId: number, data: Omit<CarData, 'id'>): Promise<CarData> {
  const res = await fetch(`${API_BASE}/${providerId}/cars/${carId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update vehicle');
  return res.json();
}

export async function deleteVehicle(providerId: number, carId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/${providerId}/cars/${carId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete vehicle');
}
