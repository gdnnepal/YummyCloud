import { useState } from 'react';
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import TopNav from '../components/TopNav';
import api from '../services/api';

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      await api.changePassword(currentPassword, newPassword);
      setMessage('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="pb-4">
      <TopNav title="Change Password" showBack={true} />
      <div className="px-4 pt-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 max-w-md mx-auto">
          {message && <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-green-700">{message}</div>}
          {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-red-600">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Current Password</label>
              <div className="flex items-center border-2 border-gray-100 rounded-xl px-4 py-3 focus-within:border-primary transition-colors">
                <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="flex-1 outline-none text-sm bg-transparent" required />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="text-gray-400">
                  {showCurrent ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">New Password</label>
              <div className="flex items-center border-2 border-gray-100 rounded-xl px-4 py-3 focus-within:border-primary transition-colors">
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="flex-1 outline-none text-sm bg-transparent" required />
                <button type="button" onClick={() => setShowNew(!showNew)} className="text-gray-400">
                  {showNew ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors" required />
              {confirmPassword && newPassword !== confirmPassword && <p className="text-xs text-red-500 mt-1">Passwords don't match</p>}
            </div>
            <button type="submit" disabled={loading || !currentPassword || !newPassword || newPassword !== confirmPassword} className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40">
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;
