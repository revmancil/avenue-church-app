import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function DonationDashboard() {
  const [data, setData]         = useState({ donations: [], total_amount: 0 });
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({ from: '', to: '', fund: '' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ amount: '', fund: 'General', method: 'cash', donated_at: '', notes: '' });

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/donations', { params: filters });
      setData(res);
    } catch {
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDonations(); }, [filters]);

  const recordDonation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/donations', form);
      toast.success('Donation recorded');
      setShowForm(false);
      setForm({ amount: '', fund: 'General', method: 'cash', donated_at: '', notes: '' });
      fetchDonations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record donation');
    }
  };

  const FUNDS = ['General', 'Building Fund', 'Missions', 'Youth Ministry', 'Benevolence'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donation Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Financial records — Admin access only</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + Record Donation
        </button>
      </div>

      {/* Total card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-church-500 text-white">
          <p className="text-sm opacity-75">Total Giving</p>
          <p className="text-3xl font-bold mt-1">${data.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Records</p>
          <p className="text-3xl font-bold mt-1">{data.donations.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Average Gift</p>
          <p className="text-3xl font-bold mt-1">
            ${data.donations.length ? (data.total_amount / data.donations.length).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Record form */}
      {showForm && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Record New Donation</h3>
          <form onSubmit={recordDonation} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
              <input required type="number" min="0.01" step="0.01" className="input"
                value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fund</label>
              <select className="input" value={form.fund} onChange={(e) => setForm({ ...form, fund: e.target.value })}>
                {FUNDS.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select className="input" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                {['cash', 'check', 'card', 'online', 'other'].map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" className="input" value={form.donated_at}
                onChange={(e) => setForm({ ...form, donated_at: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" className="input text-sm" value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" className="input text-sm" value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fund</label>
          <select className="input text-sm" value={filters.fund}
            onChange={(e) => setFilters({ ...filters, fund: e.target.value })}>
            <option value="">All Funds</option>
            {FUNDS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Date', 'Member', 'Amount', 'Fund', 'Method', 'Notes'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : data.donations.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(d.donated_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{d.first_name ? `${d.first_name} ${d.last_name}` : 'Anonymous'}</td>
                  <td className="px-4 py-3 font-semibold text-green-700">${parseFloat(d.amount).toFixed(2)}</td>
                  <td className="px-4 py-3">{d.fund}</td>
                  <td className="px-4 py-3 capitalize">{d.method}</td>
                  <td className="px-4 py-3 text-gray-500">{d.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
