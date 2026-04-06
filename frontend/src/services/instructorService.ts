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

export async function fetchInstructorsNearby(
  lat: number,
  lng: number,
  radius: number
): Promise<Instructor[]> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radius: radius.toString(),
  });
  return api.get<Instructor[]>(`${API_BASE}/search?${params}`);
}
