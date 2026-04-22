import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem('user');
    const storedToken = sessionStorage.getItem('token');
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
      const storedToken = sessionStorage.getItem('token');
      if (storedToken) {
        try {
          // Rehydrate auth state from token on refresh/navigation.
          if (!user) {
            const res = await api.get('/users/me');
            if (res?.data) {
              setUser(res.data);
              sessionStorage.setItem('user', JSON.stringify(res.data));
            }
          }
        } catch (e) {
          console.error("Token verification failed", e);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [user]);

  // Standardized Login Function
  const login = async (username, password) => {
    try {
      setError(null);
      const res = await api.post('/auth/login', { username, password });

      const userData = res;
      console.debug('Login token:', userData?.token);
      console.debug('Login role:', userData?.role);
      setUser(userData);
      sessionStorage.setItem('user', JSON.stringify(userData));
      sessionStorage.setItem('token', userData.token); // The Bearer token
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
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
    }
  };

  const setUserAndPersist = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      sessionStorage.setItem('user', JSON.stringify(nextUser));
    } else {
      sessionStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, setUser: setUserAndPersist }}>
      {children}
    </AuthContext.Provider>
  );
};
