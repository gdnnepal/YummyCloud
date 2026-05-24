import { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';

const PER_PAGE = 10;

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

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
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

export default Users;
