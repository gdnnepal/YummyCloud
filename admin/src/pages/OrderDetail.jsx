import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineClock, HiStar } from 'react-icons/hi2';
import api from '../services/api';

const statuses = ['confirmed', 'preparing', 'on_the_way', 'delivered'];
const statusLabels = { confirmed: 'Order Confirmed', preparing: 'Preparing', on_the_way: 'On the Way', delivered: 'Delivered', cancelled: 'Cancelled' };

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    Promise.all([api.getOrder(id), api.getDeliveryPartners()])
      .then(([orderRes, partnerRes]) => { setOrder(orderRes.order); setPartners(partnerRes.partners || []); })
      .catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status) => {
    try {
      await api.updateOrderStatus(id, status);
      // Refresh order to get updated logs
      const res = await api.getOrder(id);
      setOrder(res.order);
    } catch (err) { alert(err.message); }
  };

  const handleAssign = async (partnerId) => {
    try {
      await api.assignDelivery(id, partnerId);
      setOrder((prev) => ({ ...prev, delivery_partner_id: partnerId }));
    } catch (err) { alert(err.message); }
  };

  const formatTime = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

  const getTotalTime = () => {
    if (!order?.logs?.length) return null;
    const first = new Date(order.logs[0].created_at);
    const last = order.delivered_at ? new Date(order.delivered_at) : new Date(order.logs[order.logs.length - 1].created_at);
    const diffMin = Math.round((last - first) / 60000);
    if (diffMin < 60) return `${diffMin} min`;
    return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
  };

  if (loading) return <div className="animate-pulse bg-white rounded-xl h-64" />;
  if (!order) return <p className="text-gray-500">Order not found</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Order #{order.order_number}</h1>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{order.status.replace('_', ' ')}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Order Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Order Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>{order.user?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{order.user?.phone}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="capitalize">{order.payment_method}</span></div>
            {order.payment_screenshot && (
              <div className="flex justify-between items-center"><span className="text-gray-500">Screenshot</span><button onClick={() => setShowScreenshot(true)} className="text-primary text-xs font-medium underline">View Screenshot</button></div>
            )}
            <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="text-right max-w-[200px]">{order.address}</span></div>
            {order.note && <div className="flex justify-between"><span className="text-gray-500">Note</span><span>{order.note}</span></div>}
          </div>
        </div>

        {/* Items & Totals */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Items</h3>
          <div className="space-y-1.5 text-sm">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between"><span>{item.name} × {item.quantity}</span><span>Rs. {Number(item.total)}</span></div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>Rs. {Number(order.subtotal)}</span></div>
            {Number(order.delivery_fee) > 0 && <div className="flex justify-between"><span>Delivery Fee</span><span>Rs. {Number(order.delivery_fee)}</span></div>}
            {Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-Rs. {Number(order.discount)}</span></div>}
            {Number(order.wallet_deduction) > 0 && <div className="flex justify-between text-green-600"><span>Wallet</span><span>-Rs. {Number(order.wallet_deduction)}</span></div>}
            <div className="flex justify-between font-bold"><span>Total</span><span>Rs. {Number(order.total)}</span></div>
          </div>
        </div>
      </div>

      {/* Order Timeline Log */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Order Timeline</h3>
          {getTotalTime() && (
            <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
              <HiOutlineClock className="w-3.5 h-3.5" />
              Total: {getTotalTime()}
            </div>
          )}
        </div>
        {order.logs?.length > 0 ? (
          <div className="space-y-0">
            {order.logs.map((log, i) => (
              <div key={log.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                    <HiOutlineCheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  {i < order.logs.length - 1 && <div className="w-0.5 h-6 bg-green-200 my-0.5" />}
                </div>
                <div className="pb-3">
                  <p className="text-sm font-medium text-gray-800 capitalize">{statusLabels[log.status] || log.status}</p>
                  <p className="text-xs text-gray-500">{formatTime(log.created_at)}</p>
                  {log.note && <p className="text-xs text-gray-400 mt-0.5">{log.note}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No logs recorded</p>
        )}
      </div>

      {/* Customer Rating */}
      {order.rating && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Customer Rating</h3>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <HiStar key={s} className={`w-5 h-5 ${s <= order.rating.rating ? 'text-amber-400' : 'text-gray-200'}`} />
            ))}
            <span className="text-sm text-gray-600 ml-2">{order.rating.rating}/5</span>
          </div>
          {order.rating.review && <p className="text-sm text-gray-600 italic">"{order.rating.review}"</p>}
          <p className="text-xs text-gray-400 mt-1">{formatTime(order.rating.created_at)}</p>
        </div>
      )}

      {/* Actions */}
      {order.status !== 'cancelled' && order.status !== 'delivered' && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Update Status</h3>
          <div className="flex flex-wrap gap-2">
            {statuses.map((s) => (
              <button key={s} onClick={() => handleStatusChange(s)} disabled={order.status === s} className={`px-4 py-2 rounded-lg text-xs font-medium capitalize ${order.status === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Assign Delivery Partner</label>
            <select onChange={(e) => handleAssign(e.target.value)} value={order.delivery_partner_id || ''} className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full max-w-xs">
              <option value="">Select partner</option>
              {partners.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Cancel Order */}
      {order.status !== 'cancelled' && order.status !== 'delivered' && (
        <div className="bg-white rounded-xl border border-red-100 p-4">
          <button onClick={() => setShowCancelModal(true)} className="text-sm text-red-500 font-medium hover:underline">
            Cancel this order
          </button>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !cancelling && setShowCancelModal(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Cancel Order</h3>
            <p className="text-sm text-gray-500 mb-3">Please provide a reason for cancellation:</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer requested, out of stock..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-24 resize-none outline-none focus:border-primary mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} disabled={cancelling} className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700">Keep</button>
              <button
                onClick={async () => {
                  if (!cancelReason.trim()) { alert('Please provide a reason'); return; }
                  setCancelling(true);
                  try {
                    await api.request(`/admin/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason: cancelReason }) });
                    const res = await api.getOrder(id);
                    setOrder(res.order);
                    setShowCancelModal(false);
                    setCancelReason('');
                  } catch (err) { alert(err.message); }
                  finally { setCancelling(false); }
                }}
                disabled={cancelling || !cancelReason.trim()}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-500 text-white disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screenshot Popup */}
      {showScreenshot && order.payment_screenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowScreenshot(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative max-w-sm w-full">
            <img
              src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${order.payment_screenshot}`}
              alt="Payment Screenshot"
              className="w-full rounded-xl shadow-2xl"
            />
            <button onClick={() => setShowScreenshot(false)} className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 font-bold">×</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
