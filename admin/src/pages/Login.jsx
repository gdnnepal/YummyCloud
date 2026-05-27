import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineClipboardDocumentList, HiOutlineChartBar, HiOutlineUsers } from 'react-icons/hi2';
import api from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [kitchenName, setKitchenName] = useState('CloudKitchen');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '')}/api/settings/public`)
      .then(r => r.json())
      .then(res => { if (res.settings?.kitchen_name) setKitchenName(res.settings.kitchen_name); })
      .catch(() => {});
  }, []);

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
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/70 relative overflow-hidden items-center justify-center">
        {/* Decorative circles */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute bottom-[-15%] left-[-10%] w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-[40%] left-[10%] w-40 h-40 rounded-full bg-white/5" />

        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl font-bold text-white">{kitchenName.charAt(0)}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">{kitchenName}</h1>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs mx-auto">
            Manage orders, menu, customers, and everything from one powerful dashboard.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-xs mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <HiOutlineClipboardDocumentList className="w-6 h-6 text-white mx-auto" />
              <p className="text-[10px] text-white/60 mt-1">Orders</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <HiOutlineChartBar className="w-6 h-6 text-white mx-auto" />
              <p className="text-[10px] text-white/60 mt-1">Analytics</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <HiOutlineUsers className="w-6 h-6 text-white mx-auto" />
              <p className="text-[10px] text-white/60 mt-1">Customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm">
          {/* Mobile branding */}
          <div className="text-center mb-8 lg:mb-10">
            <div className="lg:hidden w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">{kitchenName.charAt(0)}</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Welcome back</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to {kitchenName} Admin</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-5">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-xs text-red-600">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9800000000"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Password</label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10 || password.length < 6}
                className="w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
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
            {kitchenName} Admin Panel &bull; Secure Login
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
