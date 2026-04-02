import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { UserPlus, X, Pencil } from 'lucide-react';

const ROLES = ['member', 'staff', 'pastor', 'admin'];

const EMPTY_NEW = { first_name: '', last_name: '', email: '', phone: '', role: 'member', password: '' };
const EMPTY_EDIT = { first_name: '', last_name: '', email: '', phone: '', address: '', bio: '' };

export default function AdminDashboard() {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  // Add member modal
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState(EMPTY_NEW);
  const [addSaving, setAddSaving] = useState(false);

  // Edit member modal
  const [editUser, setEditUser]   = useState(null);   // user object being edited
  const [editForm, setEditForm]   = useState(EMPTY_EDIT);
  const [editSaving, setEditSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users', { params: { search, limit: 100 } });
      setUsers(data.users);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search]);

  /* ── Role change ── */
  const handleRoleChange = async (userId, role) => {
    try {
      await api.patch(`/users/${userId}/role`, { role });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
      toast.success('Role updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    }
  };

  /* ── Activate / Deactivate ── */
  const toggleStatus = async (user) => {
    try {
      await api.patch(`/users/${user.id}/status`, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
      toast.success(user.is_active ? 'User deactivated' : 'User reactivated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  /* ── Add member ── */
  const openAdd = () => { setAddForm(EMPTY_NEW); setShowAdd(true); };
  const closeAdd = () => setShowAdd(false);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddSaving(true);
    try {
      const { data } = await api.post('/users', addForm);
      setUsers((prev) => [...prev, data]);
      toast.success(`${data.first_name} ${data.last_name} added!`);
      closeAdd();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create member');
    } finally {
      setAddSaving(false);
    }
  };

  /* ── Edit member ── */
  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({
      first_name: u.first_name || '',
      last_name:  u.last_name  || '',
      email:      u.email      || '',
      phone:      u.phone      || '',
      address:    u.address    || '',
      bio:        u.bio        || '',
    });
  };
  const closeEdit = () => setEditUser(null);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const { data } = await api.patch(`/users/${editUser.id}`, editForm);
      setUsers((prev) => prev.map((u) => u.id === data.id ? { ...u, ...data } : u));
      toast.success('Member updated!');
      closeEdit();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update member');
    } finally {
      setEditSaving(false);
    }
  };

  /* ── Shared field style ── */
  const field = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-church-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all church member accounts and roles</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-church-50 text-church-700 text-sm font-medium px-3 py-1 rounded-full">
            {users.length} members
          </span>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-church-700 hover:bg-church-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <UserPlus size={16} />
            Add Member
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <input
          type="text"
          className="input max-w-sm"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Email', 'Phone', 'Role', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.first_name} {u.last_name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{u.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-church-500"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(u)}
                        className="flex items-center gap-1 text-xs font-medium text-church-700 hover:text-church-900"
                        title="Edit member"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        onClick={() => toggleStatus(u)}
                        className={`text-xs font-medium ${u.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Member Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Add New Member</h2>
              <button onClick={closeAdd} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
                  <input className={field} required value={addForm.first_name}
                    onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
                  <input className={field} required value={addForm.last_name}
                    onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address *</label>
                <input className={field} type="email" required value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Temporary Password *</label>
                <input className={field} type="password" required minLength={8} value={addForm.password}
                  placeholder="Min. 8 characters"
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                <input className={field} type="tel" value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
                <select className={field} value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeAdd}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</button>
                <button type="submit" disabled={addSaving}
                  className="px-5 py-2 text-sm font-semibold bg-church-700 hover:bg-church-800 text-white rounded-lg disabled:opacity-60">
                  {addSaving ? 'Adding…' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Member Modal ── */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Edit Member</h2>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                  <input className={field} value={editForm.first_name}
                    onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
                  <input className={field} value={editForm.last_name}
                    onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                <input className={field} type="email" value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                <input className={field} type="tel" value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                <input className={field} value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Bio</label>
                <textarea className={field} rows={2} value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} />
              </div>
              <p className="text-xs text-gray-400">To change the role or password, use the table row controls.</p>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</button>
                <button type="submit" disabled={editSaving}
                  className="px-5 py-2 text-sm font-semibold bg-church-700 hover:bg-church-800 text-white rounded-lg disabled:opacity-60">
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
