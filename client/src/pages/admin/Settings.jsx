import { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PROVIDERS = [
  {
    id: 'disabled',
    label: 'Disabled',
    description: 'Online giving turned off. Members see a "coming soon" message.',
    icon: '🚫',
  },
  {
    id: 'zeffy',
    label: 'Zeffy',
    description: '100% free for nonprofits. Zeffy covers all processing fees. Recommended for churches.',
    icon: '💚',
    badge: 'Free — No Fees',
  },
  {
    id: 'stripe',
    label: 'Stripe',
    description: 'Full card processing built into the app. Standard rate: 2.9% + 30¢ per transaction.',
    icon: '💳',
    badge: '2.9% + 30¢',
  },
];

export default function Settings() {
  const [form, setForm]     = useState({
    donation_provider:      'disabled',
    zeffy_form_url:         '',
    stripe_publishable_key: '',
    stripe_secret_key:      '',
    donation_title:         'Give to Avenue Progressive Baptist Church',
    donation_description:   'Your generosity supports our ministries and community outreach.',
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    api.get('/settings/donation')
      .then(({ data }) => setForm((prev) => ({ ...prev, ...data })))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/settings/donation', form);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card text-gray-400 text-center py-10">Loading…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Donation Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure how members give online</p>
      </div>

      <form onSubmit={save} className="space-y-6">

        {/* Provider selector */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Payment Provider</h3>
          <div className="space-y-3">
            {PROVIDERS.map((p) => (
              <label key={p.id} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                form.donation_provider === p.id
                  ? 'border-church-500 bg-church-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="radio" name="provider" value={p.id}
                  checked={form.donation_provider === p.id}
                  onChange={() => setForm({ ...form, donation_provider: p.id })}
                  className="mt-1 accent-church-500" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span>{p.icon}</span>
                    <span className="font-medium text-gray-900">{p.label}</span>
                    {p.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.id === 'zeffy' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>{p.badge}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{p.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Zeffy settings */}
        {form.donation_provider === 'zeffy' && (
          <div className="card space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">Zeffy Setup</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Create a free form at <a href="https://www.zeffy.com" target="_blank" rel="noreferrer"
                  className="text-church-500 underline">zeffy.com</a>, then paste the embed URL below.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zeffy Form URL *</label>
              <input className="input" placeholder="https://www.zeffy.com/en-US/embed/..."
                value={form.zeffy_form_url}
                onChange={(e) => setForm({ ...form, zeffy_form_url: e.target.value })} />
              <p className="text-xs text-gray-400 mt-1">
                In Zeffy → your form → Share → Embed → copy the iframe src URL
              </p>
            </div>
          </div>
        )}

        {/* Stripe settings */}
        {form.donation_provider === 'stripe' && (
          <div className="card space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">Stripe Setup</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Get your keys at <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer"
                  className="text-church-500 underline">dashboard.stripe.com/apikeys</a>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
              <input className="input font-mono text-xs" placeholder="pk_live_..."
                value={form.stripe_publishable_key}
                onChange={(e) => setForm({ ...form, stripe_publishable_key: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
              <input type="password" className="input font-mono text-xs" placeholder="sk_live_... (leave blank to keep current)"
                value={form.stripe_secret_key}
                onChange={(e) => setForm({ ...form, stripe_secret_key: e.target.value })} />
              <p className="text-xs text-gray-400 mt-1">Never shared with members. Stored securely on the server.</p>
            </div>
          </div>
        )}

        {/* Donation page copy */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Donation Page Text</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
            <input className="input" value={form.donation_title}
              onChange={(e) => setForm({ ...form, donation_title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} className="input" value={form.donation_description}
              onChange={(e) => setForm({ ...form, donation_description: e.target.value })} />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary px-8">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
