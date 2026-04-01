import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.first_name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-900 to-church-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="The Avenue Logo"
            className="w-24 h-24 object-contain mx-auto mb-4"
            onError={(e) => {
              e.target.style.display = 'none';
              document.getElementById('logo-fallback').style.display = 'flex';
            }}
          />
          <div id="logo-fallback" className="w-20 h-20 bg-church-500 rounded-2xl items-center justify-center mx-auto mb-4 hidden">
            <span className="text-white text-3xl font-bold">A</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">The Avenue</h1>
          <p className="text-gray-500 text-sm mt-1">Member Portal Sign In</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="input"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <Link to="/forgot-password" className="text-sm text-church-500 hover:underline block">
            Forgot password?
          </Link>
          <p className="text-sm text-gray-500">
            New member?{' '}
            <Link to="/signup" className="text-church-500 hover:underline font-medium">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
