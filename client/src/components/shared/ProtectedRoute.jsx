import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_LEVELS = { admin: 4, pastor: 3, staff: 2, member: 1 };

export default function ProtectedRoute({ roles, minRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-church-500" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Role whitelist check
  if (roles && !roles.map(r => r.toLowerCase()).includes(user.role.toLowerCase())) {
    return <Navigate to="/" replace />;
  }

  // Minimum role check
  if (minRole) {
    const userLevel = ROLE_LEVELS[user.role.toLowerCase()] || 0;
    const minLevel  = ROLE_LEVELS[minRole.toLowerCase()]   || 0;
    if (userLevel < minLevel) return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
