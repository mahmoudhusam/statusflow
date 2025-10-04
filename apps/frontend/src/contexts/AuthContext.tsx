// apps/frontend/src/contexts/AuthContext.tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
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
  login: (email: string, password: string) => Promise<void>;
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user was logged in before (from localStorage)
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
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

      // Store in localStorage
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('auth_user', JSON.stringify(userData));

      setToken(mockToken);
      setUser(userData);

      router.push('/dashboard/monitors');
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
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    setToken(null);
    router.push('/login');
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
