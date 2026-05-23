import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineEye, HiOutlineXMark } from 'react-icons/hi2';
import api from '../services/api';

function DeliveryPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPartner, setEditPartner] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [viewStats, setViewStats] = useState(null);

  useEffect(() => {
    api.getDeliveryPartners()
      .then((res) => setPartners(res.partners || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editPartner) {
        const res = await api.request(`/admin/delivery-partners/${editPartner.id}`, { method: 'PUT', body: JSON.stringify(form) });
        setPartners(partners.map((p) => p.id === editPartner.id ? res.partner : p));
      } else {
        const res = await api.request('/admin/delivery-partners', { method: 'POST', body: JSON.stringify(form) });
        setPartners([...partners, res.partner]);
      }
      resetForm();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this delivery partner?')) return;
    try {
      await api.request(`/admin/delivery-partners/${id}`, { method: 'DELETE' });
      setPartners(partners.filter((p) => p.id !== id));
    } catch (err) { alert(err.message); }
  };

  const handleSuspend = async (id) => {
    try {
      const res = await api.request(`/admin/delivery-partners/${id}/suspend`, { method: 'PUT' });
      setPartners(partners.map((p) => p.id === id ? res.partner : p));
    } catch (err) { alert(err.message); }
  };

  const handleViewStats = async (id) => {
    try {
      const res = await api.request(`/admin/delivery-partners/${id}/stats`);
      setViewStats(res);
    } catch (err) { alert(err.message); }
  };

  const resetForm = () => { setShowForm(false); setEditPartner(null); setForm({ name: '', phone: '', password: '' }); };

  const openEdit = (p) => { setEditPartner(p); setForm({ name: p.name, phone: p.phone, password: '' }); setShowForm(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Delivery Partners</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
          <HiOutlinePlus className="w-4 h-4" /> Add Partner
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={resetForm} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">{editPartner ? 'Edit Partner' : 'Add Delivery Partner'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full Name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="Phone (10 digits)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required maxLength={10} />
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editPartner ? 'New password (leave blank to keep)' : 'Password'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" {...(!editPartner && { required: true })} />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 py-2 rounded-lg text-sm bg-gray-100 text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg text-sm bg-primary text-white font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {viewStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setViewStats(null)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{viewStats.partner.name}</h3>
              <button onClick={() => setViewStats(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">{viewStats.partner.phone}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{viewStats.stats.today_delivered}</p>
                <p className="text-[10px] text-green-600 font-medium">Today</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">{viewStats.stats.week_delivered}</p>
                <p className="text-[10px] text-blue-600 font-medium">This Week</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-700">{viewStats.stats.total_delivered}</p>
                <p className="text-[10px] text-purple-600 font-medium">Total Delivered</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-700">{viewStats.stats.active_orders}</p>
                <p className="text-[10px] text-orange-600 font-medium">Active Now</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : partners.length === 0 ? <div className="p-8 text-center text-gray-400">No delivery partners</div> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {partners.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{p.phone}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.is_verified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.is_verified ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleViewStats(p.id)} className="p-1.5 rounded hover:bg-blue-50" title="View Stats"><HiOutlineEye className="w-4 h-4 text-blue-500" /></button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded hover:bg-gray-100" title="Edit"><HiOutlinePencilSquare className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => handleSuspend(p.id)} className="p-1.5 rounded hover:bg-yellow-50" title={p.is_verified ? 'Suspend' : 'Activate'}>
                        <span className="text-xs">{p.is_verified ? '⏸️' : '▶️'}</span>
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-50" title="Delete"><HiOutlineTrash className="w-4 h-4 text-red-500" /></button>
                    </div>
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

export default DeliveryPartners;
