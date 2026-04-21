import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verify token on app load/refresh
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken && user) {
        try {
          // Optional: You can add a /auth/me or /auth/verify endpoint
          // For now, we trust the localStorage if it exists, 
          // but we ensure the component has finished 'loading'
        } catch (e) {
          console.error("Token verification failed", e);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  // Standardized Login Function
  const login = async (username, password) => {
    try {
      setError(null);
      const res = await api.post('/auth/login', { username, password });

      const userData = res;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', userData.token); // The Bearer token
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  const setUserAndPersist = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, setUser: setUserAndPersist }}>
      {children}
    </AuthContext.Provider>
  );
};
