import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AUDIENCES = [
  { value: 'all',     label: 'All Members' },
  { value: 'members', label: 'Members Only' },
  { value: 'staff',   label: 'Staff & Leadership' },
];

export default function CommsHub() {
  const [tab, setTab]         = useState('email');
  const [sending, setSending] = useState(false);

  const [emailForm, setEmailForm] = useState({ subject: '', body: '', audience: 'all' });
  const [smsForm, setSmsForm]     = useState({ message: '', audience: 'all' });

  const sendEmail = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await api.post('/communications/email', emailForm);
      toast.success(data.message);
      setEmailForm({ subject: '', body: '', audience: 'all' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const sendSms = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await api.post('/communications/sms', smsForm);
      toast.success(data.message);
      setSmsForm({ message: '', audience: 'all' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Communications Hub</h1>
        <p className="text-sm text-gray-500 mt-1">Send segmented email and SMS broadcasts to the congregation</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['email', 'sms'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-church-500 text-church-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'email' ? '✉ Email Broadcast' : '📱 SMS Broadcast'}
          </button>
        ))}
      </div>

      {tab === 'email' && (
        <form onSubmit={sendEmail} className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Send Email Broadcast</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <select className="input" value={emailForm.audience}
              onChange={(e) => setEmailForm({ ...emailForm, audience: e.target.value })}>
              {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input required className="input" placeholder="Sunday Service Reminder"
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
            <textarea required rows={6} className="input"
              placeholder="Dear friends and members..."
              value={emailForm.body}
              onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })} />
            <p className="text-xs text-gray-400 mt-1">
              The recipient's first name and church signature will be added automatically.
            </p>
          </div>
          <button type="submit" disabled={sending} className="btn-primary w-full">
            {sending ? 'Sending…' : 'Send Email Broadcast'}
          </button>
        </form>
      )}

      {tab === 'sms' && (
        <form onSubmit={sendSms} className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Send SMS Broadcast</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <select className="input" value={smsForm.audience}
              onChange={(e) => setSmsForm({ ...smsForm, audience: e.target.value })}>
              {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea required rows={4} className="input" maxLength={160}
              placeholder="Avenue PBC: Join us this Sunday at 11am..."
              value={smsForm.message}
              onChange={(e) => setSmsForm({ ...smsForm, message: e.target.value })} />
            <p className="text-xs text-gray-400 mt-1">{smsForm.message.length}/160 characters</p>
          </div>
          <button type="submit" disabled={sending} className="btn-primary w-full">
            {sending ? 'Sending…' : 'Send SMS Broadcast'}
          </button>
        </form>
      )}
    </div>
  );
}
