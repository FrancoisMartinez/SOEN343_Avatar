import { api } from './apiClient';

const API_BASE = '/api/bookings';

export interface BookingData {
  id?: number;
  carId?: number;
  carName?: string;
  userId: number;
  date: string;
  startTime: string;
  duration: number;
  totalCost: number;
  status: string;
  learnerName?: string;
  instructorId?: number;
  instructorName?: string;
}

export interface CreateBookingPayload {
  carId?: number;
  instructorId?: number;
  userId: number;
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:mm"
  duration: number;   // 1-12 hours
}

export interface FinishBookingPayload {
  latitude?: number;
  longitude?: number;
  location?: string;
  rating?: number;
}

/** Create a new booking */
export async function createBooking(payload: CreateBookingPayload): Promise<BookingData> {
  return api.post<BookingData>(API_BASE, payload);
}

/** Get all bookings for a learner */
export async function fetchLearnerBookings(learnerId: number): Promise<BookingData[]> {
  return api.get<BookingData[]>(`${API_BASE}/learner/${learnerId}`);
}

/** Get all bookings for a provider's cars (read-only) */
export async function fetchProviderBookings(providerId: number): Promise<BookingData[]> {
  return api.get<BookingData[]>(`${API_BASE}/provider/${providerId}`);
}

/** Get all bookings for an instructor */
export async function fetchInstructorBookings(instructorId: number): Promise<BookingData[]> {
  return api.get<BookingData[]>(`${API_BASE}/instructor/${instructorId}`);
}

/** Confirm a pending booking (Instructor action). Optionally assign a car. */
export async function confirmBooking(bookingId: number, carId?: number): Promise<BookingData> {
  const url = carId ? `${API_BASE}/${bookingId}/confirm?carId=${carId}` : `${API_BASE}/${bookingId}/confirm`;
  return api.put<BookingData>(url);
}

/** Cancel a booking */
export async function cancelBooking(bookingId: number): Promise<BookingData> {
  return api.put<BookingData>(`${API_BASE}/${bookingId}/cancel`);
}

/** Finish a booking with a new car location */
export async function finishBooking(bookingId: number, payload?: FinishBookingPayload): Promise<BookingData> {
  return api.put<BookingData>(`${API_BASE}/${bookingId}/finish`, payload);
}
