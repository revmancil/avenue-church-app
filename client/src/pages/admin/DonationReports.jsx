import { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Download, Printer, FileText, TrendingUp, Users, Gift } from 'lucide-react';

const FUNDS = ['', 'General', 'Building Fund', 'Missions', 'Youth Ministry', 'Benevolence'];
const METHODS = ['', 'cash', 'check', 'card', 'online', 'other'];

const today = new Date().toISOString().split('T')[0];
const firstOfYear = `${new Date().getFullYear()}-01-01`;

export default function DonationReports() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [filters, setFilters]     = useState({ from: firstOfYear, to: today, fund: '', method: '' });
  const printRef = useRef(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.from)   params.from   = filters.from;
      if (filters.to)     params.to     = filters.to;
      if (filters.fund)   params.fund   = filters.fund;
      if (filters.method) params.method = filters.method;
      params.limit = 1000;

      const { data } = await api.get('/donations', { params });
      setDonations(data.donations || []);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  /* ── Computed summary ── */
  const totalAmount   = donations.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const totalGifts    = donations.length;
  const uniqueDonors  = new Set(donations.filter((d) => d.user_id).map((d) => d.user_id)).size;
  const avgGift       = totalGifts > 0 ? totalAmount / totalGifts : 0;

  const byFund = FUNDS.filter(Boolean).map((fund) => {
    const gifts = donations.filter((d) => d.fund === fund);
    return { fund, count: gifts.length, total: gifts.reduce((s, d) => s + parseFloat(d.amount || 0), 0) };
  }).filter((f) => f.count > 0);

  /* ── CSV export ── */
  const exportCSV = () => {
    const headers = ['Date', 'Member', 'Amount', 'Fund', 'Method', 'Notes'];
    const rows = donations.map((d) => [
      new Date(d.donated_at).toLocaleDateString(),
      d.first_name ? `${d.first_name} ${d.last_name}` : 'Anonymous',
      parseFloat(d.amount).toFixed(2),
      d.fund || '',
      d.method || '',
      (d.notes || '').replace(/,/g, ';'),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `donation-report-${filters.from}-to-${filters.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  /* ── Print ── */
  const handlePrint = () => window.print();

  const periodLabel = filters.from && filters.to
    ? `${new Date(filters.from).toLocaleDateString()} – ${new Date(filters.to).toLocaleDateString()}`
    : 'All time';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donation Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Filter, review, and export giving records</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={donations.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card print:hidden">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Filter Report</h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input type="date" className="input text-sm"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input type="date" className="input text-sm"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fund</label>
            <select className="input text-sm" value={filters.fund}
              onChange={(e) => setFilters({ ...filters, fund: e.target.value })}>
              {FUNDS.map((f) => <option key={f} value={f}>{f || 'All Funds'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Method</label>
            <select className="input text-sm" value={filters.method}
              onChange={(e) => setFilters({ ...filters, method: e.target.value })}>
              {METHODS.map((m) => <option key={m} value={m}>{m ? m.charAt(0).toUpperCase() + m.slice(1) : 'All Methods'}</option>)}
            </select>
          </div>
          <button
            onClick={fetchReport}
            className="bg-church-700 hover:bg-church-800 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            Run Report
          </button>
        </div>
      </div>

      {/* ── Printable content starts here ── */}
      <div ref={printRef}>

        {/* Print header (hidden on screen) */}
        <div className="hidden print:block mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">Avenue Progressive Baptist Church</h1>
          <h2 className="text-lg text-gray-700">Donation Report</h2>
          <p className="text-sm text-gray-500">Period: {periodLabel}</p>
          {filters.fund   && <p className="text-sm text-gray-500">Fund: {filters.fund}</p>}
          {filters.method && <p className="text-sm text-gray-500">Method: {filters.method}</p>}
          <p className="text-sm text-gray-400">Generated: {new Date().toLocaleString()}</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-church-700 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Gift size={16} className="opacity-75" />
              <p className="text-xs opacity-75">Total Giving</p>
            </div>
            <p className="text-2xl font-bold">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs opacity-60 mt-0.5">{periodLabel}</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-gray-400" />
              <p className="text-xs text-gray-500">Total Gifts</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalGifts}</p>
            <p className="text-xs text-gray-400 mt-0.5">Transactions</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-gray-400" />
              <p className="text-xs text-gray-500">Unique Donors</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{uniqueDonors}</p>
            <p className="text-xs text-gray-400 mt-0.5">+ anonymous</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-gray-400" />
              <p className="text-xs text-gray-500">Avg Gift</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">${avgGift.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Per transaction</p>
          </div>
        </div>

        {/* Fund breakdown */}
        {byFund.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Giving by Fund</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {byFund.map((f) => (
                <div key={f.fund} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700">{f.fund}</p>
                  <p className="text-xl font-bold text-church-700 mt-1">
                    ${f.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{f.count} gift{f.count !== 1 ? 's' : ''} · {totalAmount > 0 ? ((f.total / totalAmount) * 100).toFixed(1) : 0}% of total</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Donations table */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Transaction Detail</h3>
            <span className="text-xs text-gray-400">{totalGifts} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Date', 'Member', 'Amount', 'Fund', 'Method', 'Notes'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading…</td></tr>
                ) : donations.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">No donations match the selected filters</td></tr>
                ) : (
                  <>
                    {donations.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">{new Date(d.donated_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{d.first_name ? `${d.first_name} ${d.last_name}` : <span className="text-gray-400">Anonymous</span>}</td>
                        <td className="px-4 py-3 font-semibold text-green-700">${parseFloat(d.amount).toFixed(2)}</td>
                        <td className="px-4 py-3">{d.fund || '—'}</td>
                        <td className="px-4 py-3 capitalize text-gray-500">{d.method || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{d.notes || '—'}</td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                      <td className="px-4 py-3" colSpan={2}>Total ({totalGifts} gifts)</td>
                      <td className="px-4 py-3 text-green-700">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td colSpan={3}></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print footer */}
        <div className="hidden print:block mt-8 pt-4 border-t text-xs text-gray-400 text-center">
          Avenue Progressive Baptist Church — Confidential Financial Report — {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
