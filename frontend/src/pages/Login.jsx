import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { HiOutlineChevronLeft, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import useAuthStore from '../store/useAuthStore';
import useAppStore from '../store/useAppStore';
import api from '../services/api';
import { setOneSignalExternalUserId } from '../utils/onesignal';

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storeLogo, setStoreLogo] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [policyPopup, setPolicyPopup] = useState(null);
  const [policyContent, setPolicyContent] = useState('');

  useEffect(() => {
    api.getPublicSettings().then(res => {
      const s = res.settings || {};
      if (s.store_logo) setStoreLogo(s.store_logo);
      if (s.kitchen_name) setStoreName(s.kitchen_name);
      window.__appSettings = s;
    }).catch(() => {});
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (phone.length < 10 || password.length < 6) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.login(phone, password);
      if (res.requires_verification) {
        navigate('/register', { state: { phone, step: 2 } });
        return;
      }
      login(res.user, res.token);
      setOneSignalExternalUserId(res.user.id);
      navigate('/');
    } catch (err) {
      if (err.status === 403 && err.message?.includes('not verified')) {
        navigate('/register', { state: { phone, step: 2 } });
        return;
      }
      setError(err.message || 'Invalid phone number or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden max-w-lg mx-auto">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-br from-primary via-primary-dark to-primary rounded-b-[60px] opacity-95" />
      <div className="absolute top-10 right-[-30px] w-40 h-40 bg-white/10 rounded-full" />
      <div className="absolute top-32 left-[-20px] w-24 h-24 bg-white/10 rounded-full" />

      {/* Back Button */}
      <div className="relative z-10 px-4 pt-5">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform"
          aria-label="Go back"
        >
          <HiOutlineChevronLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Header Content */}
      <div className="relative z-10 text-center px-6 pt-6 pb-16">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden border-2 border-white/50">
          {storeLogo ? (
            <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${storeLogo}`} alt="" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-3xl font-bold text-primary">{(storeName || t('app_name')).charAt(0)}</span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white">{storeName || t('app_name')}</h1>
        <p className="text-sm text-white/80 mt-1">Delicious food, delivered fast</p>
      </div>

      {/* Form Card */}
      <div className="relative z-10 mx-4 -mt-4">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">{t('login')}</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in with your phone number</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
                {t('phone')}
              </label>
              <div className="flex items-center border-2 border-gray-100 rounded-2xl px-4 py-3.5 focus-within:border-primary transition-colors bg-gray-50/50">
                <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
                  <span className="text-lg">🇳🇵</span>
                  <span className="text-sm font-semibold text-gray-700">+977</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98XXXXXXXX"
                  className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 ml-3 bg-transparent font-medium"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
                Password
              </label>
              <div className="flex items-center border-2 border-gray-100 rounded-2xl px-4 py-3.5 focus-within:border-primary transition-colors bg-gray-50/50">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent font-medium"
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

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-primary font-semibold">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={phone.length < 10 || password.length < 6 || loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all shadow-lg shadow-primary/30"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                t('login')
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold">{t('signup')}</Link>
          </p>
        </div>
      </div>

      <div className="relative z-10 text-center mt-8 pb-8 px-6">
        <p className="text-xs text-gray-400">
          By continuing, you agree to our{' '}
          <button onClick={() => { setPolicyPopup('Terms of Service'); setPolicyContent(window.__appSettings?.terms_conditions || 'Terms not configured yet.'); }} className="text-primary font-medium">Terms of Service</button>
          {' '}and{' '}
          <button onClick={() => { setPolicyPopup('Privacy Policy'); setPolicyContent(window.__appSettings?.privacy_policy || 'Privacy policy not configured yet.'); }} className="text-primary font-medium">Privacy Policy</button>
        </p>
      </div>

      {/* Policy Popup */}
      {policyPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPolicyPopup(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-gray-800">{policyPopup}</h3>
              <button onClick={() => setPolicyPopup(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-gray-600 leading-relaxed prose prose-sm" dangerouslySetInnerHTML={{ __html: policyContent }} />
            <div className="px-5 py-3 border-t border-gray-100 shrink-0">
              <button onClick={() => setPolicyPopup(null)} className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-primary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
