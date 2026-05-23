import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilSquare } from 'react-icons/hi2';
import api from '../services/api';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', name_ne: '', icon: '' });
  const [showForm, setShowForm] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const foodEmojis = [
    '🥟', '🍚', '🍜', '🥤', '🍿', '🍰', '🍕', '🍔', '🌮', '🌯',
    '🥗', '🍝', '🍛', '🍲', '🥘', '🍱', '🍣', '🍤', '🥩', '🍗',
    '🍖', '🥚', '🧀', '🥐', '🍞', '🥪', '🌭', '🍟', '🥓', '🍳',
    '🥞', '🧇', '🥯', '🍩', '🍪', '🎂', '🍫', '🍬', '🍭', '🍮',
    '🍦', '🧁', '☕', '🍵', '🧃', '🥛', '🍺', '🍷', '🧊', '🍽️',
  ];

  useEffect(() => { api.getCategories().then((res) => setCategories(res.categories || [])).catch(console.error).finally(() => setLoading(false)); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await api.updateCategory(editingId, form);
        setCategories(categories.map((c) => c.id === editingId ? res.category : c));
      } else {
        const res = await api.createCategory(form);
        setCategories([...categories, res.category]);
      }
      resetForm();
    } catch (err) { alert(err.message); }
  };

  const handleEdit = (cat) => {
    setForm({ name: cat.name || '', name_ne: cat.name_ne || '', icon: cat.icon || '' });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ name: '', name_ne: '', icon: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await api.deleteCategory(id); setCategories(categories.filter((c) => c.id !== id)); } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Categories</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium"><HiOutlinePlus className="w-4 h-4" /> Add</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{editingId ? 'Edit Category' : 'Add Category'}</h3>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[120px] outline-none focus:border-primary" required />
            <input type="text" value={form.name_ne} onChange={(e) => setForm({ ...form, name_ne: e.target.value })} placeholder="Nepali Name" className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[120px] outline-none focus:border-primary" />
            <div className="relative">
              <button type="button" onClick={() => setShowIconPicker(!showIconPicker)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-20 text-center hover:border-primary">
                {form.icon || 'Icon'}
              </button>
              {showIconPicker && (
                <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-2 w-64 grid grid-cols-8 gap-1">
                  {foodEmojis.map((emoji) => (
                    <button key={emoji} type="button" onClick={() => { setForm({ ...form, icon: emoji }); setShowIconPicker(false); }} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-lg">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">{editingId ? 'Update' : 'Save'}</button>
            <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </form>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase"><tr><th className="px-4 py-3 text-left">Icon</th><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Nepali</th><th className="px-4 py-3 text-center">Actions</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xl">{cat.icon}</td>
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.name_ne}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(cat)} className="p-1.5 rounded hover:bg-blue-50" title="Edit">
                        <HiOutlinePencilSquare className="w-4 h-4 text-blue-500" />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded hover:bg-red-50" title="Delete">
                        <HiOutlineTrash className="w-4 h-4 text-red-500" />
                      </button>
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

export default Categories;
