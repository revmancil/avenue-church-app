import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AMOUNTS = [25, 50, 100, 250, 500];
const FUNDS   = ['General', 'Building Fund', 'Missions', 'Youth Ministry', 'Benevolence'];

// ── Stripe checkout form ─────────────────────────────────────────────────────
function StripeForm({ settings }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [amount, setAmount]         = useState('');
  const [custom, setCustom]         = useState('');
  const [fund, setFund]             = useState('General');
  const [name, setName]             = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess]       = useState(false);

  const finalAmount = custom ? parseFloat(custom) : parseFloat(amount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (!finalAmount || finalAmount < 1) return toast.error('Please enter a valid amount');

    setProcessing(true);
    try {
      const { data } = await api.post('/donations/stripe/create-intent', {
        amount: finalAmount,
        fund,
        donor_name: name,
      });

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name },
        },
      });

      if (result.error) {
        toast.error(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        setSuccess(true);
        toast.success('Thank you for your generous gift!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl">✓</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900">Gift Received!</h3>
        <p className="text-gray-500">
          Thank you for your <strong>${finalAmount.toFixed(2)}</strong> gift to the <strong>{fund}</strong> fund.
          Your generosity makes a difference.
        </p>
        <button onClick={() => { setSuccess(false); setAmount(''); setCustom(''); }}
          className="btn-secondary">Give Again</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Preset amounts */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Amount</label>
        <div className="grid grid-cols-5 gap-2">
          {AMOUNTS.map((a) => (
            <button key={a} type="button"
              onClick={() => { setAmount(String(a)); setCustom(''); }}
              className={`py-2 rounded-lg border text-sm font-semibold transition-colors ${
                amount === String(a) && !custom
                  ? 'bg-church-500 text-white border-church-500'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-church-400'
              }`}>
              ${a}
            </button>
          ))}
        </div>
        <div className="mt-2 relative">
          <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
          <input
            type="number" min="1" step="0.01"
            className="input pl-6"
            placeholder="Other amount"
            value={custom}
            onChange={(e) => { setCustom(e.target.value); setAmount(''); }}
          />
        </div>
      </div>

      {/* Fund */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fund</label>
        <select className="input" value={fund} onChange={(e) => setFund(e.target.value)}>
          {FUNDS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Full name" />
      </div>

      {/* Card element */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Card Details</label>
        <div className="input py-3">
          <CardElement options={{
            style: { base: { fontSize: '14px', color: '#374151' } }
          }} />
        </div>
      </div>

      <button type="submit" disabled={processing || !stripe} className="btn-primary w-full py-3">
        {processing ? 'Processing…' : `Give ${finalAmount ? `$${parseFloat(finalAmount).toFixed(2)}` : ''}`}
      </button>

      <p className="text-xs text-center text-gray-400">
        🔒 Secured by Stripe · Avenue Progressive Baptist Church
      </p>
    </form>
  );
}

// ── Main Donate Page ─────────────────────────────────────────────────────────
export default function DonatePage() {
  const [settings, setSettings]     = useState(null);
  const [stripePromise, setStripe]  = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    api.get('/settings/donation')
      .then(({ data }) => {
        setSettings(data);
        if (data.donation_provider === 'stripe' && data.stripe_publishable_key) {
          setStripe(loadStripe(data.stripe_publishable_key));
        }
      })
      .catch(() => toast.error('Failed to load donation settings'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-church-500" /></div>;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {settings?.donation_title || 'Give to The Avenue'}
        </h1>
        {settings?.donation_description && (
          <p className="text-gray-500 text-sm mt-1">{settings.donation_description}</p>
        )}
      </div>

      {/* Disabled */}
      {(!settings || settings.donation_provider === 'disabled') && (
        <div className="card text-center py-10 space-y-3">
          <p className="text-4xl">🙏</p>
          <h3 className="font-semibold text-gray-700">Online giving coming soon</h3>
          <p className="text-sm text-gray-400">
            Please see an usher or contact the church office to give.
          </p>
        </div>
      )}

      {/* Zeffy */}
      {settings?.donation_provider === 'zeffy' && settings.zeffy_form_url && (
        <div className="card p-0 overflow-hidden rounded-xl">
          <iframe
            src={settings.zeffy_form_url}
            title="Give to Avenue PBC via Zeffy"
            className="w-full min-h-[600px] border-0"
            allow="payment"
          />
          <p className="text-xs text-center text-gray-400 py-2">
            Powered by Zeffy · 100% free for nonprofits
          </p>
        </div>
      )}

      {/* Stripe */}
      {settings?.donation_provider === 'stripe' && stripePromise && (
        <div className="card">
          <Elements stripe={stripePromise}>
            <StripeForm settings={settings} />
          </Elements>
        </div>
      )}

      {settings?.donation_provider === 'stripe' && !settings?.stripe_publishable_key && (
        <div className="card text-center py-6">
          <p className="text-gray-500 text-sm">Stripe is not fully configured yet. Please check Admin Settings.</p>
        </div>
      )}
    </div>
  );
}
