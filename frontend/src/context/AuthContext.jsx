/**
 * AuthContext — manages authentication state across the app.
 *
 * Provides:
 *   - user:    The currently logged-in user object (or null).
 *   - login:   Function to authenticate and store the token.
 *   - logout:  Function to clear auth state.
 *   - loading: Whether auth state is being restored from localStorage.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user from localStorage on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('leavetrack_user');
    const savedToken = localStorage.getItem('leavetrack_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  /**
   * Log in a user by calling the backend auth endpoint.
   * Stores the token and user in localStorage for persistence.
   */
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;

    localStorage.setItem('leavetrack_token', token);
    localStorage.setItem('leavetrack_user', JSON.stringify(userData));
    setUser(userData);

    return userData;
  };

  /**
   * Log out — clear all stored auth data.
   */
  const logout = () => {
    localStorage.removeItem('leavetrack_token');
    localStorage.removeItem('leavetrack_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state from any component.
 * Usage: const { user, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
