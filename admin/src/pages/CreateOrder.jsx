import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlineMinus, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import api from '../services/api';

function CreateOrder() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [address, setAddress] = useState('');
  const [customerLat, setCustomerLat] = useState('');
  const [customerLng, setCustomerLng] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [note, setNote] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('0');
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
    setCustomerEmail(c.email || '');
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
  const deliveryFeeNum = parseFloat(deliveryFee) || 0;
  const total = subtotal + deliveryFeeNum;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !address || cart.length === 0) {
      setPopup({ type: 'error', message: 'Please fill all required fields and add at least one item.' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || undefined,
        address,
        payment_method: paymentMethod,
        note,
        delivery_fee: deliveryFeeNum,
        items: cart.map((c) => ({ id: c.id, quantity: c.quantity })),
      };
      if (customerLat) payload.customer_lat = customerLat;
      if (customerLng) payload.customer_lng = customerLng;
      const res = await api.request('/admin/orders/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setPopup({ type: 'success', message: 'Order created successfully!', orderId: res.order.id });
    } catch (err) {
      setPopup({ type: 'error', message: err.message || 'Failed to create order.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="animate-pulse bg-white rounded-xl h-64" />;

  return (
    // Full viewport height minus the admin header (~4rem)
    <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      <h1 className="text-xl font-bold text-gray-800 mb-3 shrink-0">Create Order</h1>

      <div className="flex gap-4 flex-1 min-h-0">

        {/* ── LEFT PANEL ── fixed, no scroll */}
        <div className="w-80 shrink-0 flex flex-col gap-0 min-h-0">

          {/* Customer form — fixed */}
          <div className="bg-white rounded-t-xl border border-gray-100 p-3 shrink-0">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Customer</p>

            {/* Search existing */}
            <div className="relative mb-2">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                placeholder="Search existing customer..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary"
              />
              {showCustomerDropdown && customerSearch && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-32 overflow-y-auto">
                  {filteredCustomers.slice(0, 5).map((c) => (
                    <button key={c.id} type="button" onMouseDown={() => selectCustomer(c)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex justify-between">
                      <span>{c.name}</span>
                      <span className="text-gray-400">{c.phone}</span>
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">No match</p>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-1.5">
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Name *" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary" />
              <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Phone *" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary" />
            </div>
            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Email (optional)" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs mb-1.5 outline-none focus:border-primary" />
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Delivery address *" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs mb-1.5 outline-none focus:border-primary" />
            <div className="grid grid-cols-2 gap-1.5 mb-1.5">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary bg-white">
                <option value="cod">COD</option>
                <option value="qr">QR Payment</option>
              </select>
              <input type="number" min="0" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)}
                placeholder="Delivery fee" className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary" />
            </div>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-primary" />
          </div>

          {/* Cart — scrollable, fills remaining space */}
          <div className="bg-white border-x border-gray-100 flex-1 overflow-y-auto min-h-0 px-3 py-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Cart {cart.length > 0 && <span className="text-primary">({cart.length})</span>}
            </p>
            {cart.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">Add items from the menu →</p>
            ) : (
              <div className="space-y-1.5">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400">Rs.{item.price} × {item.quantity} = Rs.{item.price * item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => updateQty(item.id, -1)}
                        className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center">
                        <HiOutlineMinus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-xs font-medium w-4 text-center">{item.quantity}</span>
                      <button type="button" onClick={() => updateQty(item.id, 1)}
                        className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center">
                        <HiOutlinePlus className="w-2.5 h-2.5" />
                      </button>
                      <button type="button" onClick={() => removeFromCart(item.id)}
                        className="w-5 h-5 rounded bg-red-50 flex items-center justify-center ml-0.5">
                        <HiOutlineTrash className="w-2.5 h-2.5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary + Submit — pinned at bottom */}
          <div className="bg-white rounded-b-xl border border-gray-100 p-3 shrink-0">
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span><span>Rs. {subtotal}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Delivery Fee</span><span>Rs. {deliveryFeeNum}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-gray-800 border-t border-gray-100 pt-1.5">
                <span>Total</span><span>Rs. {total}</span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || cart.length === 0 || !customerPhone || !address}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
            >
              {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {submitting ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL — Menu, scrollable ── */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100 flex flex-col min-h-0">
          <div className="p-3 border-b border-gray-100 shrink-0">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Menu</p>
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder="Search menu items..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 min-h-0">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
              {filteredMenu.map((item) => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item)}
                    disabled={!item.is_available}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      !item.is_available
                        ? 'opacity-40 cursor-not-allowed border-gray-100'
                        : inCart
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400 truncate mb-1">{item.category?.name}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-800">Rs. {item.price}</span>
                      {inCart
                        ? <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-semibold">{inCart.quantity}</span>
                        : <span className="text-[10px] text-gray-400">tap to add</span>
                      }
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Popup */}
      {popup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { if (popup.type !== 'success') setPopup(null); }} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${popup.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
              {popup.type === 'success'
                ? <HiOutlineCheckCircle className="w-7 h-7 text-green-500" />
                : <HiOutlineExclamationTriangle className="w-7 h-7 text-red-500" />
              }
            </div>
            <h3 className="text-lg font-bold text-gray-800">{popup.type === 'success' ? 'Success' : 'Error'}</h3>
            <p className="text-sm text-gray-500 mt-2">{popup.message}</p>
            <button
              onClick={() => { if (popup.type === 'success' && popup.orderId) navigate(`/orders/${popup.orderId}`); setPopup(null); }}
              className={`w-full mt-5 py-2.5 rounded-xl text-sm font-medium text-white ${popup.type === 'success' ? 'bg-green-500' : 'bg-primary'}`}
            >
              {popup.type === 'success' ? 'View Order' : 'OK'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateOrder;
