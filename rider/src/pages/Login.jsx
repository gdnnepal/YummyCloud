import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineTruck, HiOutlineEye, HiOutlineEyeSlash, HiOutlinePhone, HiOutlineLockClosed } from 'react-icons/hi2';
import api from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [kitchenName, setKitchenName] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '')}/api/settings/public`)
      .then(r => r.json())
      .then(res => {
        if (res.settings?.kitchen_name) {
          setKitchenName(res.settings.kitchen_name);
          document.title = `Rider - ${res.settings.kitchen_name}`;
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.login(phone, password);
      if (res.user.role !== 'delivery_partner') {
        setError('Access denied. Delivery partners only.');
        return;
      }
      localStorage.setItem('rider-auth', JSON.stringify({ user: res.user, token: res.token }));
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      {/* Logo / Branding */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <HiOutlineTruck className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{kitchenName || 'Rider'}</h1>
        <p className="text-sm text-gray-500 mt-1">Delivery Partner Login</p>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-xs text-red-600">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Phone Number</label>
            <div className="relative">
              <HiOutlinePhone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="98XXXXXXXX"
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder-gray-400"
                maxLength={10}
                autoComplete="tel"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Password</label>
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full border border-gray-200 rounded-xl pl-11 pr-11 py-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder-gray-400"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <HiOutlineEyeSlash className="w-4.5 h-4.5" /> : <HiOutlineEye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || phone.length < 10 || password.length < 6}
            className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-primary-dark active:scale-[0.98] transition-all mt-2"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-400 mt-8">
          {kitchenName || 'CloudKitchen'} &middot; Rider App
        </p>
      </div>
    </div>
  );
}

export default Login;
