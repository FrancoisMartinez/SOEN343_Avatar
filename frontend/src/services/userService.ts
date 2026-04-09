import { api } from './apiClient';

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  licenseNumber: string | null;
  licenseIssueDate: string | null;
  licenseRegion: string | null;
  role: string;
  balance: number | null;
  latitude?: number | null;
  longitude?: number | null;
  travelRadius?: number | null;
  hourlyRate?: number | null;
}

export interface UpdateProfilePayload {
  fullName?: string;
  email?: string;
  licenseNumber?: string;
  licenseIssueDate?: string;
  licenseRegion?: string;
  latitude?: number;
  longitude?: number;
  travelRadius?: number;
  hourlyRate?: number;
}

/** Get the current user's profile based on the stored token */
export async function getUserProfile(): Promise<UserProfile> {
  return api.get<UserProfile>('/api/users/me', { headers: {} });
}

/** Update the current user's profile */
export async function updateUserProfile(
  data: UpdateProfilePayload
): Promise<UserProfile> {
  return api.put<UserProfile>('/api/users/me', data);
}

/** Add funds to the learner's balance */
export async function addBalance(amount: number): Promise<UserProfile> {
  return api.post<UserProfile>('/api/users/me/balance', { amount });
}
