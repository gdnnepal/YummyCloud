import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineMapPin, HiOutlinePhone, HiOutlineChevronLeft, HiOutlineBanknotes, HiOutlineTruck, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi2';
import api from '../services/api';

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api.getOrder(id).then((res) => setOrder(res.order)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  // Send rider location every 15 seconds when on_the_way
  useEffect(() => {
    if (!order || order.status !== 'on_the_way') return;
    const sendLocation = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          api.request(`/rider/orders/${id}/location`, {
            method: 'PUT',
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };
    sendLocation();
    const interval = setInterval(sendLocation, 15000);
    return () => clearInterval(interval);
  }, [order?.status, id]);

  const handleStatusUpdate = async (status) => {
    setUpdating(true);
    try {
      await api.updateStatus(id, status);
      setOrder((prev) => ({ ...prev, status }));
      if (status === 'delivered') {
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) { alert(err.message); }
    finally { setUpdating(false); }
  };

  const openNavigation = () => {
    if (!order) return;
    if (order.customer_lat && order.customer_lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.customer_lat},${order.customer_lng}`, '_blank');
    } else {
      const query = encodeURIComponent(order.address);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-100 px-4 py-3 h-14" />
        <div className="px-4 pt-4 space-y-4">
          <div className="bg-white rounded-2xl h-40 animate-pulse" />
          <div className="bg-white rounded-2xl h-24 animate-pulse" />
          <div className="bg-white rounded-2xl h-16 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!order) return <div className="min-h-screen flex items-center justify-center text-gray-500">Order not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform">
          <HiOutlineChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-bold text-gray-800">Order #{order.order_number}</h1>
          <span className={`text-[10px] font-semibold capitalize ${order.status === 'delivered' ? 'text-green-600' : order.status === 'on_the_way' ? 'text-blue-600' : 'text-orange-600'}`}>
            {order.status.replace('_', ' ')}
          </span>
        </div>
        {order.payment_method === 'cod' && (
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
            <HiOutlineBanknotes className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-700">COD</span>
          </div>
        )}
      </header>

      {/* Amount to Collect */}
      {order.payment_method === 'cod' && order.status !== 'delivered' && (
        <div className="px-4 mt-4">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-4 text-white">
            <p className="text-xs opacity-80">Collect from customer</p>
            <p className="text-2xl font-bold mt-1">Rs. {Number(order.total)}</p>
          </div>
        </div>
      )}

      {/* Customer & Address */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">{order.user?.name}</p>
              <p className="text-xs text-gray-500">{order.user?.phone}</p>
            </div>
            {order.user?.phone && (
              <a href={`tel:${order.user.phone}`} className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                <HiOutlinePhone className="w-5 h-5 text-white" />
              </a>
            )}
          </div>
          <div className="flex items-start gap-2 pt-3 border-t border-gray-100">
            <HiOutlineMapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-gray-600 flex-1">{order.address}</p>
          </div>
          {order.note && (
            <div className="mt-3 p-2.5 bg-amber-50 rounded-xl">
              <p className="text-xs text-amber-700"><strong>Note:</strong> {order.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigate Button */}
      {order.status !== 'delivered' && (
        <div className="px-4 mt-3">
          <button
            onClick={openNavigation}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-sm"
          >
            <HiOutlineMapPin className="w-5 h-5" />
            Open in Google Maps
          </button>
        </div>
      )}

      {/* Order Summary */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Payment Method</span>
            <span className="text-xs font-semibold text-gray-800 capitalize">{order.payment_method === 'cod' ? 'Cash on Delivery' : 'QR (Prepaid)'}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">Order Total</span>
            <span className="text-sm font-bold text-gray-800">Rs. {Number(order.total)}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">Placed at</span>
            <span className="text-xs text-gray-600">{new Date(order.created_at).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons - Fixed Bottom */}
      {order.status !== 'delivered' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
          <div className="max-w-[480px] mx-auto">
            {order.status === 'preparing' ? (
              <button
                onClick={() => handleStatusUpdate('on_the_way')}
                disabled={updating}
                className="w-full bg-primary text-white py-4 rounded-xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-transform shadow-lg shadow-primary/25"
              >
                {updating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <HiOutlineTruck className="w-5 h-5" /> Pick Up & Start Delivery
                  </span>
                )}
              </button>
            ) : order.status === 'on_the_way' ? (
              <button
                onClick={() => handleStatusUpdate('delivered')}
                disabled={updating}
                className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-transform shadow-lg shadow-green-600/25"
              >
                {updating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <HiOutlineCheckCircle className="w-5 h-5" /> Mark as Delivered
                  </span>
                )}
              </button>
            ) : order.status === 'confirmed' ? (
              <div className="text-center text-sm text-gray-500 py-3 bg-gray-100 rounded-xl flex items-center justify-center gap-2">
                <HiOutlineClock className="w-4 h-4" /> Waiting for kitchen to prepare...
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Delivered State */}
      {order.status === 'delivered' && (
        <div className="px-4 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <HiOutlineCheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-base font-semibold text-green-700 mt-2">Delivered Successfully!</p>
            <p className="text-xs text-green-600 mt-1">Great job!</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
