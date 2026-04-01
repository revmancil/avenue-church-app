import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/shared/ProtectedRoute';

// Auth pages
import Login          from './pages/auth/Login';
import Signup         from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';

// Role pages
import AdminDashboard    from './pages/admin/AdminDashboard';
import DonationDashboard from './pages/admin/DonationDashboard';
import SermonHub         from './pages/pastor/SermonHub';
import MemberDirectory   from './pages/pastor/MemberDirectory';
import EventsManager     from './pages/staff/EventsManager';
import VisitorFollowUp   from './pages/staff/VisitorFollowUp';
import MemberProfile     from './pages/member/MemberProfile';
import GivingHistory     from './pages/member/GivingHistory';
import Ministries        from './pages/member/Ministries';
import CommsHub          from './pages/comms/CommsHub';
import NotFound          from './pages/NotFound';

function RedirectHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin')  return <Navigate to="/admin" replace />;
  if (user.role === 'pastor') return <Navigate to="/sermons" replace />;
  if (user.role === 'staff')  return <Navigate to="/events" replace />;
  return <Navigate to="/profile" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"           element={<Login />} />
      <Route path="/signup"          element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Protected — all authenticated users */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/"          element={<RedirectHome />} />
          <Route path="/profile"   element={<MemberProfile />} />
          <Route path="/giving"    element={<GivingHistory />} />
          <Route path="/ministries" element={<Ministries />} />
          <Route path="/directory" element={<MemberDirectory />} />
          <Route path="/sermons"   element={<SermonHub />} />
          <Route path="/events"    element={<EventsManager />} />

          {/* Staff+ */}
          <Route element={<ProtectedRoute minRole="staff" />}>
            <Route path="/visitors" element={<VisitorFollowUp />} />
            <Route path="/comms"    element={<CommsHub />} />
          </Route>

          {/* Admin only */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin"     element={<AdminDashboard />} />
            <Route path="/donations" element={<DonationDashboard />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
