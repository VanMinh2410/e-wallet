import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';

export function ProtectedRoute() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
