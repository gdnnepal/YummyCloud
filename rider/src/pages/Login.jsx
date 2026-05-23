import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineTruck } from 'react-icons/hi2';
import api from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.login(phone, password);
      if (res.user.role !== 'delivery_partner') { setError('Access denied. Delivery partners only.'); return; }
      localStorage.setItem('rider-auth', JSON.stringify({ user: res.user, token: res.token }));
      navigate('/');
    } catch (err) { setError(err.message || 'Login failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <HiOutlineTruck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Rider App</h1>
          <p className="text-sm text-white/70 mt-1">CloudKitchen Delivery</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-xs text-red-600">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="98XXXXXXXX" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <button type="submit" disabled={loading || phone.length < 10} className="w-full bg-primary text-white py-3 rounded-lg text-sm font-semibold disabled:opacity-40">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
