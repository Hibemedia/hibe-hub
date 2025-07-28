import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from './useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !user) {
    // Determine redirect based on current path
    if (location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role permissions
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect based on user role
    if (profile.role === 'admin' || profile.role === 'manager') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}