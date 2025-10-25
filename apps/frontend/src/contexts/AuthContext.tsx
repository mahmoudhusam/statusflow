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

interface User {
  id: string;
  email: string;
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

// Mock user database (in-memory, resets on page refresh)
const mockUsers: Array<{ id: string; email: string; password: string }> = [
  {
    id: 'user-uuid-001',
    email: 'test@example.com',
    password: 'Password123', // In real app, this would be hashed
  },
];

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

// Inner component that uses useSearchParams (needs to be wrapped in Suspense)
function AuthProviderInner({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user was logged in before (from cookies and localStorage)
    const storedToken =
      getCookie('auth_token') || localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Update cookie if it was only in localStorage
      if (!getCookie('auth_token')) {
        setCookie('auth_token', storedToken);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string, redirectTo?: string) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Find user in mock database
      const foundUser = mockUsers.find((u) => u.email === email);

      if (!foundUser) {
        throw new Error('User not found');
      }

      if (foundUser.password !== password) {
        throw new Error('Invalid password');
      }

      // Generate mock token
      const mockToken = `mock-token-${Date.now()}`;

      // Create user object (without password)
      const userData: User = {
        id: foundUser.id,
        email: foundUser.email,
      };

      // Store in both cookie and localStorage for compatibility
      setCookie('auth_token', mockToken);
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('auth_user', JSON.stringify(userData));

      setToken(mockToken);
      setUser(userData);

      // Use provided redirectTo or default to dashboard
      const destination = redirectTo || '/dashboard/monitors';
      router.push(destination);
    },
    [router]
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if user already exists
      const existingUser = mockUsers.find((u) => u.email === email);
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Create new user in mock database
      const newUser = {
        id: `user-uuid-${Date.now()}`,
        email,
        password,
      };

      mockUsers.push(newUser);

      // Automatically log in after signup
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    // Clear both cookie and localStorage
    deleteCookie('auth_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');

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
