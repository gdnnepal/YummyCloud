import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlineMinus, HiOutlineTrash } from 'react-icons/hi2';
import api from '../services/api';

function CreateOrder() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [note, setNote] = useState('');
  const [cart, setCart] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');

  useEffect(() => {
    Promise.all([api.getMenuItems(), api.getUsers()])
      .then(([menuRes, userRes]) => {
        setMenuItems(menuRes.items || []);
        setCustomers(userRes.users || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
  );

  const filteredMenu = menuItems.filter((m) =>
    m.name.toLowerCase().includes(menuSearch.toLowerCase())
  );

  const selectCustomer = (c) => {
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  const addToCart = (item) => {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) {
      setCart(cart.map((c) => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { id: item.id, name: item.name, price: item.price, quantity: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map((c) => c.id === id ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((c) => c.id !== id));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !address || cart.length === 0) {
      alert('Please fill all required fields and add at least one item.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.request('/admin/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          address,
          payment_method: paymentMethod,
          note,
          items: cart.map((c) => ({ id: c.id, quantity: c.quantity })),
        }),
      });
      alert('Order created successfully!');
      navigate(`/orders/${res.order.id}`);
    } catch (err) { alert(err.message || 'Failed to create order.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="animate-pulse bg-white rounded-xl h-64" />;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-6">Create Order</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-2 gap-5">
        {/* Left - Customer & Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Customer Details</h3>

            {/* Customer Search */}
            <div className="mb-3 relative">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Search Existing Customer</label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                placeholder="Search by name or phone..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              />
              {showCustomerDropdown && customerSearch && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                  {filteredCustomers.slice(0, 6).map((c) => (
                    <button key={c.id} type="button" onMouseDown={() => selectCustomer(c)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between">
                      <span>{c.name}</span><span className="text-gray-400">{c.phone}</span>
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">No match — fill details below for new customer</p>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Name *</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Phone *</label>
                <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9800000000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" required />
              </div>
            </div>

            <div className="mt-3">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Delivery Address *</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full delivery address" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" required />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Payment</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white">
                  <option value="cod">Cash on Delivery</option>
                  <option value="qr">QR Payment</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Note</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Order Items ({cart.length})</h3>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Add items from the menu →</p>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">Rs. {item.price} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center"><HiOutlineMinus className="w-3 h-3" /></button>
                      <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                      <button type="button" onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center"><HiOutlinePlus className="w-3 h-3" /></button>
                      <button type="button" onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded bg-red-50 flex items-center justify-center ml-1"><HiOutlineTrash className="w-3 h-3 text-red-500" /></button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-2 font-bold text-sm">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal}</span>
                </div>
              </div>
            )}

            <button type="submit" disabled={submitting || cart.length === 0 || !customerPhone || !address} className="w-full mt-4 bg-primary text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors">
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </div>

        {/* Right - Menu Items */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 max-h-[75vh] overflow-hidden flex flex-col">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Menu Items</h3>
          <input
            type="text"
            value={menuSearch}
            onChange={(e) => setMenuSearch(e.target.value)}
            placeholder="Search menu..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 outline-none focus:border-primary"
          />
          <div className="flex-1 overflow-y-auto space-y-1">
            {filteredMenu.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addToCart(item)}
                disabled={!item.is_available}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex justify-between items-center transition-colors ${!item.is_available ? 'opacity-40' : 'hover:bg-gray-50'} ${cart.find(c => c.id === item.id) ? 'bg-primary/5 border border-primary/20' : ''}`}
              >
                <div>
                  <p className="font-medium text-gray-700">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.category?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">Rs. {item.price}</p>
                  {cart.find(c => c.id === item.id) && (
                    <p className="text-[10px] text-primary font-medium">× {cart.find(c => c.id === item.id).quantity}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}

export default CreateOrder;
