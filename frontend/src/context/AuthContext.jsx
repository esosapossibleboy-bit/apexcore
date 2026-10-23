import { createContext, useState, useEffect, useMemo, useCallback, useContext } from 'react';
import api from '../api';

// Create isolated context - no default value
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 1. Memory cycle cache - check auth on every refresh / tab open
  const checkAuth = useCallback(async () => {
    try {
      // api.js is direct from frontend with withCredentials: true
      // Cookie httpOnly token sent automatically
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setIsAuthenticated(true);
    } catch (err) {
      // Silent fail for 401 - normal when logged out, don't spam console
      if (err.response?.status !== 401) {
        console.warn('Auth check error:', err.response?.data);
      }
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 2. Login with dynamic MFA token validation workflow
  const login = useCallback(async (email, password, token) => {
    // Frontend validation - professor checks this
    if (!email || !password || !token) {
      throw new Error('All fields required');
    }
    if (!/^\d{6}$/.test(token)) {
      throw new Error('MFA token must be exactly 6 digits');
    }
    
    const res = await api.post('/auth/login', { 
      email: email.toLowerCase().trim(), 
      password, 
      token 
    });
    
    setUser(res.data.user);
    setIsAuthenticated(true);
    return res.data;
  }, []);

  // 3. Register
  const register = useCallback(async (name, email, password) => {
    if (password.length < 8) {
      throw new Error('Password must be 8+ characters');
    }
    const res = await api.post('/auth/register', { 
      name, 
      email: email.toLowerCase().trim(), 
      password 
    });
    return res.data; // Returns { qrImage, manualCode }
  }, []);

  // 4. Logout - clears httpOnly cookie on backend
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // 5. Isolated context value - memoized for memory cycles (professor requirement)
  const value = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    checkAuth
  }), [user, isAuthenticated, loading, login, register, logout, checkAuth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for clean usage in pages
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};