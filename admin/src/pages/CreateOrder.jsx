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
  const [customerLat, setCustomerLat] = useState('');
  const [customerLng, setCustomerLng] = useState('');
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
      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        address,
        payment_method: paymentMethod,
        note,
        items: cart.map((c) => ({ id: c.id, quantity: c.quantity })),
      };
      if (customerLat) payload.customer_lat = customerLat;
      if (customerLng) payload.customer_lng = customerLng;
      const res = await api.request('/admin/orders/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      alert('Order created successfully!');
      navigate(`/orders/${res.order.id}`);
    } catch (err) { alert(err.message || 'Failed to create order.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="animate-pulse bg-white rounded-xl h-64" />;

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Create Order</h1>

      <div className="grid lg:grid-cols-5 gap-4 h-[calc(100%-3rem)]">
        {/* Left - Customer & Cart (fixed height, scrollable) */}
        <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
          {/* Customer Details */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-3 shrink-0">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Customer</h3>
            <div className="relative mb-2">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                placeholder="Search existing customer..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              />
              {showCustomerDropdown && customerSearch && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
                  {filteredCustomers.slice(0, 5).map((c) => (
                    <button key={c.id} type="button" onMouseDown={() => selectCustomer(c)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between">
                      <span>{c.name}</span><span className="text-gray-400 text-xs">{c.phone}</span>
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">No match</p>}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Name *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" required />
              <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Phone *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" required />
            </div>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address *" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 outline-none focus:border-primary" required />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input type="text" value={customerLat} onChange={(e) => setCustomerLat(e.target.value)} placeholder="Latitude (optional)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
              <input type="text" value={customerLng} onChange={(e) => setCustomerLng(e.target.value)} placeholder="Longitude (optional)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-white">
                <option value="cod">COD</option>
                <option value="qr">QR Payment</option>
              </select>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>

          {/* Cart - scrollable */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex-1 overflow-y-auto min-h-0">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Cart ({cart.length} items)</h3>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Add items from menu →</p>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">Rs. {item.price} × {item.quantity} = Rs. {item.price * item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button type="button" onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center"><HiOutlineMinus className="w-3 h-3" /></button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button type="button" onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center"><HiOutlinePlus className="w-3 h-3" /></button>
                      <button type="button" onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded bg-red-50 flex items-center justify-center ml-1"><HiOutlineTrash className="w-3 h-3 text-red-500" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fixed Submit */}
          <div className="bg-white rounded-xl border border-gray-100 p-3 mt-3 shrink-0">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span>Subtotal</span><span>Rs. {subtotal}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || cart.length === 0 || !customerPhone || !address}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </div>

        {/* Right - Menu (POS style) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-gray-100 shrink-0">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Menu</h3>
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder="Search menu items..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredMenu.map((item) => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item)}
                    disabled={!item.is_available}
                    className={`text-left p-3 rounded-lg border transition-all ${!item.is_available ? 'opacity-40 border-gray-100' : inCart ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-300'}`}
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{item.category?.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-sm font-bold text-gray-800">Rs. {item.price}</span>
                      {inCart && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-medium">{inCart.quantity}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateOrder;
