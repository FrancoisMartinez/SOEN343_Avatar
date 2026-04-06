import { api } from './apiClient';

const API_BASE = '/api/cars';

export interface Vehicle {
  id: number;
  name: string;
  type: string;
  pricePerHour: number;
  latitude: number;
  longitude: number;
  providerId: number;
  status: string;
  location?: string; // Optional human-readable address
}

export interface VehiclePayload {
  name: string;
  type: string;
  pricePerHour: number;
  latitude: number;
  longitude: number;
  providerId: number;
  status?: string;
}

export type CarData = Vehicle;
export type CarPayload = VehiclePayload;

export interface SearchFilters {
  lat?: number;
  lng?: number;
  radius?: number;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  dayOfWeek?: string;
  startMinute?: number;
  endMinute?: number;
  isAvailable?: boolean;
}

/** Get all vehicles (for map/search) */
export async function fetchAllVehicles(): Promise<Vehicle[]> {
  return api.get<Vehicle[]>(API_BASE);
}

/** Get vehicles belonging to a specific provider */
export async function fetchProviderVehicles(providerId: number): Promise<Vehicle[]> {
  return api.get<Vehicle[]>(`${API_BASE}/provider/${providerId}`);
}

/** Search vehicles by criteria */
export async function searchVehicles(params: {
  lat?: number;
  lng?: number;
  radius?: number;
  type?: string;
  maxPrice?: number;
}): Promise<Vehicle[]> {
  const query = new URLSearchParams();
  if (params.lat) query.append('lat', params.lat.toString());
  if (params.lng) query.append('lng', params.lng.toString());
  if (params.radius) query.append('radius', params.radius.toString());
  if (params.type) query.append('type', params.type);
  if (params.maxPrice) query.append('maxPrice', params.maxPrice.toString());

  return api.get<Vehicle[]>(`/api/cars/search?${query.toString()}`);
}

/** Create a new vehicle */
export async function createVehicle(payload: VehiclePayload): Promise<Vehicle> {
  return api.post<Vehicle>(API_BASE, payload);
}

/** Update an existing vehicle */
export async function updateVehicle(id: number, payload: Partial<VehiclePayload>): Promise<Vehicle> {
  return api.put<Vehicle>(`${API_BASE}/${id}`, payload);
}

/** Delete a vehicle */
export async function deleteVehicle(id: number): Promise<void> {
  return api.delete(`${API_BASE}/${id}`);
}
