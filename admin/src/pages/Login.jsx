import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.login(phone, password);
      if (res.user.role !== 'admin') {
        setError('Access denied. Admin only.');
        return;
      }
      localStorage.setItem('admin-auth', JSON.stringify({ user: res.user, token: res.token }));
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">🍽️</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-3">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">CloudKitchen Management</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-xs text-red-600">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9800000000" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <button type="submit" disabled={loading || phone.length < 10 || password.length < 6} className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
