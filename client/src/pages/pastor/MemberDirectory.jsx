import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BADGE = { admin: 'badge-admin', pastor: 'badge-pastor', staff: 'badge-staff', member: 'badge-member' };

export default function MemberDirectory() {
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/users', { params: { search, limit: 200 } });
        setUsers(data.users);
      } catch {
        toast.error('Failed to load directory');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Member Directory</h1>
        <p className="text-sm text-gray-500 mt-1">{users.length} registered members</p>
      </div>

      <input
        type="text"
        className="input max-w-sm"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-gray-400 col-span-3">Loading…</p>
        ) : users.map((u) => (
          <div key={u.id} className="card flex items-start gap-4">
            <div className="w-10 h-10 bg-church-100 rounded-full flex items-center justify-center shrink-0 font-bold text-church-700">
              {u.first_name[0]}{u.last_name[0]}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 truncate">{u.first_name} {u.last_name}</p>
              <p className="text-sm text-gray-500 truncate">{u.email}</p>
              {u.phone && <p className="text-sm text-gray-400">{u.phone}</p>}
              <span className={`mt-1 inline-block ${BADGE[u.role]}`}>{u.role}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
