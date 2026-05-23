import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import api from '../services/api';

function MenuItems() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', name_ne: '', price: '', category_id: '', is_veg: false, is_available: true, is_featured: false, image: null });

  useEffect(() => {
    Promise.all([api.getMenuItems(), api.getCategories()])
      .then(([menuRes, catRes]) => { setItems(menuRes.items || []); setCategories(catRes.categories || []); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('name_ne', form.name_ne || '');
      formData.append('price', form.price);
      formData.append('category_id', form.category_id);
      formData.append('is_veg', form.is_veg ? '1' : '0');
      formData.append('is_available', form.is_available ? '1' : '0');
      formData.append('is_featured', form.is_featured ? '1' : '0');
      if (form.image) formData.append('image', form.image);

      if (editItem) {
        formData.append('_method', 'PUT');
        const res = await api.upload(`/admin/menu-items/${editItem.id}`, formData);
        setItems(items.map((i) => i.id === editItem.id ? res.item : i));
      } else {
        const res = await api.upload('/admin/menu-items', formData);
        setItems([...items, res.item]);
      }
      resetForm();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try { await api.deleteMenuItem(id); setItems(items.filter((i) => i.id !== id)); } catch (err) { alert(err.message); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.toggleMenuItemAvailability(id);
      setItems(items.map((i) => i.id === id ? res.item : i));
    } catch (err) { alert(err.message); }
  };

  const resetForm = () => { setShowForm(false); setEditItem(null); setForm({ name: '', name_ne: '', price: '', category_id: '', is_veg: false, is_available: true, is_featured: false, image: null }); };

  const openEdit = (item) => { setEditItem(item); setForm({ name: item.name, name_ne: item.name_ne || '', price: item.price, category_id: item.category_id, is_veg: item.is_veg, is_available: item.is_available, is_featured: item.is_featured, image: null }); setShowForm(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Menu Items</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">
          <HiOutlinePlus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={resetForm} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editItem ? 'Edit Item' : 'Add Item'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name (English)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
              <input type="text" value={form.name_ne} onChange={(e) => setForm({ ...form, name_ne: e.target.value })} placeholder="Name (Nepali)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required>
                <option value="">Select Category</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_veg} onChange={(e) => setForm({ ...form, is_veg: e.target.checked })} className="accent-green-600" /> Veg</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="accent-primary" /> Featured</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} className="accent-blue-600" /> Available</label>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Image (optional)</label>
                <div className="flex items-center gap-3">
                  {editItem?.image && !form.image && (
                    <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${editItem.image}`} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                  )}
                  {form.image && (
                    <img src={URL.createObjectURL(form.image)} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                  )}
                  <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] || null })} className="text-xs" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 py-2 rounded-lg text-sm bg-gray-100 text-gray-600">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg text-sm bg-primary text-white font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 border-2 rounded-sm ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}><span className={`block w-1.5 h-1.5 rounded-full m-auto mt-0.5 ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`} /></span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">Rs. {Number(item.price)}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{item.category?.name}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggle(item.id)} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-gray-100"><HiOutlinePencilSquare className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-50"><HiOutlineTrash className="w-4 h-4 text-red-500" /></button>
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

export default MenuItems;
