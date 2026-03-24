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
