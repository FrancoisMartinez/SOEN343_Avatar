import { api } from './apiClient';

const API_BASE = '/api/cars';

/**
 * Shared Vehicle interface used by both frontend and backend communication.
 * Aligns with backend field names to minimize mapping overhead.
 */
export interface Vehicle {
  id: number;
  makeModel: string;
  transmissionType: string;
  hourlyRate: number;
  latitude: number;
  longitude: number;
  available: boolean;
  location?: string;
  providerId?: number; // Optional context for the frontend
}

/** Alias for Vehicle payload when creating/updating */
export type VehiclePayload = Omit<Vehicle, 'id'>;

/** Legacy aliases for backward compatibility during transition */
export type CarData = Vehicle;
export type CarPayload = Partial<VehiclePayload>;

export interface SearchFilters {
  lat?: number;
  lng?: number;
  radius?: number;
  transmissionType?: string;
  minPrice?: number;
  maxPrice?: number;
  dayOfWeek?: string;
  startMinute?: number;
  endMinute?: number;
  isAvailable?: boolean;
}

/** Get all vehicles (for map/search) */
export async function fetchAllVehicles(): Promise<Vehicle[]> {
  return api.get<Vehicle[]>(`${API_BASE}/search`);
}

/** Get vehicles belonging to a specific provider */
export async function fetchProviderVehicles(providerId: number): Promise<Vehicle[]> {
  const data = await api.get<Vehicle[]>(`/api/providers/${providerId}/cars`);
  return data.map(v => ({ ...v, providerId }));
}

/** Search vehicles by criteria */
export async function searchVehicles(params: SearchFilters): Promise<Vehicle[]> {
  const query = new URLSearchParams();
  if (params.lat) query.append('lat', params.lat.toString());
  if (params.lng) query.append('lng', params.lng.toString());
  if (params.radius) query.append('radius', params.radius.toString());
  if (params.transmissionType) query.append('transmissionType', params.transmissionType);
  if (params.maxPrice) query.append('maxPrice', params.maxPrice.toString());
  if (params.minPrice) query.append('minPrice', params.minPrice.toString());
  if (params.isAvailable !== undefined) query.append('isAvailable', params.isAvailable.toString());
  if (params.dayOfWeek) query.append('dayOfWeek', params.dayOfWeek);
  if (params.startMinute !== undefined) query.append('startMinute', params.startMinute.toString());
  if (params.endMinute !== undefined) query.append('endMinute', params.endMinute.toString());

  return api.get<Vehicle[]>(`${API_BASE}/search?${query.toString()}`);
}

/** Create a new vehicle */
export async function createVehicle(payload: VehiclePayload): Promise<Vehicle> {
  const providerId = payload.providerId;
  const data = await api.post<Vehicle>(`/api/providers/${providerId}/cars`, payload);
  return { ...data, providerId };
}

/** Update an existing vehicle */
export async function updateVehicle(providerId: number, carId: number, payload: Partial<VehiclePayload>): Promise<Vehicle> {
  const data = await api.put<Vehicle>(`/api/providers/${providerId}/cars/${carId}`, payload);
  return { ...data, providerId };
}

/** Delete a vehicle */
export async function deleteVehicle(providerId: number, carId: number): Promise<void> {
  return api.delete(`/api/providers/${providerId}/cars/${carId}`);
}
