import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Ministries() {
  const { user } = useAuth();
  const [ministries, setMinistries] = useState([]);
  const [myIds, setMyIds]           = useState(new Set());
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const { isAtLeast } = useAuth();
  const [form, setForm] = useState({ name: '', description: '', meets_at: '' });

  const load = async () => {
    try {
      const { data } = await api.get('/ministries');
      setMinistries(data);
      // determine which ones the current user is in
      // We infer by checking ministry member lists — simplified: use a joined flag if backend supports it
      // For now, we'll track it client-side via join/leave actions
    } catch {
      toast.error('Failed to load ministries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const join = async (id) => {
    try {
      await api.post(`/ministries/${id}/join`);
      setMyIds((prev) => new Set([...prev, id]));
      toast.success('Joined ministry!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to join');
    }
  };

  const leave = async (id) => {
    try {
      await api.delete(`/ministries/${id}/leave`);
      setMyIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast.success('Left ministry');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to leave');
    }
  };

  const createMinistry = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ministries', form);
      toast.success('Ministry created');
      setShowForm(false);
      setForm({ name: '', description: '', meets_at: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create ministry');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ministries</h1>
          <p className="text-sm text-gray-500 mt-1">Serve and connect through Avenue's ministry groups</p>
        </div>
        {isAtLeast('staff') && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ New Ministry</button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">New Ministry</h3>
          <form onSubmit={createMinistry} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input required className="input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={2} className="input" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meets At</label>
              <input className="input" placeholder="e.g. Saturdays at 9am" value={form.meets_at}
                onChange={(e) => setForm({ ...form, meets_at: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-gray-400 col-span-3">Loading…</p>
        ) : ministries.map((m) => {
          const joined = myIds.has(m.id);
          return (
            <div key={m.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{m.name}</h3>
                <span className="text-xs text-gray-400 shrink-0">{m.member_count} members</span>
              </div>
              {m.description && <p className="text-sm text-gray-600 flex-1">{m.description}</p>}
              {m.meets_at && (
                <p className="text-xs text-church-600 font-medium">{m.meets_at}</p>
              )}
              {m.leader_name && (
                <p className="text-xs text-gray-400">Leader: {m.leader_name}</p>
              )}
              <button
                onClick={() => joined ? leave(m.id) : join(m.id)}
                className={joined ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
              >
                {joined ? 'Leave Ministry' : 'Join Ministry'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
