import { useState, useEffect } from 'react';
import { HiOutlinePaperAirplane, HiOutlineUsers, HiOutlineUser, HiOutlineCheckCircle } from 'react-icons/hi2';
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

  const typeOptions = [
    { value: 'info', label: 'Info', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'promotion', label: 'Promotion', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { value: 'coupon', label: 'Coupon', color: 'bg-green-50 text-green-700 border-green-200' },
    { value: 'apology', label: 'Apology', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { value: 'system', label: 'System', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Messages</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Message Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Send Notification</h2>
              <p className="text-xs text-gray-400 mt-0.5">Send push notification & in-app message to customers</p>
            </div>

            <div className="p-6">
              {sent && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-5">
                  <HiOutlineCheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                  <span className="text-sm text-green-700 font-medium">Message sent successfully!</span>
                </div>
              )}

              <form onSubmit={handleSend} className="space-y-5">
                {/* Recipient */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Recipient</label>
                  {selectedUser ? (
                    <div className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50">
                      <div className="flex items-center gap-2">
                        {form.user_id === 'all' ? (
                          <HiOutlineUsers className="w-4 h-4 text-primary" />
                        ) : (
                          <HiOutlineUser className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm font-medium text-gray-800">
                          {selectedUser.name} {selectedUser.phone ? `(${selectedUser.phone})` : ''}
                        </span>
                      </div>
                      <button type="button" onClick={() => setForm({ ...form, user_id: '' })} className="text-xs text-primary font-medium hover:underline">Change</button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                          type="text"
                          value={search}
                          onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                          onFocus={() => setShowDropdown(true)}
                          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                          placeholder="Search by name or phone..."
                          className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
                        />
                      </div>
                      {showDropdown && (
                        <div className="absolute left-0 right-0 top-full border border-gray-200 rounded-lg mt-1 max-h-48 overflow-y-auto bg-white shadow-lg z-10">
                          <button
                            type="button"
                            onMouseDown={() => selectUser('all')}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 font-medium text-primary border-b border-gray-100 flex items-center gap-2"
                          >
                            <HiOutlineUsers className="w-4 h-4" />
                            All Customers ({users.length})
                          </button>
                          {filteredUsers.slice(0, 8).map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onMouseDown={() => selectUser(u.id)}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                            >
                              <span className="font-medium text-gray-700">{u.name}</span>
                              <span className="text-xs text-gray-400">{u.phone}</span>
                            </button>
                          ))}
                          {filteredUsers.length === 0 && search && (
                            <p className="px-4 py-3 text-xs text-gray-400 text-center">No customers found</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Type */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {typeOptions.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm({ ...form, type: t.value })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.type === t.value ? t.color + ' ring-1 ring-offset-1' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Special offer just for you!"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
                    required
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Message</label>
                  <textarea
                    value={form.body}
                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                    placeholder="Write your message here..."
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white h-28 resize-none"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{form.body.length}/500 characters</p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={sending || !form.user_id}
                  className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  {sending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <HiOutlinePaperAirplane className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Tips Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Tips</h3>
            <ul className="space-y-3 text-xs text-gray-500">
              <li className="flex gap-2">
                <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>Messages are sent as push notifications and stored in-app</span>
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>Use "All Customers" to broadcast to everyone</span>
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>Keep titles short and clear for better engagement</span>
              </li>
              <li className="flex gap-2">
                <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>Use Promotion type for offers and Coupon type for discount codes</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 mt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Quick Stats</h3>
            <div className="text-2xl font-bold text-gray-800">{users.length}</div>
            <p className="text-xs text-gray-400">Total customers</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messages;
