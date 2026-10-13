import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface RoleGuardProps {
  allowedRoles: Array<'PATIENT' | 'DOCTOR' | 'ADMIN'>;
}

const roleRedirectMap: Record<string, string> = {
  PATIENT: '/patient/dashboard',
  DOCTOR: '/doctor/dashboard',
  ADMIN: '/admin/dashboard',
};

export default function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect unauthorized roles back to their dedicated authorized dashboard
    return <Navigate to={roleRedirectMap[user.role] || '/login'} replace />;
  }

  return <Outlet />;
}
