import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await api.get('/api/auth/profile');
          setUser(data);
        } catch (error) {
          console.error('Session expired or invalid token:', error.message);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data);
      return { success: true, role: data.role };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed. Please try again.' };
    }
  };

  const register = async (name, email, password, role, organization, constituencyId) => {
    try {
      const { data } = await api.post('/api/auth/register', {
        name, email, password, role,
        organization: organization || 'Government',
        constituencyId: constituencyId || null,
      });
      localStorage.setItem('token', data.token);
      setUser(data);
      return { success: true, role: data.role };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
