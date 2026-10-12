import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children, roles, loginPath = '/login' }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(user?.role)) {
    // Admin/dealer trying to reach customer pages → send to admin, and vice versa
    const isPrivileged = ['ADMIN', 'SUPER_ADMIN', 'DEALER'].includes(user?.role);
    return <Navigate to={isPrivileged ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}
