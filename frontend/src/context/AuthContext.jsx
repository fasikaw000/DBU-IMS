import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const normalizeRole = (role) => {
    const roleMap = {
      admin: 'college_admin',
      dean: 'department_dean',
      advisor: 'advisor',
      student: 'student',
      college_admin: 'college_admin',
      department_dean: 'department_dean'
    };
    return roleMap[role] || role;
  };

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        const roleMap = {
          admin: 'college_admin',
          dean: 'department_dean',
          advisor: 'advisor',
          student: 'student',
          college_admin: 'college_admin',
          department_dean: 'department_dean'
        };
        parsed.role = roleMap[parsed.role] || parsed.role;
        return parsed;
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
      const normalizedUserData = { ...userData, role: normalizeRole(userData.role) };

      setUser(normalizedUserData);
      localStorage.setItem('user', JSON.stringify(normalizedUserData));
      localStorage.setItem('token', normalizedUserData.token); // The Bearer token
      return normalizedUserData;
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

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
