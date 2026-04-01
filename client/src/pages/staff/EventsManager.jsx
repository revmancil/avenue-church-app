import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function EventsManager() {
  const { isAtLeast } = useAuth();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rsvps, setRsvps]     = useState([]);
  const [form, setForm]       = useState({
    title: '', description: '', location: '', event_date: '', end_date: '', max_capacity: '', is_public: true
  });

  const load = async () => {
    try {
      const { data } = await api.get('/events');
      setEvents(data);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', form);
      toast.success('Event created');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create event');
    }
  };

  const handleRsvp = async (eventId, status = 'attending') => {
    try {
      await api.post(`/events/${eventId}/rsvp`, { status });
      toast.success('RSVP updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'RSVP failed');
    }
  };

  const viewRsvps = async (event) => {
    setSelectedEvent(event);
    try {
      const { data } = await api.get(`/events/${event.id}/rsvps`);
      setRsvps(data);
    } catch {
      toast.error('Failed to load RSVPs');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">Church events, services, and gatherings</p>
        </div>
        {isAtLeast('staff') && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ Create Event</button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h3 className="font-semibold mb-4">New Event</h3>
          <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input required className="input" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
              <input required type="datetime-local" className="input" value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
              <input type="datetime-local" className="input" value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input className="input" placeholder="Main Sanctuary" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
              <input type="number" className="input" value={form.max_capacity}
                onChange={(e) => setForm({ ...form, max_capacity: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea rows={3} className="input" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">Save Event</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* RSVP Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">RSVPs — {selectedEvent.title}</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {rsvps.length === 0 ? (
              <p className="text-gray-400 text-sm">No RSVPs yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500">
                  <th className="pb-2">Name</th><th>Email</th><th>Status</th>
                </tr></thead>
                <tbody className="divide-y">
                  {rsvps.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2">{r.first_name} {r.last_name}</td>
                      <td className="py-2 text-gray-500">{r.email}</td>
                      <td className="py-2 capitalize">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Events grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="card text-center text-gray-400 py-10">Loading…</div>
        ) : events.length === 0 ? (
          <div className="card text-center text-gray-400 py-10">No events scheduled</div>
        ) : events.map((ev) => (
          <div key={ev.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 bg-gold-50 rounded-xl flex flex-col items-center justify-center shrink-0 border border-gold-200">
              <span className="text-xs text-gold-600 font-semibold">
                {new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
              </span>
              <span className="text-2xl font-bold text-gold-700">
                {new Date(ev.event_date).getDate()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">{ev.title}</h3>
              <p className="text-sm text-gray-500">
                {new Date(ev.event_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                {ev.location ? ` · ${ev.location}` : ''}
              </p>
              {ev.description && <p className="text-sm text-gray-600 mt-1 line-clamp-1">{ev.description}</p>}
              <span className="text-xs text-gray-400 mt-1 inline-block">
                {ev.rsvp_count} attending{ev.max_capacity ? ` / ${ev.max_capacity} capacity` : ''}
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleRsvp(ev.id, 'attending')} className="btn-primary text-xs py-1.5 px-3">
                RSVP
              </button>
              {isAtLeast('staff') && (
                <button onClick={() => viewRsvps(ev)} className="btn-secondary text-xs py-1.5 px-3">
                  View RSVPs
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
