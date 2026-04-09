import { api } from './apiClient';

export interface AvailabilitySlot {
  dayOfWeek: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  available: boolean;
}

export interface WeeklyAvailabilityResponse {
  slots: AvailabilitySlot[];
}

export interface WeeklyAvailabilityRequest {
  slots: AvailabilitySlot[];
}

/** Get all slots for a car (Provider action) */
export async function fetchWeeklyAvailability(providerId: number, carId: number): Promise<WeeklyAvailabilityResponse> {
  return api.get<WeeklyAvailabilityResponse>(`/api/providers/${providerId}/cars/${carId}/availability`);
}

/** Update all slots for a car (Provider action) */
export async function updateWeeklyAvailability(
  providerId: number,
  carId: number,
  payload: WeeklyAvailabilityRequest
): Promise<WeeklyAvailabilityResponse> {
  return api.put<WeeklyAvailabilityResponse>(`/api/providers/${providerId}/cars/${carId}/availability`, payload);
}

/** Get all slots for an instructor */
export async function fetchInstructorAvailability(instructorId: number): Promise<WeeklyAvailabilityResponse> {
  return api.get<WeeklyAvailabilityResponse>(`/api/instructors/${instructorId}/availability`);
}

/** Update all slots for an instructor */
export async function updateInstructorAvailability(
  instructorId: number,
  payload: WeeklyAvailabilityRequest
): Promise<WeeklyAvailabilityResponse> {
  return api.put<WeeklyAvailabilityResponse>(`/api/instructors/${instructorId}/availability`, payload);
}
