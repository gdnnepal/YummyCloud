import { useState, useEffect } from 'react';
import api from '../services/api';

function Messages() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ user_id: '', title: '', body: '', type: 'info' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    api.getUsers()
      .then((res) => setUsers(res.users || []))
      .catch(console.error);
  }, []);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.user_id) { alert('Please select a customer'); return; }
    setSending(true);
    try {
      await api.sendMessage(form);
      setSent(true);
      setForm({ user_id: '', title: '', body: '', type: 'info' });
      setSearch('');
      setTimeout(() => setSent(false), 3000);
    } catch (err) { alert(err.message); }
    finally { setSending(false); }
  };

  const selectUser = (userId) => {
    setForm({ ...form, user_id: String(userId) });
    setSearch('');
    setShowDropdown(false);
  };

  const selectedUser = form.user_id === 'all'
    ? { name: 'All Customers' }
    : users.find((u) => String(u.id) === form.user_id);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">Send Message</h1>
      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-lg">
        {sent && <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4 text-sm text-green-700">Message sent successfully!</div>}
        <form onSubmit={handleSend} className="space-y-4">
          {/* Customer Selection */}
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Send To</label>
            {selectedUser ? (
              <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5">
                <span className="text-sm font-medium text-gray-800">
                  {selectedUser.name} {selectedUser.phone ? `(${selectedUser.phone})` : ''}
                </span>
                <button type="button" onClick={() => setForm({ ...form, user_id: '' })} className="text-xs text-primary font-medium">Change</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="Search by name or phone..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                {/* Dropdown */}
                {showDropdown && (
                <div className="absolute left-0 right-0 top-full border border-gray-200 rounded-lg mt-1 max-h-40 overflow-y-auto bg-white shadow-lg z-10">
                  <button
                    type="button"
                    onClick={() => selectUser('all')}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-primary/5 font-medium text-primary border-b border-gray-100"
                  >
                    📢 All Customers
                  </button>
                  {filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selectUser(u.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span>{u.name}</span>
                      <span className="text-xs text-gray-400">{u.phone}</span>
                    </button>
                  ))}
                  {filteredUsers.length === 0 && search && (
                    <p className="px-3 py-2 text-xs text-gray-400">No customers found</p>
                  )}
                </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <option value="info">Info</option>
              <option value="coupon">Coupon</option>
              <option value="apology">Apology</option>
              <option value="promotion">Promotion</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Message title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Body</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Message content..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-24 resize-none" required />
          </div>
          <button type="submit" disabled={sending || !form.user_id} className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Messages;
