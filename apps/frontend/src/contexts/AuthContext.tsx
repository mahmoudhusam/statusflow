'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  Suspense,
} from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
}

interface AuthResponse {
  token: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    redirectTo?: string
  ) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Helper functions for cookie management
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

function AuthProviderInner({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch current user from API
  const fetchCurrentUser = useCallback(async (authToken: string) => {
    try {
      const userData = await apiClient.get<User>('/auth/me', authToken);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    // Check if user was logged in before
    const checkAuth = async () => {
      const storedToken =
        getCookie('auth_token') || localStorage.getItem('auth_token');

      if (storedToken) {
        try {
          const userData = await fetchCurrentUser(storedToken);
          setToken(storedToken);
          setUser(userData);
          // Update cookie if it was only in localStorage
          if (!getCookie('auth_token')) {
            setCookie('auth_token', storedToken);
          }
        } catch (error) {
          // Token is invalid, clear it
          deleteCookie('auth_token');
          localStorage.removeItem('auth_token');
          console.error('Invalid token:', error);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [fetchCurrentUser]);

  const login = useCallback(
    async (email: string, password: string, redirectTo?: string) => {
      try {
        // Call login API
        const response = await apiClient.post<AuthResponse>('/auth/login', {
          email,
          password,
        });

        const authToken = response.token;

        // Fetch user data
        const userData = await fetchCurrentUser(authToken);

        // Store token
        setCookie('auth_token', authToken);
        localStorage.setItem('auth_token', authToken);

        setToken(authToken);
        setUser(userData);

        // Redirect
        const destination = redirectTo || '/dashboard/monitors';
        router.push(destination);
      } catch (error) {
        console.error('Login failed:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Invalid credentials';
        throw new Error(errorMessage);
      }
    },
    [router, fetchCurrentUser]
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      try {
        // Call signup API
        await apiClient.post<User>('/auth/signup', {
          email,
          password,
        });

        // Auto-login after signup
        await login(email, password);
      } catch (error) {
        console.error('Signup failed:', error);
        if (
          error instanceof Error &&
          error.message?.includes('already exists')
        ) {
          throw new Error('User already exists');
        }
        const errorMessage =
          error instanceof Error ? error.message : 'Signup failed';
        throw new Error(errorMessage);
      }
    },
    [login]
  );

  const logout = useCallback(() => {
    // Clear both cookie and localStorage
    deleteCookie('auth_token');
    localStorage.removeItem('auth_token');

    setUser(null);
    setToken(null);
    router.push('/');
  }, [router]);

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Wrapper component with Suspense boundary
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <AuthProviderInner>{children}</AuthProviderInner>
    </Suspense>
  );
}
