// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUser = sessionStorage.getItem('fest_user') || localStorage.getItem('fest_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        sessionStorage.removeItem('fest_user');
        localStorage.removeItem('fest_user');
      }
    }
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError('');
    try {
      const loggedInUser = await loginUser(credentials);
      setUser(loggedInUser);
      sessionStorage.setItem('fest_user', JSON.stringify(loggedInUser));
      sessionStorage.setItem('userRole', loggedInUser.role);
      return loggedInUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('fest_user');
    localStorage.removeItem('fest_user');
    sessionStorage.removeItem('userRole');
    localStorage.removeItem('userRole');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}