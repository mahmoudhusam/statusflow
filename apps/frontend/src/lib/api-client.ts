const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      document.cookie =
        'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    throw new ApiError('Session expired. Please login again.', 401);
  }

  if (!response.ok) {
    let errorData: ErrorResponse = {};
    try {
      errorData = (await response.json()) as ErrorResponse;
    } catch {
      errorData = { message: response.statusText || 'An error occurred' };
    }

    const error = new ApiError(
      errorData.message || `Error ${response.status}: ${response.statusText}`,
      response.status,
      errorData.errors
    );

    throw error;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

export const apiClient = {
  async post<T>(endpoint: string, data?: unknown, token?: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    return handleResponse<T>(response);
  },

  async get<T>(endpoint: string, token?: string): Promise<T> {
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    return handleResponse<T>(response);
  },

  async patch<T>(endpoint: string, data: unknown, token?: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });

    return handleResponse<T>(response);
  },

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    return handleResponse<T>(response);
  },

  async put<T>(endpoint: string, data: unknown, token?: string): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    return handleResponse<T>(response);
  },
};
