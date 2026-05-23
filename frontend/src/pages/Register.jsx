import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { HiOutlineChevronLeft, HiOutlineEye, HiOutlineEyeSlash, HiOutlineShieldCheck } from 'react-icons/hi2';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import { setOneSignalExternalUserId } from '../utils/onesignal';

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isFormValid =
    name.trim().length >= 2 &&
    phone.length === 10 &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setLoading(true);
    setError('');

    try {
      await api.register(name, phone, password);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.verifyOtp(phone, otp);
      if (res.token) {
        login(res.user, res.token);
        setOneSignalExternalUserId(res.user.id);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await api.sendOtp(phone);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden max-w-lg mx-auto">
      <div className="absolute top-0 left-0 right-0 h-60 bg-gradient-to-br from-primary via-primary-dark to-primary rounded-b-[60px] opacity-95" />
      <div className="absolute top-10 right-[-30px] w-40 h-40 bg-white/10 rounded-full" />
      <div className="absolute top-28 left-[-20px] w-24 h-24 bg-white/10 rounded-full" />

      <div className="relative z-10 px-4 pt-5">
        <button
          onClick={() => (step === 2 ? setStep(1) : navigate(-1))}
          className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform"
        >
          <HiOutlineChevronLeft className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="relative z-10 text-center px-6 pt-4 pb-12">
        <h1 className="text-2xl font-bold text-white">
          {step === 1 ? 'Create Account' : 'Verify Phone'}
        </h1>
        <p className="text-sm text-white/80 mt-1">
          {step === 1 ? 'Sign up to start ordering' : `Enter the code sent to +977 ${phone}`}
        </p>
      </div>

      <div className="relative z-10 mx-4 -mt-4">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-colors bg-gray-50/50 font-medium text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">{t('phone')}</label>
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
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Password</label>
                <div className="flex items-center border-2 border-gray-100 rounded-2xl px-4 py-3.5 focus-within:border-primary transition-colors bg-gray-50/50">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent font-medium"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="ml-2 text-gray-400">
                    {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-colors bg-gray-50/50 font-medium text-gray-800 placeholder-gray-400"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 ml-1">Passwords don't match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isFormValid || loading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all shadow-lg shadow-primary/30 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  'Continue'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <HiOutlineShieldCheck className="w-7 h-7 text-primary" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block text-center">
                  Enter 6-digit OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full border-2 border-gray-100 rounded-2xl px-4 py-4 text-center text-xl tracking-[0.5em] font-mono outline-none focus:border-primary transition-colors bg-gray-50/50 font-bold"
                  maxLength={6}
                  autoFocus
                  inputMode="numeric"
                />
              </div>

              <p className="text-center text-xs text-gray-500">
                Didn't receive code?{' '}
                <button type="button" onClick={handleResendOtp} className="text-primary font-semibold">Resend</button>
              </p>

              <button
                type="submit"
                disabled={otp.length < 6 || loading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all shadow-lg shadow-primary/30"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  t('verify')
                )}
              </button>
            </form>
          )}

          {step === 1 && (
            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold">{t('login')}</Link>
            </p>
          )}
        </div>
      </div>

      <div className="relative z-10 text-center mt-6 pb-8 px-6">
        <p className="text-xs text-gray-400">
          By signing up, you agree to our{' '}
          <span className="text-primary font-medium">Terms of Service</span>
          {' '}and{' '}
          <span className="text-primary font-medium">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}

export default Register;
