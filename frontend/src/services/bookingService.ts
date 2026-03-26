const API_BASE = '/api/bookings';

export interface BookingData {
  id?: number;
  carId: number;
  carName: string;
  userId: number;
  date: string;
  startTime: string;
  duration: number;
  totalCost: number;
  status: string;
}

export interface CreateBookingPayload {
  carId: number;
  userId: number;
  date: string;       // "YYYY-MM-DD"
  startTime: string;  // "HH:mm"
  duration: number;   // 1-12 hours
}

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Create a new booking */
export async function createBooking(payload: CreateBookingPayload): Promise<BookingData> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to create booking');
  }
  return res.json();
}

/** Get all bookings for a learner */
export async function fetchLearnerBookings(learnerId: number): Promise<BookingData[]> {
  const res = await fetch(`${API_BASE}/learner/${learnerId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch bookings');
  return res.json();
}

/** Mark a booking as finished */
export async function finishBooking(bookingId: number): Promise<BookingData> {
  const res = await fetch(`${API_BASE}/${bookingId}/finish`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Failed to finish booking');
  }
  return res.json();
}
