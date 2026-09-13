import { Navigate } from 'react-router';
import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1510] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#5EE08A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/auth/signin" replace />;
  }

  return <>{children}</>;
}
