
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute = ({ children, requiredRole = 'user' }: ProtectedRouteProps) => {
  const { currentUser, loading, hasRole } = useAuth();
  
  // Show loading or spinner while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If not authenticated, redirect to home page
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  
  // If user doesn't have required role, redirect to unauthorized page
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If authenticated and has required role, render children
  return <>{children}</>;
};
