export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  licenseNumber: string | null;
  licenseIssueDate: string | null;
  licenseRegion: string | null;
  role: string;
  balance: number | null;
}

export interface UpdateProfilePayload {
  fullName?: string;
  email?: string;
  licenseNumber?: string;
  licenseIssueDate?: string;
  licenseRegion?: string;
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  const text = await res.text().catch(() => '');
  try {
    const body = JSON.parse(text);
    return body.error || body.message || fallback;
  } catch {
    return text.trim() || fallback;
  }
}

export async function getUserProfile(token: string): Promise<UserProfile> {
  const res = await fetch('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const message = await extractErrorMessage(res, 'Failed to fetch profile');
    console.error(`[User] GET /me failed (${res.status}):`, message);
    throw new Error(message);
  }
  return res.json();
}

export async function updateUserProfile(
  token: string,
  data: UpdateProfilePayload
): Promise<UserProfile> {
  const res = await fetch('/api/users/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const message = await extractErrorMessage(res, 'Failed to update profile');
    console.error(`[User] PUT /me failed (${res.status}):`, message);
    throw new Error(message);
  }
  return res.json();
}

/** Add funds to the learner's balance */
export async function addBalance(token: string, amount: number): Promise<UserProfile> {
  const res = await fetch('/api/users/me/balance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const message = await extractErrorMessage(res, 'Failed to add balance');
    throw new Error(message);
  }
  return res.json();
}
