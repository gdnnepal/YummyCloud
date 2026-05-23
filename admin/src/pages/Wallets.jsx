import { useState, useEffect } from 'react';
import { HiOutlineArrowDownLeft, HiOutlineArrowUpRight } from 'react-icons/hi2';
import api from '../services/api';

function Wallets() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ type: 'credit', amount: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

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
      // Reload transactions
      const fresh = await api.request(`/admin/users/${selected.id}/wallet`);
      setWalletData(fresh);
    } catch (err) { setMsg(err.message || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search)
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">Wallet Management</h1>
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Customer List */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-primary" />
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filtered.map((u) => (
              <button key={u.id} onClick={() => loadWallet(u)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex justify-between ${selected?.id === u.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-50'}`}>
                <span>{u.name}</span><span className="text-gray-400">{u.phone}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Wallet Detail */}
        <div>
          {!selected ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">Select a customer to view wallet</div>
          ) : loading ? (
            <div className="bg-white rounded-xl border border-gray-100 h-40 animate-pulse" />
          ) : walletData ? (
            <div className="space-y-3">
              {/* Balance */}
              <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-4 text-white">
                <p className="text-sm opacity-80">{walletData.user.name} — {walletData.user.phone}</p>
                <p className="text-2xl font-bold mt-1">Rs. {Number(walletData.balance)}</p>
              </div>

              {/* Adjust */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="font-semibold text-sm mb-3">Adjust Balance</h3>
                {msg && <div className={`text-xs px-3 py-2 rounded-lg mb-3 ${msg.includes('Failed') || msg.includes('Insufficient') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{msg}</div>}
                <form onSubmit={handleAdjust} className="space-y-2">
                  <div className="flex gap-2">
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1">
                      <option value="credit">Credit (+)</option>
                      <option value="debit">Debit (-)</option>
                    </select>
                    <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount" className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 outline-none focus:border-primary" required />
                  </div>
                  <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Reason / Note" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" required />
                  <button type="submit" disabled={submitting} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                    {submitting ? 'Processing...' : 'Apply'}
                  </button>
                </form>
              </div>

              {/* Transactions */}
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="font-semibold text-sm mb-3">Recent Transactions</h3>
                <div className="space-y-2">
                  {walletData.transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${txn.type === 'credit' ? 'bg-green-50' : 'bg-red-50'}`}>
                        {txn.type === 'credit' ? <HiOutlineArrowDownLeft className="w-4 h-4 text-green-600" /> : <HiOutlineArrowUpRight className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{txn.title}</p>
                        <p className="text-[10px] text-gray-400">{new Date(txn.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                      </div>
                      <span className={`text-xs font-bold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                        {txn.type === 'credit' ? '+' : '-'}Rs. {Number(txn.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Wallets;
