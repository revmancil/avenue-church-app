import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ROLE_BADGE = {
  admin:  'badge-admin',
  pastor: 'badge-pastor',
  staff:  'badge-staff',
  member: 'badge-member',
};

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <h2 className="text-sm font-medium text-church-700 hidden sm:block">
        Avenue Progressive Baptist Church
      </h2>
      <div className="flex items-center gap-3 ml-auto">
        {/* Donate button — visible to all roles */}
        <Link
          to="/donate"
          className="flex items-center gap-1.5 bg-gold-500 hover:bg-gold-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors shadow-sm"
        >
          🙏 Give
        </Link>

        <span className={ROLE_BADGE[user?.role] || 'badge-member'}>
          {user?.role?.toUpperCase()}
        </span>
        <span className="text-sm font-medium text-gray-700">
          {user?.first_name} {user?.last_name}
        </span>
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-church-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
