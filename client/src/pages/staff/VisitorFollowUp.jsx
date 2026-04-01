import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function VisitorFollowUp() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('pending'); // 'pending' | 'all'
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({
    first_name: '', last_name: '', email: '', phone: '', visit_date: '', how_heard: '', notes: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = filter === 'pending' ? { followup_sent: false } : {};
      const { data } = await api.get('/visitors', { params });
      setVisitors(data);
    } catch {
      toast.error('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const addVisitor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/visitors', form);
      toast.success('Visitor added');
      setShowForm(false);
      setForm({ first_name: '', last_name: '', email: '', phone: '', visit_date: '', how_heard: '', notes: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add visitor');
    }
  };

  const sendFollowup = async (visitor) => {
    try {
      await api.post(`/visitors/${visitor.id}/followup`);
      toast.success(`Follow-up sent to ${visitor.email}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send follow-up');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visitor Follow-up Queue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Follow-up emails are sent from Pastor Dr. Mancil Carroll III
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Add Visitor</button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">New Visitor</h3>
          <form onSubmit={addVisitor} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input required className="input" value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input required className="input" value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="input" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input className="input" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
              <input type="date" className="input" value={form.visit_date}
                onChange={(e) => setForm({ ...form, visit_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">How did they hear about us?</label>
              <input className="input" value={form.how_heard}
                onChange={(e) => setForm({ ...form, how_heard: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">Save Visitor</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['pending', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-church-500 text-white' : 'bg-white border border-gray-300 text-gray-600'
            }`}>
            {f === 'pending' ? 'Needs Follow-up' : 'All Visitors'}
          </button>
        ))}
      </div>

      {/* Visitor cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="card text-center text-gray-400 py-10">Loading…</div>
        ) : visitors.length === 0 ? (
          <div className="card text-center text-gray-400 py-10">
            {filter === 'pending' ? 'No pending follow-ups!' : 'No visitors recorded'}
          </div>
        ) : visitors.map((v) => (
          <div key={v.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center shrink-0 font-bold text-gold-700">
              {v.first_name[0]}{v.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{v.first_name} {v.last_name}</p>
              <p className="text-sm text-gray-500">
                {v.email || 'No email'} {v.phone ? `· ${v.phone}` : ''}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Visited: {new Date(v.visit_date).toLocaleDateString()}
                {v.how_heard ? ` · Heard via: ${v.how_heard}` : ''}
              </p>
            </div>
            <div className="shrink-0">
              {v.followup_sent ? (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  Follow-up Sent ✓
                </span>
              ) : (
                <button
                  onClick={() => sendFollowup(v)}
                  disabled={!v.email}
                  className="btn-primary text-xs py-1.5 px-3 disabled:opacity-40"
                  title={!v.email ? 'No email on file' : 'Send follow-up email from Pastor Carroll'}
                >
                  Send Follow-up
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
