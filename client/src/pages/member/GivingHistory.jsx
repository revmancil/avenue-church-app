import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function GivingHistory() {
  const [data, setData]     = useState({ giving: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/donations/my-giving')
      .then(({ data }) => setData(data))
      .catch(() => toast.error('Failed to load giving history'))
      .finally(() => setLoading(false));
  }, []);

  const ytd = data.giving
    .filter((g) => new Date(g.donated_at).getFullYear() === new Date().getFullYear())
    .reduce((s, g) => s + parseFloat(g.amount), 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Giving History</h1>
        <p className="text-sm text-gray-500 mt-1">Personal giving records — visible only to you</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card bg-church-500 text-white">
          <p className="text-sm opacity-75">Year-to-Date Giving</p>
          <p className="text-3xl font-bold mt-1">${ytd.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total All-Time</p>
          <p className="text-3xl font-bold mt-1">${data.total.toFixed(2)}</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Date', 'Fund', 'Amount', 'Method'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">Loading…</td></tr>
              ) : data.giving.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">No giving records found</td></tr>
              ) : data.giving.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{new Date(g.donated_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{g.fund}</td>
                  <td className="px-4 py-3 font-semibold text-green-700">${parseFloat(g.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 capitalize text-gray-500">{g.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
