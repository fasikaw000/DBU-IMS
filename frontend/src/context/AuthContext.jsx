import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check login status on app load
  useEffect(() => {
    setUser({
      _id: 'mock-admin-id',
      name: 'Dr. Seble E',
      username: 'STF260003',
      role: 'college_admin',
      department: 'mock-dept-id'
    });
    setLoading(false);
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
