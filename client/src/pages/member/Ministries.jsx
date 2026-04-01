import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Ministries() {
  const { isAtLeast, hasRole } = useAuth();
  const [ministries, setMinistries] = useState([]);
  const [myIds, setMyIds]           = useState(new Set());
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editMinistry, setEditMinistry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm]     = useState({ name: '', description: '', meets_at: '' });
  const [editForm, setEditForm] = useState({ name: '', description: '', meets_at: '' });

  const load = async () => {
    try {
      const { data } = await api.get('/ministries');
      setMinistries(data);
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

  const openEdit = (m) => {
    setEditMinistry(m);
    setEditForm({ name: m.name, description: m.description || '', meets_at: m.meets_at || '' });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/ministries/${editMinistry.id}`, editForm);
      toast.success('Ministry updated');
      setEditMinistry(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/ministries/${deleteTarget.id}`);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
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

      {/* Create form */}
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

      {/* Edit modal */}
      {editMinistry && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-900 mb-4">Edit Ministry</h3>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input required className="input" value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea rows={2} className="input" value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meets At</label>
                <input className="input" value={editForm.meets_at}
                  onChange={(e) => setEditForm({ ...editForm, meets_at: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary">Save Changes</button>
                <button type="button" className="btn-secondary" onClick={() => setEditMinistry(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <p className="text-2xl mb-3">⚠️</p>
            <h3 className="font-bold text-gray-900 mb-2">Delete "{deleteTarget.name}"?</h3>
            <p className="text-sm text-gray-500 mb-5">
              This will remove the ministry and all member associations. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={confirmDelete} className="btn-danger">Yes, Delete</button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Ministry cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-gray-400 col-span-3">Loading…</p>
        ) : ministries.map((m) => {
          const joined = myIds.has(m.id);
          return (
            <div key={m.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{m.name}</h3>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-gray-400">{m.member_count} members</span>
                  {/* Edit/Delete — Staff+ only */}
                  {isAtLeast('staff') && (
                    <>
                      <button
                        onClick={() => openEdit(m)}
                        className="ml-1 text-xs text-church-500 hover:text-church-700 font-medium px-1.5 py-0.5 rounded hover:bg-church-50 transition-colors"
                        title="Edit ministry"
                      >
                        Edit
                      </button>
                      {hasRole('admin') && (
                        <button
                          onClick={() => setDeleteTarget(m)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                          title="Delete ministry"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              {m.description && <p className="text-sm text-gray-600 flex-1">{m.description}</p>}
              {m.meets_at && (
                <p className="text-xs text-church-600 font-medium">{m.meets_at}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {m.leader_name && <span>Leader: {m.leader_name}</span>}
                {parseInt(m.event_count) > 0 && (
                  <span className="bg-gold-50 text-gold-600 px-2 py-0.5 rounded-full font-medium">
                    {m.event_count} event{m.event_count === '1' ? '' : 's'}
                  </span>
                )}
              </div>
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
