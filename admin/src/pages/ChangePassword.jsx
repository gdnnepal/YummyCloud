import { useState } from 'react';
import api from '../services/api';

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      await api.request('/profile/password', { method: 'PUT', body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) });
      setMessage('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) { setError(err.message || 'Failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">Change Password</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-md">
        {message && <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4 text-sm text-green-700">{message}</div>}
        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary" required />
          </div>
          <button type="submit" disabled={loading || !currentPassword || !newPassword || newPassword !== confirmPassword} className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-40">
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
