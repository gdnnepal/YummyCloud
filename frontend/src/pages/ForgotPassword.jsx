import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { HiOutlineChevronLeft, HiOutlineShieldCheck } from 'react-icons/hi2';
import api from '../services/api';

function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setLoading(true);
    setError('');
    try {
      await api.sendOtp(phone);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (otp.length < 6 || password.length < 6 || password !== confirmPassword) return;
    setLoading(true);
    setError('');
    try {
      await api.resetPassword(phone, otp, password);
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white max-w-lg mx-auto">
      <div className="px-4 pt-5 pb-4">
        <button
          onClick={() => (step > 1 ? setStep(1) : navigate(-1))}
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center active:scale-90 transition-transform"
        >
          <HiOutlineChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      <div className="px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            {step === 1
              ? 'Enter your phone number to receive a verification code'
              : `Enter the OTP sent to +977 ${phone} and set new password`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Step 1: Phone */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-5">
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
                  autoFocus
                />
              </div>
            </div>
            <button type="submit" disabled={phone.length < 10 || loading} className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all shadow-lg shadow-primary/30">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP + New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-center mb-2">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <HiOutlineShieldCheck className="w-7 h-7 text-primary" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-center text-sm tracking-[0.2em] outline-none focus:border-primary transition-colors bg-gray-50/50 font-bold"
                maxLength={6}
                inputMode="numeric"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-colors bg-gray-50/50 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm outline-none focus:border-primary transition-colors bg-gray-50/50 font-medium"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1 ml-1">Passwords don't match</p>
              )}
            </div>
            <p className="text-center text-xs text-gray-500">
              Didn't receive code?{' '}
              <button type="button" onClick={handleSendOtp} className="text-primary font-semibold">Resend</button>
            </p>
            <button type="submit" disabled={otp.length < 6 || password.length < 6 || password !== confirmPassword || loading} className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all shadow-lg shadow-primary/30">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-primary font-semibold">{t('login')}</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
