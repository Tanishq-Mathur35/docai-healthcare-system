import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface RoleGuardProps {
  allowedRoles: Array<'PATIENT' | 'DOCTOR' | 'ADMIN'>;
}

export default function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user } = useAuthStore();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
