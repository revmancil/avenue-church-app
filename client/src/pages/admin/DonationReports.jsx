import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Printer, Download, ChevronDown, ChevronUp, Settings2, X } from 'lucide-react';

const STORAGE_KEY = 'avenue_church_info';

const DEFAULT_CHURCH = {
  name:    'Avenue Progressive Baptist Church',
  address: '',
  city:    '',
  state:   '',
  zip:     '',
  phone:   '',
  ein:     '',
  pastor:  '',
  title:   'Pastor',
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

/* ── helpers ── */
function fmt(amount) {
  return parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

/* ── Group donations by donor ── */
function groupByDonor(donations) {
  const map = {};
  donations.forEach((d) => {
    const key = d.user_id || `anon-${d.id}`;
    if (!map[key]) {
      map[key] = {
        user_id:    d.user_id,
        first_name: d.first_name || '',
        last_name:  d.last_name  || '',
        email:      d.email      || '',
        address:    d.address    || '',
        donations:  [],
        total:      0,
      };
    }
    map[key].donations.push(d);
    map[key].total += parseFloat(d.amount || 0);
  });
  return Object.values(map).sort((a, b) => a.last_name.localeCompare(b.last_name));
}

/* ── Individual Statement Component (also used for print) ── */
function GivingStatement({ donor, church, year, isPrint = false }) {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const fullName = [donor.first_name, donor.last_name].filter(Boolean).join(' ') || 'Anonymous Donor';

  return (
    <div className={isPrint ? 'print-statement' : 'space-y-4'}>
      {/* Church letterhead */}
      <div className={`text-center border-b-2 pb-4 mb-4 ${isPrint ? 'border-black' : 'border-church-700'}`}>
        <h2 className="text-xl font-bold text-gray-900">{church.name}</h2>
        {church.address && <p className="text-sm text-gray-600">{church.address}</p>}
        {(church.city || church.state || church.zip) && (
          <p className="text-sm text-gray-600">
            {[church.city, church.state].filter(Boolean).join(', ')}{church.zip ? ` ${church.zip}` : ''}
          </p>
        )}
        {church.phone && <p className="text-sm text-gray-600">{church.phone}</p>}
        {church.ein && (
          <p className="text-sm font-semibold text-gray-700 mt-1">
            Federal Tax ID (EIN): {church.ein}
          </p>
        )}
      </div>

      {/* Date + label */}
      <div className="flex justify-between items-start text-sm">
        <div>
          <p className="font-semibold text-gray-900">{today}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            RE: {year} Charitable Contribution Statement
          </p>
        </div>
        <div className="bg-church-50 border border-church-200 rounded-lg px-3 py-1 text-xs font-semibold text-church-700 print:bg-gray-100 print:border-gray-400">
          TAX YEAR {year}
        </div>
      </div>

      {/* Donor address block */}
      <div className="text-sm mt-2">
        <p className="font-semibold text-gray-900">{fullName}</p>
        {donor.address && <p className="text-gray-600">{donor.address}</p>}
        {donor.email && <p className="text-gray-500 text-xs">{donor.email}</p>}
      </div>

      {/* Salutation */}
      <p className="text-sm text-gray-700 mt-3">
        Dear {donor.first_name || 'Friend'},
      </p>
      <p className="text-sm text-gray-700 leading-relaxed">
        Thank you for your generous support of <strong>{church.name}</strong> during {year}.
        This letter serves as your official written acknowledgment for federal income tax purposes
        as required by the Internal Revenue Service.
      </p>

      {/* Contributions table */}
      <div className="mt-4">
        <p className="text-sm font-semibold text-gray-800 mb-2">
          Contributions made during tax year {year}:
        </p>
        <table className="w-full text-sm border border-gray-300">
          <thead>
            <tr className="bg-gray-100 print:bg-gray-200">
              <th className="text-left px-3 py-2 border-b border-gray-300 font-semibold text-gray-700">Date</th>
              <th className="text-left px-3 py-2 border-b border-gray-300 font-semibold text-gray-700">Fund / Description</th>
              <th className="text-left px-3 py-2 border-b border-gray-300 font-semibold text-gray-700">Method</th>
              <th className="text-right px-3 py-2 border-b border-gray-300 font-semibold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {donor.donations
              .slice()
              .sort((a, b) => new Date(a.donated_at) - new Date(b.donated_at))
              .map((d, i) => (
                <tr key={d.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50 print:bg-gray-50'}>
                  <td className="px-3 py-1.5 border-b border-gray-200 text-gray-700">{fmtDate(d.donated_at)}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200 text-gray-700">{d.fund || 'General'}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200 text-gray-500 capitalize">{d.method || 'cash'}</td>
                  <td className="px-3 py-1.5 border-b border-gray-200 text-right font-medium text-gray-900">${fmt(d.amount)}</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 print:bg-gray-200 font-bold">
              <td className="px-3 py-2 text-gray-900" colSpan={3}>
                Total Contributions — {donor.donations.length} gift{donor.donations.length !== 1 ? 's' : ''}
              </td>
              <td className="px-3 py-2 text-right text-gray-900">${fmt(donor.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* IRS required disclosure */}
      <div className="mt-5 border border-gray-300 rounded-lg p-4 bg-gray-50 print:bg-white text-xs text-gray-700 space-y-2">
        <p className="font-bold text-gray-900 text-sm">Important Tax Information</p>
        <p>
          <strong>No goods or services were provided to you in exchange for these contributions.</strong>{' '}
          Therefore, the full amount of each contribution is deductible to the extent allowed by law
          under Internal Revenue Code Section 170.
        </p>
        <p>
          {church.name} is a tax-exempt organization under Section 501(c)(3) of the Internal Revenue Code.
          {church.ein ? ` Our Federal Employer Identification Number (EIN) is ${church.ein}.` : ''}
        </p>
        <p>
          Please retain this letter as your official record of contribution. You may need this
          document when filing your federal income tax return. For single cash contributions of
          $250 or more, this written acknowledgment is required by the IRS (Publication 1771).
        </p>
        <p className="text-gray-500">
          For questions about your giving record, please contact the church office.
        </p>
      </div>

      {/* Signature block */}
      <div className="mt-6 pt-4">
        <p className="text-sm text-gray-700">With gratitude,</p>
        <div className="mt-8 border-t border-gray-400 w-56 pt-1">
          <p className="text-sm font-semibold text-gray-900">{church.pastor || '_______________________'}</p>
          <p className="text-xs text-gray-600">{church.title}{church.pastor ? ', ' + church.name : ''}</p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════════ */
export default function DonationReports() {
  const [donations, setDonations]     = useState([]);
  const [loading, setLoading]         = useState(false);
  const [year, setYear]               = useState(currentYear);
  const [search, setSearch]           = useState('');
  const [previewDonor, setPreview]    = useState(null);
  const [showChurchInfo, setShowCI]   = useState(false);
  const [church, setChurch]           = useState(() => {
    try { return { ...DEFAULT_CHURCH, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch { return DEFAULT_CHURCH; }
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const from = `${year}-01-01`;
      const to   = `${year}-12-31`;
      const { data } = await api.get('/donations', { params: { from, to, limit: 2000 } });
      setDonations(data.donations || []);
    } catch {
      toast.error('Failed to load donation records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, [year]);

  const saveChurchInfo = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(church));
    toast.success('Church info saved');
    setShowCI(false);
  };

  const donors = groupByDonor(donations).filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.first_name.toLowerCase().includes(q) ||
      d.last_name.toLowerCase().includes(q)  ||
      d.email.toLowerCase().includes(q)
    );
  });

  const grandTotal = donors.reduce((s, d) => s + d.total, 0);

  /* ── Export CSV of donor totals ── */
  const exportCSV = () => {
    const headers = ['Last Name', 'First Name', 'Email', 'Address', 'Tax Year', '# Gifts', 'Total Contributions'];
    const rows = donors.map((d) => [
      d.last_name,
      d.first_name,
      d.email,
      (d.address || '').replace(/,/g, ' '),
      year,
      d.donations.length,
      fmt(d.total),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `avenue-irs-giving-summary-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  /* ── Print ALL statements ── */
  const printAll = () => {
    if (!church.ein) {
      toast('Tip: Add your EIN in Church Info before printing for IRS compliance.', { icon: '⚠️' });
    }
    window.print();
  };

  /* ── Print ONE statement ── */
  const printOne = (donor) => {
    setPreview(donor);
    setTimeout(() => window.print(), 300);
  };

  const field = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-church-500';

  return (
    <>
      {/* ═══ PRINT STYLES (injected into head via style tag) ═══ */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: fixed; top: 0; left: 0; width: 100%; }
          .print-statement { page-break-after: always; padding: 40px; }
          .print-statement:last-child { page-break-after: avoid; }
        }
      `}</style>

      {/* ═══ SCREEN UI ═══ */}
      <div className="space-y-6 print:hidden">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">IRS Donation Reports</h1>
            <p className="text-sm text-gray-500 mt-1">
              Official 501(c)(3) charitable contribution statements — IRS Publication 1771 compliant
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} disabled={donors.length === 0}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40">
              <Download size={14} /> Export CSV
            </button>
            <button onClick={printAll} disabled={donors.length === 0}
              className="flex items-center gap-2 bg-church-700 hover:bg-church-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40">
              <Printer size={14} /> Print All Statements
            </button>
          </div>
        </div>

        {/* IRS notice banner */}
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800">
          <strong>IRS Requirement:</strong> Written acknowledgment is required for single cash contributions of <strong>$250 or more</strong> (IRS Publication 1771).
          Each statement below includes the required "no goods or services" disclosure and your EIN.
          {!church.ein && (
            <span className="ml-1 font-semibold text-amber-900">
              ⚠️ Your EIN is missing — add it in Church Info below.
            </span>
          )}
        </div>

        {/* Church Info panel */}
        <div className="card">
          <button
            onClick={() => setShowCI((v) => !v)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <Settings2 size={16} className="text-church-600" />
              <span className="font-semibold text-gray-900">Church Info & EIN</span>
              {!church.ein && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">EIN required</span>
              )}
              {church.ein && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">EIN: {church.ein}</span>
              )}
            </div>
            {showChurchInfo ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {showChurchInfo && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Church Name</label>
                <input className={field} value={church.name}
                  onChange={(e) => setChurch({ ...church, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Federal EIN *</label>
                <input className={field} placeholder="XX-XXXXXXX" value={church.ein}
                  onChange={(e) => setChurch({ ...church, ein: e.target.value })} />
                <p className="text-xs text-gray-400 mt-0.5">Required on IRS statements</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Street Address</label>
                <input className={field} value={church.address}
                  onChange={(e) => setChurch({ ...church, address: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                <input className={field} value={church.city}
                  onChange={(e) => setChurch({ ...church, city: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
                <input className={field} placeholder="e.g. TX" value={church.state}
                  onChange={(e) => setChurch({ ...church, state: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ZIP Code</label>
                <input className={field} value={church.zip}
                  onChange={(e) => setChurch({ ...church, zip: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                <input className={field} value={church.phone}
                  onChange={(e) => setChurch({ ...church, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Pastor / Authorized Signer</label>
                <input className={field} placeholder="Full name" value={church.pastor}
                  onChange={(e) => setChurch({ ...church, pastor: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                <input className={field} placeholder="Pastor" value={church.title}
                  onChange={(e) => setChurch({ ...church, title: e.target.value })} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                <button onClick={saveChurchInfo}
                  className="bg-church-700 hover:bg-church-800 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
                  Save Church Info
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="card flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tax Year</label>
            <select className="input text-sm font-semibold" value={year}
              onChange={(e) => setYear(Number(e.target.value))}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Search Donor</label>
            <input className="input text-sm w-56" placeholder="Name or email…" value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{donors.length}</span> donors ·{' '}
              <span className="font-semibold text-green-700">${fmt(grandTotal)}</span> total for {year}
            </div>
          </div>
        </div>

        {/* Donor table */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Donor Giving Summary — Tax Year {year}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Click "Preview" to view the IRS statement, or "Print" to print directly</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Donor Name', 'Email', 'Address on File', '# Gifts', 'Total Contributions', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading…</td></tr>
                ) : donors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <p className="text-gray-500 font-medium">No donations found for {year}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Try a different tax year above, or go to{' '}
                        <a href="/donations" className="text-church-700 underline font-medium">Donation Dashboard</a>
                        {' '}to record donations first.
                      </p>
                    </td>
                  </tr>
                ) : donors.map((d) => (
                  <tr key={d.user_id || d.donations[0]?.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {[d.first_name, d.last_name].filter(Boolean).join(' ') || 'Anonymous'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{d.email || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {d.address ? (
                        <span className="text-green-700">✓ On file</span>
                      ) : (
                        <span className="text-amber-600">None — update member profile</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{d.donations.length}</td>
                    <td className="px-4 py-3 font-bold text-green-700">${fmt(d.total)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreview(previewDonor?.user_id === d.user_id ? null : d)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-church-100 text-church-800 hover:bg-church-200 transition-colors"
                        >
                          {previewDonor?.user_id === d.user_id ? 'Hide' : 'Preview'}
                        </button>
                        <button
                          onClick={() => printOne(d)}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          <Printer size={12} /> Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && donors.length > 0 && (
                  <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                    <td className="px-4 py-3 text-gray-900" colSpan={4}>Grand Total — {donors.length} donors</td>
                    <td className="px-4 py-3 text-green-700">${fmt(grandTotal)}</td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inline statement preview */}
        {previewDonor && (
          <div className="card border-2 border-church-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                Statement Preview — {[previewDonor.first_name, previewDonor.last_name].filter(Boolean).join(' ')}
              </h3>
              <div className="flex items-center gap-2">
                <button onClick={() => printOne(previewDonor)}
                  className="flex items-center gap-1.5 text-sm font-semibold bg-church-700 hover:bg-church-800 text-white px-4 py-2 rounded-lg transition-colors">
                  <Printer size={14} /> Print This Statement
                </button>
                <button onClick={() => setPreview(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                  <X size={18} />
                </button>
              </div>
            </div>
            <GivingStatement donor={previewDonor} church={church} year={year} />
          </div>
        )}
      </div>

      {/* ═══ PRINT AREA ═══ */}
      <div id="print-area" style={{ display: 'none' }}>
        {(previewDonor ? [previewDonor] : donors).map((d) => (
          <div key={d.user_id || d.donations[0]?.id} className="print-statement">
            <GivingStatement donor={d} church={church} year={year} isPrint />
          </div>
        ))}
      </div>
    </>
  );
}
