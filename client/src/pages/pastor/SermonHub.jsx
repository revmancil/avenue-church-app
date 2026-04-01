import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function SermonHub() {
  const { isAtLeast } = useAuth();
  const [sermons, setSermons]   = useState([]);
  const [series, setSeries]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({
    title: '', scripture: '', notes: '', sermon_date: '', series_id: '',
    preacher: 'Dr. Mancil Carroll III', audio_url: '', video_url: ''
  });

  const load = async () => {
    try {
      const [s, sr] = await Promise.all([api.get('/sermons'), api.get('/sermons/series')]);
      setSermons(s.data);
      setSeries(sr.data);
    } catch {
      toast.error('Failed to load sermons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sermons', form);
      toast.success('Sermon added');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add sermon');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sermon Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Messages from Avenue Progressive Baptist Church</p>
        </div>
        {isAtLeast('pastor') && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            + Add Sermon
          </button>
        )}
      </div>

      {/* Active Series Banner */}
      {series.length > 0 && (
        <div className="card bg-gradient-to-r from-church-700 to-church-500 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Current Series</p>
          <h2 className="text-xl font-bold">{series[0].title}</h2>
          {series[0].description && <p className="text-sm opacity-80 mt-1">{series[0].description}</p>}
        </div>
      )}

      {/* Add Sermon Form */}
      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">New Sermon</h3>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input required className="input" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scripture</label>
              <input className="input" placeholder="e.g. Matthew 6:33" value={form.scripture}
                onChange={(e) => setForm({ ...form, scripture: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input required type="date" className="input" value={form.sermon_date}
                onChange={(e) => setForm({ ...form, sermon_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preacher</label>
              <input className="input" value={form.preacher}
                onChange={(e) => setForm({ ...form, preacher: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Series</label>
              <select className="input" value={form.series_id}
                onChange={(e) => setForm({ ...form, series_id: e.target.value })}>
                <option value="">No series</option>
                {series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={3} className="input" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">Save Sermon</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Sermon List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card text-center text-gray-400 py-10">Loading…</div>
        ) : sermons.length === 0 ? (
          <div className="card text-center text-gray-400 py-10">No sermons yet</div>
        ) : sermons.map((s) => (
          <div key={s.id} className="card flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-14 h-14 bg-church-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-church-600 font-bold text-lg">✝</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900">{s.title}</h3>
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(s.sermon_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {s.scripture && <p className="text-sm text-church-600 mt-0.5">{s.scripture}</p>}
              <p className="text-sm text-gray-500 mt-0.5">Preacher: {s.preacher}</p>
              {s.series_title && (
                <span className="mt-2 inline-block bg-church-50 text-church-700 text-xs px-2 py-0.5 rounded-full">
                  {s.series_title}
                </span>
              )}
              {s.notes && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{s.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
