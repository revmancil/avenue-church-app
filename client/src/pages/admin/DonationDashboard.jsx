import { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { X, Search, User } from 'lucide-react';

const FUNDS   = ['General', 'Building Fund', 'Missions', 'Youth Ministry', 'Benevolence'];
const METHODS = ['cash', 'check', 'card', 'online', 'other'];
const EMPTY_FORM = {
  donor_type: 'member',   // 'member' | 'guest' | 'anonymous'
  user_id:    '',
  donor_name: '',
  amount:     '',
  fund:       'General',
  method:     'cash',
  donated_at: '',
  notes:      '',
};

export default function DonationDashboard() {
  const [data, setData]           = useState({ donations: [], total_amount: 0 });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [filters, setFilters]     = useState({ from: '', to: '', fund: '' });
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [activeTab, setActiveTab]   = useState('overview');
  const [form, setForm]             = useState(EMPTY_FORM);
  // Member search state
  const [memberSearch, setMemberSearch]   = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchOpen, setSearchOpen]       = useState(false);
  const searchRef = useRef(null);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      const [donRes, analyticsRes] = await Promise.all([
        api.get('/donations', { params: filters }),
        api.get('/donations/analytics'),
      ]);
      setData(donRes.data);
      setAnalytics(analyticsRes.data);
    } catch {
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDonations(); }, [filters]);

  const openModal  = () => {
    setForm(EMPTY_FORM);
    setMemberSearch('');
    setMemberResults([]);
    setSelectedMember(null);
    setSearchOpen(false);
    setShowModal(true);
  };
  const closeModal = () => setShowModal(false);

  // Search members as user types
  useEffect(() => {
    if (!memberSearch.trim() || form.donor_type !== 'member') {
      setMemberResults([]);
      setSearchOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/users', { params: { search: memberSearch, limit: 10 } });
        setMemberResults(data.users || []);
        setSearchOpen(true);
      } catch { /* silent */ }
    }, 250);
    return () => clearTimeout(t);
  }, [memberSearch, form.donor_type]);

  const selectMember = (u) => {
    setSelectedMember(u);
    setMemberSearch(`${u.first_name} ${u.last_name}`);
    setForm((f) => ({ ...f, user_id: u.id }));
    setSearchOpen(false);
  };

  const clearMember = () => {
    setSelectedMember(null);
    setMemberSearch('');
    setForm((f) => ({ ...f, user_id: '' }));
  };

  const changeDonorType = (type) => {
    setForm((f) => ({ ...f, donor_type: type, user_id: '', donor_name: '' }));
    setSelectedMember(null);
    setMemberSearch('');
    setMemberResults([]);
    setSearchOpen(false);
  };

  const recordDonation = async (e) => {
    e.preventDefault();
    if (form.donor_type === 'member' && !form.user_id) {
      toast.error('Please select a member from the list');
      return;
    }
    if (form.donor_type === 'guest' && !form.donor_name.trim()) {
      toast.error('Please enter the donor\'s name');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        amount:     form.amount,
        fund:       form.fund,
        method:     form.method,
        donated_at: form.donated_at,
        notes:      form.notes,
        user_id:    form.donor_type === 'member' ? form.user_id : null,
        donor_name: form.donor_type === 'guest'  ? form.donor_name : null,
      };
      await api.post('/donations', payload);
      const label = form.donor_type === 'member'
        ? memberSearch
        : form.donor_type === 'guest'
        ? form.donor_name
        : 'Anonymous';
      toast.success(`Donation recorded for ${label}`);
      closeModal();
      fetchDonations();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record donation');
    } finally {
      setSaving(false);
    }
  };

  const ytdTotal = analytics?.monthly?.reduce((s, m) => s + parseFloat(m.total || 0), 0) || 0;

  const field = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-church-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donation Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Financial records — Admin access only</p>
        </div>
        <button onClick={openModal} className="btn-primary">+ Record Donation</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-church-500 text-white">
          <p className="text-xs opacity-75">All-Time Total</p>
          <p className="text-2xl font-bold mt-1">${data.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Year-to-Date</p>
          <p className="text-2xl font-bold mt-1 text-church-600">${ytdTotal.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Avg Gift / Donor</p>
          <p className="text-2xl font-bold mt-1">${analytics?.summary?.avg_per_donor || '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{analytics?.summary?.total_donors || 0} donors</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Total Gifts</p>
          <p className="text-2xl font-bold mt-1">{analytics?.summary?.total_gifts || 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">Avg ${analytics?.summary?.avg_per_gift || '—'} each</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['overview', 'records', 'by_fund'].map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === t
                ? 'border-church-500 text-church-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'by_fund' ? 'By Fund' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Giving ({new Date().getFullYear()})</h3>
            {!analytics?.monthly?.length ? (
              <p className="text-gray-400 text-sm">No data yet for this year</p>
            ) : (
              <div className="space-y-2">
                {analytics.monthly.map((m) => {
                  const pct = ytdTotal > 0 ? (parseFloat(m.total) / ytdTotal) * 100 : 0;
                  return (
                    <div key={m.month}>
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="text-gray-600">{m.month}</span>
                        <span className="font-medium">${parseFloat(m.total).toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-church-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Donations</h3>
            <div className="space-y-3">
              {!analytics?.recent?.length ? (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">No donations recorded yet</p>
                  <button onClick={openModal}
                    className="mt-3 text-sm font-medium text-church-700 hover:text-church-900 underline">
                    Record the first donation
                  </button>
                </div>
              ) : analytics.recent.map((d) => (
                <div key={d.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {d.first_name ? `${d.first_name} ${d.last_name}` : 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {d.fund} · {new Date(d.donated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-green-600">${parseFloat(d.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4">Year-over-Year</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="pb-2">Year</th>
                    <th className="pb-2">Total Giving</th>
                    <th className="pb-2">Gifts</th>
                    <th className="pb-2">Donors</th>
                    <th className="pb-2">Avg / Donor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {analytics?.yearly?.map((y) => (
                    <tr key={y.year}>
                      <td className="py-2 font-medium">{y.year}</td>
                      <td className="py-2 text-green-700 font-semibold">${parseFloat(y.total).toFixed(2)}</td>
                      <td className="py-2">{y.count}</td>
                      <td className="py-2">{y.donor_count}</td>
                      <td className="py-2">${y.donor_count > 0 ? (parseFloat(y.total) / y.donor_count).toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                  {!analytics?.yearly?.length && (
                    <tr><td colSpan={5} className="py-4 text-center text-gray-400 text-sm">No data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <>
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

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Date', 'Member', 'Amount', 'Fund', 'Method'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading…</td></tr>
                  ) : data.donations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10">
                        <p className="text-gray-400 text-sm">No donations recorded yet</p>
                        <button onClick={openModal}
                          className="mt-2 text-sm font-medium text-church-700 hover:text-church-900 underline">
                          Record a donation
                        </button>
                      </td>
                    </tr>
                  ) : data.donations.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{new Date(d.donated_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{d.first_name ? `${d.first_name} ${d.last_name}` : 'Anonymous'}</td>
                      <td className="px-4 py-3 font-semibold text-green-700">${parseFloat(d.amount).toFixed(2)}</td>
                      <td className="px-4 py-3">{d.fund}</td>
                      <td className="px-4 py-3 capitalize text-gray-500">{d.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* By Fund Tab */}
      {activeTab === 'by_fund' && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Giving by Fund</h3>
          {!analytics?.by_fund?.length ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">No fund data yet</p>
              <button onClick={openModal}
                className="mt-2 text-sm font-medium text-church-700 hover:text-church-900 underline">
                Record a donation
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.by_fund.map((f) => {
                const pct = data.total_amount > 0 ? (parseFloat(f.total) / data.total_amount) * 100 : 0;
                return (
                  <div key={f.fund}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{f.fund}</span>
                      <span className="text-gray-500">{f.count} gifts · <span className="font-semibold text-gray-900">${parseFloat(f.total).toFixed(2)}</span></span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-church-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{pct.toFixed(1)}% of total</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Record Donation Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Record Donation</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={recordDonation} className="p-6 space-y-4">

              {/* ── Donor type selector ── */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Donor</label>
                <div className="flex gap-2 mb-3">
                  {[
                    { key: 'member',    label: 'Member' },
                    { key: 'guest',     label: 'Guest / Non-member' },
                    { key: 'anonymous', label: 'Anonymous' },
                  ].map(({ key, label }) => (
                    <button
                      key={key} type="button"
                      onClick={() => changeDonorType(key)}
                      className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg border transition-colors ${
                        form.donor_type === key
                          ? 'bg-church-700 text-white border-church-700'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-church-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Member search */}
                {form.donor_type === 'member' && (
                  <div className="relative" ref={searchRef}>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        className={`${field} pl-8 pr-8`}
                        placeholder="Search by name or email…"
                        value={memberSearch}
                        onChange={(e) => { setMemberSearch(e.target.value); setSelectedMember(null); setForm((f) => ({ ...f, user_id: '' })); }}
                        autoComplete="off"
                      />
                      {selectedMember && (
                        <button type="button" onClick={clearMember}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    {searchOpen && memberResults.length > 0 && (
                      <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {memberResults.map((u) => (
                          <li key={u.id}>
                            <button type="button" onClick={() => selectMember(u)}
                              className="w-full text-left px-4 py-2.5 hover:bg-church-50 text-sm">
                              <span className="font-medium text-gray-900">{u.first_name} {u.last_name}</span>
                              <span className="text-gray-400 text-xs ml-2">{u.email}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {searchOpen && memberResults.length === 0 && memberSearch.trim() && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-sm text-gray-400">
                        No members found
                      </div>
                    )}
                    {selectedMember && (
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-green-700 font-medium">
                        <User size={12} />
                        {selectedMember.first_name} {selectedMember.last_name} selected
                      </div>
                    )}
                  </div>
                )}

                {/* Guest name */}
                {form.donor_type === 'guest' && (
                  <input
                    className={field}
                    placeholder="Enter donor's full name"
                    value={form.donor_name}
                    onChange={(e) => setForm({ ...form, donor_name: e.target.value })}
                  />
                )}

                {/* Anonymous note */}
                {form.donor_type === 'anonymous' && (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                    This donation will be recorded without a name attached.
                  </p>
                )}
              </div>

              {/* ── Amount ── */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount ($) *</label>
                <input
                  required type="number" min="0.01" step="0.01"
                  className={field} placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Fund</label>
                  <select className={field} value={form.fund}
                    onChange={(e) => setForm({ ...form, fund: e.target.value })}>
                    {FUNDS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Method</label>
                  <select className={field} value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}>
                    {METHODS.map((m) => (
                      <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                <input type="date" className={field} value={form.donated_at}
                  onChange={(e) => setForm({ ...form, donated_at: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes (optional)</label>
                <input type="text" className={field} placeholder="e.g. Sunday offering"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 text-sm font-semibold bg-church-700 hover:bg-church-800 text-white rounded-lg disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save Donation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
