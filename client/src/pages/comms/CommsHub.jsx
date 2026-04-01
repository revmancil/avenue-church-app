import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AUDIENCES = [
  { value: 'all',     label: 'All Members' },
  { value: 'members', label: 'Members Only' },
  { value: 'staff',   label: 'Staff & Leadership' },
];

const CHANNEL_TABS = [
  { id: 'email', label: '✉ Email',         description: 'Delivered via SendGrid' },
  { id: 'sms',   label: '📱 SMS',           description: 'Delivered via Twilio' },
  { id: 'push',  label: '🔔 Push',          description: 'In-app notification (Firebase)' },
];

export default function CommsHub() {
  const [tab, setTab]         = useState('email');
  const [sending, setSending] = useState(false);

  const [emailForm, setEmailForm] = useState({ subject: '', body: '', audience: 'all' });
  const [smsForm, setSmsForm]     = useState({ message: '', audience: 'all' });
  const [pushForm, setPushForm]   = useState({ title: '', body: '', audience: 'all' });

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

  const sendPush = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const { data } = await api.post('/communications/push', pushForm);
      toast.success(data.message);
      setPushForm({ title: '', body: '', audience: 'all' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send push notification');
    } finally {
      setSending(false);
    }
  };

  const currentChannel = CHANNEL_TABS.find((c) => c.id === tab);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Communications Hub</h1>
        <p className="text-sm text-gray-500 mt-1">Send segmented broadcasts to the congregation</p>
      </div>

      {/* Channel toggle */}
      <div className="grid grid-cols-3 gap-3">
        {CHANNEL_TABS.map((c) => (
          <button
            key={c.id}
            onClick={() => setTab(c.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              tab === c.id
                ? 'border-church-500 bg-church-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className={`text-sm font-semibold ${tab === c.id ? 'text-church-700' : 'text-gray-700'}`}>
              {c.label}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>
            {c.id === 'push' && (
              <span className="mt-1 inline-block text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                Setup needed
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Email form */}
      {tab === 'email' && (
        <form onSubmit={sendEmail} className="card space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">Email Broadcast</h3>
            <p className="text-xs text-gray-400 mt-0.5">Delivered via SendGrid from info@avenuepbc.org</p>
          </div>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea required rows={6} className="input"
              placeholder="Dear friends and members..."
              value={emailForm.body}
              onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })} />
            <p className="text-xs text-gray-400 mt-1">Recipient's name and church signature added automatically.</p>
          </div>
          <button type="submit" disabled={sending} className="btn-primary w-full">
            {sending ? 'Sending…' : 'Send Email Broadcast'}
          </button>
        </form>
      )}

      {/* SMS form */}
      {tab === 'sms' && (
        <form onSubmit={sendSms} className="card space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">SMS Broadcast</h3>
            <p className="text-xs text-gray-400 mt-0.5">Delivered via Twilio to members with a phone number on file</p>
          </div>
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

      {/* Push notification form */}
      {tab === 'push' && (
        <form onSubmit={sendPush} className="card space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">Push Notification</h3>
            <p className="text-xs text-gray-400 mt-0.5">Requires Firebase or OneSignal integration to deliver</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ⚠ Push notifications require Firebase Admin SDK setup. The notification will be queued but not delivered until configured.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <select className="input" value={pushForm.audience}
              onChange={(e) => setPushForm({ ...pushForm, audience: e.target.value })}>
              {AUDIENCES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input required className="input" placeholder="Avenue PBC Announcement"
              value={pushForm.title}
              onChange={(e) => setPushForm({ ...pushForm, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea required rows={3} className="input" maxLength={200}
              placeholder="Join us this Sunday..."
              value={pushForm.body}
              onChange={(e) => setPushForm({ ...pushForm, body: e.target.value })} />
            <p className="text-xs text-gray-400 mt-1">{pushForm.body.length}/200 characters</p>
          </div>
          <button type="submit" disabled={sending} className="btn-primary w-full">
            {sending ? 'Queuing…' : 'Send Push Notification'}
          </button>
        </form>
      )}
    </div>
  );
}
