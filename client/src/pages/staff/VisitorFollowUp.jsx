import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const FUNNEL_STAGES = ['new', 'contacted', 'follow_up', 'converted', 'inactive'];

const STATUS_LABELS = {
  new:       { label: 'New',        color: 'bg-blue-100 text-blue-700' },
  contacted: { label: 'Contacted',  color: 'bg-yellow-100 text-yellow-700' },
  follow_up: { label: 'Follow-up',  color: 'bg-orange-100 text-orange-700' },
  converted: { label: 'Converted',  color: 'bg-green-100 text-green-700' },
  inactive:  { label: 'Inactive',   color: 'bg-gray-100 text-gray-500' },
};

// Valid transitions per status
const NEXT_STATUSES = {
  new:       ['contacted', 'inactive'],
  contacted: ['follow_up', 'converted', 'inactive'],
  follow_up: ['converted', 'contacted', 'inactive'],
  converted: ['inactive'],
  inactive:  ['new'],
};

export default function VisitorFollowUp() {
  const [visitors, setVisitors]   = useState([]);
  const [funnel, setFunnel]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({
    first_name: '', last_name: '', email: '', phone: '', visit_date: '', how_heard: '', notes: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const { data } = await api.get('/visitors', { params });
      setVisitors(data.visitors);
      setFunnel(data.funnel || []);
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
      const { data } = await api.post(`/visitors/${visitor.id}/followup`);
      toast.success(`Follow-up sent — status updated to "${data.new_status}"`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send follow-up');
    }
  };

  const advanceStatus = async (visitor, newStatus) => {
    try {
      await api.patch(`/visitors/${visitor.id}/status`, { status: newStatus });
      toast.success(`Status updated to "${STATUS_LABELS[newStatus]?.label}"`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const funnelMap = Object.fromEntries(funnel.map((f) => [f.status, parseInt(f.count)]));
  const totalVisitors = Object.values(funnelMap).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visitor Follow-up Queue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Follow-up emails signed by Pastor Dr. Mancil Carroll III
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Add Visitor</button>
      </div>

      {/* Funnel summary */}
      <div className="grid grid-cols-5 gap-2">
        {FUNNEL_STAGES.map((stage, i) => (
          <div key={stage} className="card text-center p-3 relative">
            <p className="text-2xl font-bold text-gray-900">{funnelMap[stage] || 0}</p>
            <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${STATUS_LABELS[stage].color}`}>
              {STATUS_LABELS[stage].label}
            </p>
            {i < FUNNEL_STAGES.length - 1 && (
              <span className="absolute -right-1 top-1/2 -translate-y-1/2 text-gray-300 text-lg z-10">›</span>
            )}
          </div>
        ))}
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
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-church-500 text-white' : 'bg-white border border-gray-300 text-gray-600'
          }`}>
          All ({totalVisitors})
        </button>
        {FUNNEL_STAGES.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s ? 'bg-church-500 text-white' : 'bg-white border border-gray-300 text-gray-600'
            }`}>
            {STATUS_LABELS[s].label} ({funnelMap[s] || 0})
          </button>
        ))}
      </div>

      {/* Visitor cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="card text-center text-gray-400 py-10">Loading…</div>
        ) : visitors.length === 0 ? (
          <div className="card text-center text-gray-400 py-10">No visitors in this stage</div>
        ) : visitors.map((v) => (
          <div key={v.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center shrink-0 font-bold text-gold-700">
              {v.first_name[0]}{v.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-gray-900">{v.first_name} {v.last_name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[v.status]?.color}`}>
                  {STATUS_LABELS[v.status]?.label}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {v.email || 'No email'}{v.phone ? ` · ${v.phone}` : ''}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Visited: {new Date(v.visit_date).toLocaleDateString()}
                {v.how_heard ? ` · Via: ${v.how_heard}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {/* Status transitions */}
              {NEXT_STATUSES[v.status]?.map((nextStatus) => (
                <button key={nextStatus}
                  onClick={() => advanceStatus(v, nextStatus)}
                  className="btn-secondary text-xs py-1 px-2">
                  → {STATUS_LABELS[nextStatus]?.label}
                </button>
              ))}
              {/* Follow-up email */}
              {!v.followup_sent && v.email && (
                <button onClick={() => sendFollowup(v)} className="btn-primary text-xs py-1 px-2">
                  Send Follow-up
                </button>
              )}
              {v.followup_sent && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                  Email Sent ✓
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
