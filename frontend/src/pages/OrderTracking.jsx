import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import {
  HiOutlineCheckCircle,
  HiOutlineFire,
  HiOutlineTruck,
  HiOutlineHome,
  HiOutlinePhone,
  HiOutlineStar,
  HiOutlineChatBubbleLeft,
  HiOutlineClock,
  HiStar,
} from 'react-icons/hi2';
import TopNav from '../components/TopNav';
import api from '../services/api';

const steps = [
  { key: 'pending', label: 'Order Placed', icon: HiOutlineClock },
  { key: 'confirmed', label: 'Confirmed', icon: HiOutlineCheckCircle },
  { key: 'preparing', label: 'Preparing', icon: HiOutlineFire },
  { key: 'on_the_way', label: 'On the Way', icon: HiOutlineTruck },
  { key: 'delivered', label: 'Delivered', icon: HiOutlineHome },
];

function OrderTracking() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [riderDistance, setRiderDistance] = useState(null);
  const [supportPhone, setSupportPhone] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const [orderRes, settingsRes] = await Promise.all([
          api.getOrder(id),
          api.getPublicSettings(),
        ]);
        setOrder(orderRes.order);
        calculateDistance(orderRes.order);
        setSupportPhone(settingsRes.settings?.support_phone || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  // Poll rider location every 15 seconds when on the way
  useEffect(() => {
    if (!order || order.status !== 'on_the_way') return;
    const interval = setInterval(async () => {
      try {
        const res = await api.getOrder(id);
        setOrder(res.order);
        calculateDistance(res.order);
      } catch (err) { console.error(err); }
    }, 15000);
    return () => clearInterval(interval);
  }, [order?.status, id]);

  const calculateDistance = (o) => {
    if (!o || !o.rider_lat || !o.customer_lat) { setRiderDistance(null); return; }
    const R = 6371000; // meters
    const dLat = (o.customer_lat - o.rider_lat) * Math.PI / 180;
    const dLng = (o.customer_lng - o.rider_lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(o.rider_lat * Math.PI / 180) * Math.cos(o.customer_lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    if (distance >= 1000) {
      setRiderDistance(`${(distance / 1000).toFixed(1)} km away`);
    } else {
      setRiderDistance(`${Math.round(distance)} m away`);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) return;
    setSubmittingRating(true);
    try {
      await api.rateOrder(id, rating, review);
      setOrder((prev) => ({ ...prev, rating: { rating, review } }));
      setShowRating(false);
    } catch (err) {
      alert(err.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) { alert('Please provide a reason'); return; }
    setCancelling(true);
    try {
      const res = await api.cancelOrder(id, cancelReason.trim());
      setOrder((prev) => ({ ...prev, status: 'cancelled' }));
      setCancelResult(res.message);
      setShowCancelConfirm(false);
      setCancelReason('');
    } catch (err) {
      setCancelResult(err.message || 'Failed to cancel order.');
      setShowCancelConfirm(false);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <>
        <TopNav title="Order Details" showBack={true} />
        <div className="px-4 pt-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <TopNav title="Order Details" showBack={true} />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-gray-500">Order not found</p>
        </div>
      </>
    );
  }

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';
  const placedAt = new Date(order.created_at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="pb-4 bg-gray-50 min-h-screen">
      <TopNav title={`Order #${order.order_number}`} showBack={true} />

      {/* Status Header */}
      <div className="px-4 pt-4">
        <div className={`rounded-2xl p-6 text-white relative overflow-hidden ${
          isDelivered ? 'bg-gradient-to-br from-green-500 to-green-700' :
          isCancelled ? 'bg-gradient-to-br from-red-500 to-red-700' :
          'bg-gradient-to-br from-primary to-primary-dark'
        }`}>
          <div className="absolute top-[-20px] right-[-20px] w-36 h-36 bg-white/5 rounded-full" />
          <div className="absolute bottom-[-15px] left-[-15px] w-24 h-24 bg-white/5 rounded-full" />
          <div className="relative z-10">
            {isDelivered ? (
              <>
                <p className="text-sm opacity-80">Order Delivered ✓</p>
                <h2 className="text-2xl font-bold mt-1">Completed</h2>
              </>
            ) : isCancelled ? (
              <>
                <p className="text-sm opacity-80">Order Cancelled</p>
                <h2 className="text-2xl font-bold mt-1">Cancelled</h2>
                {order.logs?.filter(l => l.status === 'cancelled').map(l => l.note).filter(Boolean).map((note, i) => (
                  <p key={i} className="text-xs opacity-80 mt-2 bg-white/10 rounded-lg px-3 py-1.5">{note}</p>
                ))}
              </>
            ) : (
              <>
                <p className="text-sm opacity-80">Estimated Delivery</p>
                <h2 className="text-2xl font-bold mt-1">25-30 min</h2>
              </>
            )}
            <p className="text-xs opacity-70 mt-2">Placed at {placedAt}</p>
          </div>
        </div>
      </div>

      {/* Rider Info - show when on the way */}
      {order.status === 'on_the_way' && order.delivery_partner && (
        <div className="px-4 mt-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-blue-800 uppercase">Your Delivery Partner</h3>
              {riderDistance && (
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full animate-pulse">
                  {riderDistance}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <HiOutlineTruck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{order.delivery_partner.name}</p>
                  <p className="text-xs text-gray-500">{order.delivery_partner.phone}</p>
                </div>
              </div>
              <a
                href={`tel:${order.delivery_partner.phone}`}
                className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"
              >
                <HiOutlinePhone className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Timeline - only show for active orders */}
      {!isCancelled && (
        <div className="px-4 mt-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm mb-5">Order Status</h3>
            <div className="space-y-0">
              {steps.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isLast = index === steps.length - 1;

                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isCompleted && !isCurrent
                            ? 'bg-green-100 text-green-600'
                            : isCurrent
                            ? isDelivered
                              ? 'bg-green-100 text-green-600'
                              : 'bg-primary text-white shadow-lg shadow-primary/30'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <HiOutlineCheckCircle className="w-4 h-4" />
                        ) : (
                          <step.icon className="w-4 h-4" />
                        )}
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 h-8 my-1 rounded-full ${index < currentStepIndex ? 'bg-green-300' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="pt-2">
                      <p className={`text-sm font-medium ${
                        isCompleted ? 'text-gray-800' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                      {isCurrent && !isDelivered && (
                        <p className="text-xs text-gray-500 mt-0.5">In progress...</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order - only within 3 minutes */}
      {(order.status === 'confirmed' || order.status === 'pending') && (() => {
        const orderTime = new Date(order.created_at).getTime();
        const now = Date.now();
        const threeMinutes = 3 * 60 * 1000;
        const timeLeft = threeMinutes - (now - orderTime);
        const canCancel = timeLeft > 0;
        const minutesLeft = Math.ceil(timeLeft / 60000);

        return canCancel ? (
          <div className="px-4 mt-4">
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={cancelling}
              className="w-full flex items-center justify-center gap-2 border border-red-200 bg-red-50 text-red-600 rounded-lg py-3 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              <span className="text-sm font-medium">
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </span>
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-1.5">
              You can cancel within {minutesLeft} min. Wallet refund is instant. QR payment refund takes 1 business days.
            </p>
          </div>
        ) : null;
      })()}

      {/* Rate & Review - only for delivered orders */}
      {isDelivered && (
        <div className="px-4 mt-4">
          {order.rating ? (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm mb-2">Your Rating</h3>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <HiStar
                    key={star}
                    className={`w-5 h-5 ${star <= order.rating.rating ? 'text-amber-400' : 'text-gray-200'}`}
                  />
                ))}
                <span className="text-sm text-gray-600 ml-2">{order.rating.rating}/5</span>
              </div>
              {order.rating.review && (
                <p className="text-sm text-gray-600 mt-2 italic">"{order.rating.review}"</p>
              )}
            </div>
          ) : showRating ? (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm mb-3">Rate Your Order</h3>
              
              {/* Stars */}
              <div className="flex items-center gap-2 justify-center mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="active:scale-90 transition-transform"
                  >
                    <HiStar
                      className={`w-9 h-9 ${star <= rating ? 'text-amber-400' : 'text-gray-200'}`}
                    />
                  </button>
                ))}
              </div>

              {/* Review text */}
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write a review (optional)..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none h-20 transition-colors"
              />

              {/* Submit */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowRating(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={rating === 0 || submittingRating}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-primary disabled:opacity-40 active:scale-95 transition-transform"
                >
                  {submittingRating ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowRating(true)}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-lg py-3 active:scale-[0.98] transition-transform shadow-sm"
            >
              <HiOutlineStar className="w-5 h-5" />
              <span className="text-sm font-semibold">Rate & Review this Order</span>
            </button>
          )}
        </div>
      )}

      {/* Order Details */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">Order Details</h3>
          <div className="space-y-1.5 text-sm text-gray-600">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.name} × {item.quantity}</span>
                <span>Rs. {Number(item.total)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3 space-y-1.5 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rs. {Number(order.subtotal)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Coupon Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                <span>- Rs. {Number(order.discount)}</span>
              </div>
            )}
            {Number(order.wallet_deduction) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Wallet</span>
                <span>- Rs. {Number(order.wallet_deduction)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              {Number(order.delivery_fee) > 0 ? (
                <span>Rs. {Number(order.delivery_fee)}</span>
              ) : (
                <span className="text-green-600 font-medium">FREE</span>
              )}
            </div>
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold text-gray-800 text-sm">
            <span>{t('total')}</span>
            <span>Rs. {Number(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineHome className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-gray-800 text-sm">Delivering to</h3>
          </div>
          <p className="text-sm text-gray-600">{order.address}</p>
        </div>
      </div>

      {/* Contact Support */}
      {supportPhone && (
        <div className="px-4 mt-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Need Help?</p>
            <div className="flex gap-2">
              <a
                href={`https://wa.me/977${supportPhone}`}
                target="_blank"
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-xl text-xs font-semibold active:scale-95 transition-transform"
              >
                <HiOutlineChatBubbleLeft className="w-4 h-4" /> WhatsApp
              </a>
              <a
                href={`tel:${supportPhone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-xs font-semibold active:scale-95 transition-transform"
              >
                <HiOutlinePhone className="w-4 h-4" /> Call
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Popup */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => !cancelling && setShowCancelConfirm(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-800">Cancel Order?</h3>
              <p className="text-sm text-gray-500 mt-2">
                Please tell us why you want to cancel:
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed my mind, ordered wrong items..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-3 h-20 resize-none outline-none focus:border-primary"
              />
              <div className="bg-gray-50 rounded-lg p-3 mt-3 text-left text-xs text-gray-600 space-y-1">
                <p>• Wallet amount will be refunded instantly</p>
                <p>• QR payment refund takes 1 business days</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 active:scale-95 transition-transform"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling || !cancelReason.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500 active:scale-95 transition-transform disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Result Popup */}
      {cancelResult && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCancelResult(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <div className="text-center">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiOutlineCheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Order Cancelled</h3>
              <p className="text-sm text-gray-600 mt-2">{cancelResult}</p>
            </div>
            <button
              onClick={() => setCancelResult(null)}
              className="w-full mt-5 py-2.5 rounded-lg text-sm font-medium text-white bg-primary active:scale-95 transition-transform"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderTracking;
