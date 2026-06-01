import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui/Skeleton';

interface ProtectedRouteProps {
  requireHoster?: boolean;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ requireHoster, requireAdmin }: ProtectedRouteProps) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && userProfile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (requireHoster && userProfile?.role !== 'hoster' && userProfile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
