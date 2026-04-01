import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function MemberProfile() {
  const { user, fetchMe } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    phone:      user?.phone      || '',
    address:    user?.address    || '',
    bio:        user?.bio        || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/users/me', form);
      toast.success('Profile updated');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const ROLE_BADGE = {
    admin: 'badge-admin', pastor: 'badge-pastor', staff: 'badge-staff', member: 'badge-member'
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <button onClick={() => setEditing(!editing)} className="btn-secondary">
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="card">
        {/* Avatar + role */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-church-100 rounded-2xl flex items-center justify-center text-2xl font-bold text-church-700">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.first_name} {user?.last_name}</h2>
            <span className={ROLE_BADGE[user?.role]}>{user?.role}</span>
          </div>
        </div>

        {editing ? (
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input className="input" value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input className="input" value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input className="input" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input className="input" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea rows={3} className="input" value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        ) : (
          <dl className="space-y-3 text-sm">
            {[
              ['Email',   user?.email],
              ['Phone',   user?.phone   || '—'],
              ['Address', user?.address || '—'],
              ['Bio',     user?.bio     || '—'],
              ['Member since', user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <dt className="w-28 font-medium text-gray-500 shrink-0">{label}</dt>
                <dd className="text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
