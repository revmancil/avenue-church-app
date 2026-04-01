import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, Calendar, Users, Heart,
  ChurchIcon, Mail, UserCheck, DollarSign, Cross
} from 'lucide-react';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-church-500 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { isAtLeast, hasRole } = useAuth();

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-church-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">The Avenue</p>
            <p className="text-xs text-gray-500">Member Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

        {/* Admin only */}
        {hasRole('admin') && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">Admin</p>
            <NavItem to="/admin"     icon={LayoutDashboard} label="User Management" />
            <NavItem to="/donations" icon={DollarSign}      label="Donation Dashboard" />
            <div className="pt-2" />
          </>
        )}

        {/* Staff + */}
        {isAtLeast('staff') && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">Staff</p>
            <NavItem to="/visitors" icon={UserCheck} label="Visitor Follow-up" />
            <NavItem to="/comms"    icon={Mail}      label="Comms Hub" />
            <div className="pt-2" />
          </>
        )}

        {/* Pastor + */}
        {isAtLeast('pastor') && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">Pastoral</p>
            <NavItem to="/sermons"   icon={BookOpen} label="Sermon Hub" />
            <NavItem to="/directory" icon={Users}    label="Member Directory" />
            <div className="pt-2" />
          </>
        )}

        {/* All members */}
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">My Church</p>
        <NavItem to="/events"     icon={Calendar}       label="Events" />
        <NavItem to="/ministries" icon={Heart}           label="Ministries" />
        <NavItem to="/giving"     icon={DollarSign}      label="My Giving" />
        <NavItem to="/profile"    icon={UserCheck}       label="My Profile" />
      </nav>

      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">Avenue PBC · v1.0</p>
      </div>
    </aside>
  );
}
