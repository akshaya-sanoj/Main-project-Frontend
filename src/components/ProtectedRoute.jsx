// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();
  const currentRole = user?.role || localStorage.getItem('userRole');

  if (!currentRole || (allowedRole && currentRole !== allowedRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}