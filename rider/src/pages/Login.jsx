import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineTruck, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top Section - Branding */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary-dark pt-12 pb-16 px-6 text-center relative overflow-hidden">
        <div className="absolute top-[-30px] right-[-30px] w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute top-[50%] right-[10%] w-20 h-20 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="w-18 h-18 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 w-[72px] h-[72px]">
            <HiOutlineTruck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{kitchenName || 'Delivery'}</h1>
          <p className="text-sm text-white/60 mt-1.5">Rider Partner Login</p>
        </div>
      </div>

      {/* Form Card - overlapping */}
      <div className="flex-1 px-5 -mt-6">
        <div className="bg-white rounded-3xl shadow-lg shadow-black/5 p-6 border border-gray-100">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-xs text-red-600">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Phone Number</label>
              <div className="flex items-center border-2 border-gray-100 rounded-xl px-4 py-3 focus-within:border-primary transition-colors bg-gray-50/50">
                <div className="flex items-center pr-3 border-r border-gray-200">
                  <span className="text-xs font-bold text-gray-600">+977</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98XXXXXXXX"
                  className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 ml-3 bg-transparent font-medium"
                  maxLength={10}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Password</label>
              <div className="flex items-center border-2 border-gray-100 rounded-xl px-4 py-3 focus-within:border-primary transition-colors bg-gray-50/50">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent font-medium"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 text-gray-400 active:scale-90 transition-transform"
                >
                  {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length < 10 || password.length < 6}
              className="w-full bg-primary text-white py-3.5 rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-[0.98] transition-all shadow-md shadow-primary/30"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6">
          {kitchenName || 'CloudKitchen'} Rider App
        </p>
      </div>
    </div>
  );
}

export default Login;
