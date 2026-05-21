// @ts-nocheck
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireUXSC?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireUXSC = false }) => {
  const { isAuthenticated, isUXSC, isOnboarded, isEmailVerified, supabaseUser, isLoading } = useAuth();

  // Dev mode bypass: skip auth redirects in development
  const isDevBypass = import.meta.env.VITE_DEV_BYPASS === 'true';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated && !isDevBypass) {
    return <Navigate to="/login" replace />;
  }

  // Skip email verification and onboarding redirects in dev bypass mode
  if (!isDevBypass) {
    if (supabaseUser && !isEmailVerified) {
      return <Navigate to="/verify-email" replace />;
    }

    if (supabaseUser && !isOnboarded) {
      return <Navigate to="/onboarding" replace />;
    }

    if (requireUXSC && !isUXSC) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
