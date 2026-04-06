/**
 * apiClient.ts
 * Centralized utility for making API requests with automatic authentication
 * and global error handling (e.g., token expiration).
 */

export interface ApiOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Extracts a meaningful error message from a fetch Response.
 */
async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  const text = await res.text().catch(() => '');
  try {
    const body = JSON.parse(text);
    return body.error || body.message || fallback;
  } catch {
    return text.trim() || fallback;
  }
}

/**
 * Enhanced fetch wrapper that handles:
 * 1. Automatic Authorization header injection
 * 2. Automatic Content-Type: application/json for bodies
 * 3. 401 Unauthorized interception (token expiry)
 */
export async function apiFetch(url: string, options: ApiOptions = {}): Promise<Response> {
  const { skipAuth, ...fetchOptions } = options;
  const token = sessionStorage.getItem('token');

  const headers = new Headers(fetchOptions.headers);

  // Inject Authorization header if not skipped and token exists
  if (!skipAuth && token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set default Content-Type if there's a body and not already set
  if (fetchOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...fetchOptions, headers });

  // Handle Token Expiry (401 Unauthorized)
  // We skip this for auth endpoints (login/register) to allow local error handling
  if (response.status === 401 && !skipAuth) {
    console.warn('[API] 401 Unauthorized detected. Session may be expired.');
    
    // Clear session data
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('role');

    // Redirect to login with expiration flag
    // window.location.href causes a full page reload, ensuring clean state
    const currentPath = window.location.pathname;
    if (currentPath !== '/login') {
      window.location.href = `/login?expired=true&from=${encodeURIComponent(currentPath)}`;
    }
    
    throw new Error('Session expired. Please log in again.');
  }

  return response;
}

/**
 * Typed wrapper for apiFetch that expects a JSON response.
 */
export async function apiRequest<T>(
  url: string,
  options: ApiOptions = {},
  fallbackError = 'Request failed'
): Promise<T> {
  const res = await apiFetch(url, options);

  if (!res.ok) {
    const message = await extractErrorMessage(res, fallbackError);
    throw new Error(message);
  }

  // Handle empty responses (e.g., 204 No Content)
  if (res.status === 204) {
    return {} as T;
  }

  try {
    return await res.json();
  } catch {
    throw new Error(fallbackError);
  }
}

/**
 * Convenience methods for HTTP verbs
 */
export const api = {
  get: <T>(url: string, options?: ApiOptions) => 
    apiRequest<T>(url, { ...options, method: 'GET' }),
  
  post: <T>(url: string, body?: any, options?: ApiOptions) => 
    apiRequest<T>(url, { 
      ...options, 
      method: 'POST', 
      body: body ? JSON.stringify(body) : undefined 
    }),
  
  put: <T>(url: string, body?: any, options?: ApiOptions) => 
    apiRequest<T>(url, { 
      ...options, 
      method: 'PUT', 
      body: body ? JSON.stringify(body) : undefined 
    }),
  
  delete: <T>(url: string, options?: ApiOptions) => 
    apiRequest<T>(url, { ...options, method: 'DELETE' }),
};
