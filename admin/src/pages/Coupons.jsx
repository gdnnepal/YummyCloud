import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2';
import api from '../services/api';

function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [form, setForm] = useState({
    code: '', description: '', type: 'percent', value: '',
    min_order: '0', max_discount: '', usage_limit: '',
    is_active: true, user_id: '',
  });

  useEffect(() => {
    Promise.all([api.getCoupons(), api.getUsers()])
      .then(([couponRes, userRes]) => {
        setCoupons(couponRes.coupons || []);
        setUsers(userRes.users || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone.includes(userSearch)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (!data.usage_limit) data.usage_limit = null;
      if (!data.max_discount) data.max_discount = null;
      if (!data.user_id) data.user_id = null;
      const res = await api.createCoupon(data);
      setCoupons([res.coupon, ...coupons]);
      setShowForm(false);
      setForm({ code: '', description: '', type: 'percent', value: '', min_order: '0', max_discount: '', usage_limit: '', is_active: true, user_id: '' });
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try { await api.deleteCoupon(id); setCoupons(coupons.filter((c) => c.id !== id)); } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Coupons</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
          <HiOutlinePlus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <h3 className="font-semibold text-gray-800 mb-3">Create Coupon</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="Code" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (Rs.)</option>
              </select>
              <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="Value" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
              <input type="number" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} placeholder="Min Order" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input type="number" value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} placeholder="Max Discount (optional)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="Usage Limit (blank = unlimited)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>

            {/* Customer-specific */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Assign to Customer (optional)</label>
              {form.user_id ? (
                <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2">
                  <span className="text-sm">{users.find((u) => String(u.id) === form.user_id)?.name || 'All'} ({users.find((u) => String(u.id) === form.user_id)?.phone})</span>
                  <button type="button" onClick={() => setForm({ ...form, user_id: '' })} className="text-xs text-primary font-medium">Remove</button>
                </div>
              ) : (
                <div>
                  <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search customer (leave blank for all)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  {userSearch && (
                    <div className="border border-gray-200 rounded-lg mt-1 max-h-32 overflow-y-auto bg-white">
                      {filteredUsers.slice(0, 5).map((u) => (
                        <button key={u.id} type="button" onClick={() => { setForm({ ...form, user_id: String(u.id) }); setUserSearch(''); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between">
                          <span>{u.name}</span><span className="text-xs text-gray-400">{u.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">Create</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">For</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                  <td className="px-4 py-3 text-center capitalize">{c.type}</td>
                  <td className="px-4 py-3 text-center">{c.type === 'percent' ? `${c.value}%` : `Rs.${c.value}`}</td>
                  <td className="px-4 py-3 text-center">Rs.{c.min_order}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs">{c.used_count}{c.usage_limit ? `/${c.usage_limit}` : '/∞'}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.user ? (
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{c.user.name}</span>
                    ) : (
                      <span className="text-[10px] text-gray-400">All</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-red-50">
                      <HiOutlineTrash className="w-4 h-4 text-red-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Coupons;
