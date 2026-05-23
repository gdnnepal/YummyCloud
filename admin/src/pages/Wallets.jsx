import { useState, useEffect } from 'react';
import { HiOutlineArrowDownLeft, HiOutlineArrowUpRight, HiOutlineWallet, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import api from '../services/api';

const PER_PAGE = 15;

function Wallets() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ type: 'credit', amount: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.getUsers().then((res) => setUsers(res.users || [])).catch(console.error);
  }, []);

  const loadWallet = async (user) => {
    setSelected(user); setWalletData(null); setMsg('');
    setLoading(true);
    try {
      const res = await api.request(`/admin/users/${user.id}/wallet`);
      setWalletData(res);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    setSubmitting(true); setMsg('');
    try {
      const res = await api.request(`/admin/users/${selected.id}/wallet`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setMsg(res.message);
      setWalletData((prev) => ({ ...prev, balance: res.balance }));
      setForm({ type: 'credit', amount: '', note: '' });
      const fresh = await api.request(`/admin/users/${selected.id}/wallet`);
      setWalletData(fresh);
    } catch (err) { setMsg(err.message || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search)
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginatedUsers = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Wallet Management</h1>
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Customer List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col" style={{ maxHeight: '75vh' }}>
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search customer..."
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2">{filtered.length} customers</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {paginatedUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => loadWallet(u)}
                className={`w-full text-left px-4 py-3 text-sm flex justify-between items-center border-b border-gray-50 transition-colors ${selected?.id === u.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-gray-50'}`}
              >
                <div>
                  <p className={`font-medium ${selected?.id === u.id ? 'text-primary' : 'text-gray-700'}`}>{u.name}</p>
                </div>
                <span className="text-xs text-gray-400">{u.phone}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">No customers found</p>
            )}
          </div>
          {totalPages > 1 && (
            <div className="p-3 border-t border-gray-100 flex items-center justify-between">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="text-xs text-gray-500 disabled:opacity-30 hover:text-primary">← Prev</button>
              <span className="text-xs text-gray-400">{page} / {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="text-xs text-gray-500 disabled:opacity-30 hover:text-primary">Next →</button>
            </div>
          )}
        </div>

        {/* Wallet Detail */}
        <div className="lg:col-span-3">
          {!selected ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <HiOutlineWallet className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Select a customer to view their wallet</p>
            </div>
          ) : loading ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
            </div>
          ) : walletData ? (
            <div className="space-y-4">
              {/* Balance Card */}
              <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">{walletData.user.name}</p>
                    <p className="text-xs opacity-60">{walletData.user.phone}</p>
                  </div>
                  <HiOutlineWallet className="w-8 h-8 opacity-40" />
                </div>
                <p className="text-3xl font-bold mt-3">Rs. {Number(walletData.balance)}</p>
                <p className="text-xs opacity-60 mt-1">Current Balance</p>
              </div>

              {/* Adjust Form */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Adjust Balance</h3>
                {msg && <div className={`text-xs px-3 py-2 rounded-lg mb-3 ${msg.includes('Failed') || msg.includes('Insufficient') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{msg}</div>}
                <form onSubmit={handleAdjust} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Type</label>
                      <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white">
                        <option value="credit">Credit (+)</option>
                        <option value="debit">Debit (-)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Amount</label>
                      <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Note</label>
                    <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Reason for adjustment..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white" required />
                  </div>
                  <button type="submit" disabled={submitting} className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">
                    {submitting ? 'Processing...' : 'Apply'}
                  </button>
                </form>
              </div>

              {/* Transactions */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Recent Transactions</h3>
                {walletData.transactions.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {walletData.transactions.map((txn) => (
                      <div key={txn.id} className="flex items-center gap-3 py-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${txn.type === 'credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                          {txn.type === 'credit' ? <HiOutlineArrowDownLeft className="w-4 h-4 text-green-600" /> : <HiOutlineArrowUpRight className="w-4 h-4 text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{txn.title}</p>
                          {txn.description && <p className="text-[10px] text-gray-400 truncate">{txn.description}</p>}
                          <p className="text-[10px] text-gray-400">{new Date(txn.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                        </div>
                        <span className={`text-sm font-bold shrink-0 ${txn.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                          {txn.type === 'credit' ? '+' : '-'}Rs. {Number(txn.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Wallets;
