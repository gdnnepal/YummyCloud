import { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';

const PER_PAGE = 10;

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [blockModal, setBlockModal] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    api.getUsers()
      .then((res) => setUsers(res.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  const totalPages = Math.ceil(filteredUsers.length / PER_PAGE);
  const paginatedUsers = filteredUsers.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const getTag = (deliveredCount) => {
    if (deliveredCount >= 20) return { label: 'VIP', color: 'bg-amber-100 text-amber-700' };
    if (deliveredCount >= 10) return { label: 'Loyal', color: 'bg-purple-100 text-purple-700' };
    if (deliveredCount >= 5) return { label: 'Repeat', color: 'bg-blue-100 text-blue-700' };
    return null;
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">Customers</h1>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or phone..."
          className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Delivered</th>
                <th className="px-4 py-3">Cancelled</th>
                <th className="px-4 py-3">Spent</th>
                <th className="px-4 py-3">Tag</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedUsers.map((user) => {
                const tag = getTag(user.delivered_count || 0);
                return (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.phone}</td>
                    <td className="px-4 py-3 text-center font-medium">{user.orders_count || 0}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">{user.delivered_count || 0}</td>
                    <td className="px-4 py-3 text-center text-red-500 font-medium">{user.cancelled_count || 0}</td>
                    <td className="px-4 py-3 text-center font-medium text-green-600">Rs. {Number(user.orders_sum_total || 0)}</td>
                    <td className="px-4 py-3 text-center">
                      {tag ? (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tag.color}`}>{tag.label}</span>
                      ) : (
                        <span className="text-[10px] text-gray-400">New</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!user.is_blocked}
                          onChange={() => {
                            if (!user.is_blocked) {
                              setBlockModal(user);
                              setBlockReason('');
                            } else {
                              api.request(`/admin/users/${user.id}/toggle-block`, { method: 'PUT', body: JSON.stringify({ reason: '' }) })
                                .then(() => setUsers(users.map(u => u.id === user.id ? { ...u, is_blocked: false } : u)))
                                .catch(err => setBlockModal(null));
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-red-300 peer-checked:bg-green-400 rounded-full transition-colors" />
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Block User Modal */}
      {blockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !blocking && setBlockModal(null)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Block Customer</h3>
            <p className="text-sm text-gray-500 mb-1">Block <strong>{blockModal.name}</strong> ({blockModal.phone})?</p>
            <p className="text-xs text-gray-400 mb-3">They won't be able to place orders.</p>
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Reason for blocking (required)..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 resize-none outline-none focus:border-primary mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setBlockModal(null)} disabled={blocking} className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700">Cancel</button>
              <button
                onClick={async () => {
                  if (!blockReason.trim()) return;
                  setBlocking(true);
                  try {
                    await api.request(`/admin/users/${blockModal.id}/toggle-block`, { method: 'PUT', body: JSON.stringify({ reason: blockReason }) });
                    setUsers(users.map(u => u.id === blockModal.id ? { ...u, is_blocked: true } : u));
                    setBlockModal(null);
                    setBlockReason('');
                  } catch (err) { alert(err.message); }
                  finally { setBlocking(false); }
                }}
                disabled={blocking || !blockReason.trim()}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-500 text-white disabled:opacity-50"
              >
                {blocking ? 'Blocking...' : 'Block User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
