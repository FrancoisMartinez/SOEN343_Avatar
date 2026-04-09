import { api } from './apiClient';

export interface Instructor {
  id: number;
  fullName: string;
  email: string;
  latitude: number;
  longitude: number;
  travelRadius: number;
  hourlyRate: number;
  rating?: number; // Added rating field if it exists
}

/** Alias for Instructor to match existing imports */
export type InstructorData = Instructor;

const API_BASE = '/api/instructors';

export async function fetchAllInstructors(): Promise<Instructor[]> {
  return api.get<Instructor[]>(API_BASE);
}

export interface InstructorSearchFilters {
  lat?: number;
  lng?: number;
  radius?: number;
  minPrice?: number;
  maxPrice?: number;
  dayOfWeek?: string;
  startMinute?: number;
  endMinute?: number;
}

export async function fetchInstructorsNearby(
  filters: InstructorSearchFilters
): Promise<Instructor[]> {
  const params = new URLSearchParams();
  if (filters.lat) params.append('lat', filters.lat.toString());
  if (filters.lng) params.append('lng', filters.lng.toString());
  if (filters.radius) params.append('radius', filters.radius.toString());
  if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
  if (filters.dayOfWeek) params.append('dayOfWeek', filters.dayOfWeek);
  if (filters.startMinute !== undefined) params.append('startMinute', filters.startMinute.toString());
  if (filters.endMinute !== undefined) params.append('endMinute', filters.endMinute.toString());
  
  return api.get<Instructor[]>(`${API_BASE}/search?${params.toString()}`);
}
