import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import {
  HiOutlineMapPin,
  HiOutlineCreditCard,
  HiOutlineDocumentText,
  HiOutlineChevronRight,
  HiOutlineHome,
  HiOutlineBriefcase,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineTicket,
} from 'react-icons/hi2';
import TopNav from '../components/TopNav';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import useAddressStore from '../store/useAddressStore';
import api from '../services/api';

function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { addresses, getDefault, setAddresses } = useAddressStore();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [useWallet, setUseWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [kitchenSettings, setKitchenSettings] = useState({});

  const total = getTotal();
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const fee = deliveryFee || 0;
  const feeMandatory = kitchenSettings.delivery_fee_mandatory === 'true';
  // If delivery fee is mandatory: wallet/coupon only cover items, fee always charged separately
  // If not mandatory: wallet/coupon can cover everything including fee
  const walletDeduction = useWallet
    ? feeMandatory
      ? Math.min(walletBalance, Math.max(0, total - discount))
      : Math.min(walletBalance, total - discount + fee)
    : 0;
  const finalTotal = feeMandatory
    ? Math.max(0, total - discount) - walletDeduction + fee
    : total - discount + fee - walletDeduction;

  useEffect(() => {
    if (items.length === 0 && !orderSuccess) {
      navigate('/cart', { replace: true });
    }
  }, [items.length, navigate, orderSuccess]);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!isAuthenticated) return;
      try {
        const [addrRes, walletRes] = await Promise.all([
          api.getAddresses(),
          api.getWallet(),
        ]);
        setAddresses(addrRes.addresses || []);
        setWalletBalance(Number(walletRes.balance) || 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAddresses();
  }, [isAuthenticated]);

  useEffect(() => {
    api.getPublicSettings().then((res) => {
      const s = res.settings || {};
      setDeliveryFee(Number(s.delivery_fee) || 0);
      setKitchenSettings(s);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const defaultAddr = getDefault();
    if (defaultAddr) {
      setSelectedAddress(defaultAddr);
    }
  }, [addresses]);

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode.trim()) return;
    try {
      const res = await api.validateCoupon(couponCode.trim(), total);
      setAppliedCoupon({
        code: res.coupon.code,
        percent: res.coupon.type === 'percent' ? res.coupon.value : 0,
        discount: res.coupon.discount,
        label: res.coupon.description || `${res.coupon.value}${res.coupon.type === 'percent' ? '%' : ' Rs.'} OFF`,
      });
      setCouponError('');
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!selectedAddress) return;
    setLoading(true);

    // Get current GPS location (mandatory)
    let customerLat = selectedAddress.latitude || null;
    let customerLng = selectedAddress.longitude || null;

    if (!customerLat && navigator.geolocation) {
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        customerLat = pos.coords.latitude;
        customerLng = pos.coords.longitude;
      } catch (e) {
        setLoading(false);
        alert('Location access is required to place an order. Please enable GPS/Location in your device settings and try again.');
        return;
      }
    }

    if (!customerLat || !customerLng) {
      setLoading(false);
      alert('Location access is required to place an order. Please enable GPS/Location in your device settings and try again.');
      return;
    }

    try {
      const orderData = {
        items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
        address: `${selectedAddress.label}: ${selectedAddress.address}${selectedAddress.detail ? ', ' + selectedAddress.detail : ''}`,
        customer_lat: customerLat,
        customer_lng: customerLng,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code || null,
        note: note || null,
        use_wallet: useWallet,
        payment_screenshot: paymentScreenshot || null,
      };
      await api.placeOrder(orderData);
      clearCart();
      setOrderSuccess(true);
      setTimeout(() => {
        navigate('/orders', { replace: true });
      }, 2500);
    } catch (err) {
      alert(err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !orderSuccess) return null;

  return (
    <div className="pb-28">
      <TopNav title={t('checkout')} showBack={true} />

      {/* Delivery Address */}
      <div className="px-4 pt-4 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HiOutlineMapPin className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-gray-800 text-sm">{t('address')}</h3>
            </div>
            <button
              onClick={() => setShowAddressPicker(true)}
              className="text-xs text-primary font-semibold flex items-center gap-0.5"
            >
              Change
              <HiOutlineChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {selectedAddress ? (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                {selectedAddress.icon === 'home' ? (
                  <HiOutlineHome className="w-4 h-4 text-primary" />
                ) : (
                  <HiOutlineBriefcase className="w-4 h-4 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{selectedAddress.label}</p>
                <p className="text-xs text-gray-600 mt-0.5">{selectedAddress.address}</p>
                <p className="text-xs text-gray-500">{selectedAddress.detail}</p>
              </div>
            </div>
          ) : (
            <Link
              to="/addresses"
              className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500"
            >
              <HiOutlineMapPin className="w-4 h-4" />
              Add a delivery address
            </Link>
          )}
        </div>
      </div>

      {/* Order Note */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <HiOutlineDocumentText className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-gray-800 text-sm">Note (optional)</h3>
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any special instructions..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Payment Method */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineCreditCard className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-gray-800 text-sm">{t('payment')}</h3>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-red-50 transition-colors">
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="accent-primary"
              />
              <span className="text-sm text-gray-700">{t('cod')}</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-red-50 transition-colors">
              <input
                type="radio"
                name="payment"
                value="qr"
                checked={paymentMethod === 'qr'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="accent-primary"
              />
              <span className="text-sm text-gray-700">{t('qr_payment')}</span>
            </label>
          </div>

          {/* QR Screenshot Upload */}
          {paymentMethod === 'qr' && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-600 mb-2">
                Pay via QR code and upload the screenshot:
              </p>
              {/* Placeholder QR - replace with your actual QR image */}
              <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200 text-center">
                {kitchenSettings.qr_image ? (
                  <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${kitchenSettings.qr_image}`} alt="QR Code" className="w-40 h-40 mx-auto rounded-lg object-contain" />
                ) : (
                  <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center text-3xl">
                    📱
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">{kitchenSettings.qr_payment_info || `Scan to pay Rs. ${finalTotal}`}</p>
              </div>

              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-3 cursor-pointer hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setPaymentScreenshot(file);
                      setScreenshotPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                {screenshotPreview ? (
                  <div className="flex items-center gap-2">
                    <img src={screenshotPreview} alt="Screenshot" className="w-10 h-10 rounded-lg object-cover" />
                    <span className="text-xs text-green-600 font-medium">Screenshot uploaded ✓</span>
                  </div>
                ) : (
                  <>
                    <span className="text-lg">📷</span>
                    <span className="text-xs text-gray-600 font-medium">Upload Payment Screenshot</span>
                  </>
                )}
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Balance */}
      {walletBalance > 0 && (
        <div className="px-4 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Use Wallet Balance</p>
                  <p className="text-xs text-gray-500">Available: Rs. {walletBalance}</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={useWallet}
                  onChange={(e) => setUseWallet(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-checked:bg-primary rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-5 transition-transform" />
              </div>
            </label>
            {useWallet && (
              <p className="text-xs text-green-600 mt-2 ml-12">
                -Rs. {walletDeduction} will be deducted from wallet
              </p>
            )}
          </div>
        </div>
      )}

      {/* Coupon Code */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <HiOutlineTicket className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-gray-800 text-sm">{t('apply_coupon')}</h3>
          </div>

          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <HiOutlineTicket className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-700">{appliedCoupon.code}</p>
                  <p className="text-xs text-green-600">{appliedCoupon.label} applied</p>
                </div>
              </div>
              <button
                onClick={handleRemoveCoupon}
                className="text-xs text-red-500 font-semibold px-2 py-1 rounded-lg bg-red-50"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                  placeholder="Enter coupon code"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors uppercase font-medium tracking-wide"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim()}
                  className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 active:scale-95 transition-transform"
                >
                  Apply
                </button>
              </div>
              {couponError && (
                <p className="text-xs text-red-500 mt-1.5 ml-1">{couponError}</p>
              )}
              <p className="text-xs text-gray-400 mt-2 ml-1">Try: FIRST20, SAVE10</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Summary */}
      <div className="px-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm mb-3">Order Summary</h3>
          <div className="space-y-1.5 text-sm text-gray-600">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>{item.name} × {item.quantity}</span>
                <span>Rs. {item.price * item.quantity}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              {deliveryFee === null ? (
                <span className="w-3 h-3 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
              ) : deliveryFee > 0 ? (
                <span>Rs. {deliveryFee}</span>
              ) : (
                <span className="text-green-600 font-medium">FREE</span>
              )}
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-green-600">
                <span>Coupon ({appliedCoupon.code})</span>
                <span>- Rs. {discount}</span>
              </div>
            )}
            {useWallet && walletDeduction > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Wallet</span>
                <span>- Rs. {walletDeduction}</span>
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between font-bold text-gray-800">
            <span>{t('total')}</span>
            <span>Rs. {finalTotal}</span>
          </div>
        </div>
      </div>

      {/* Place Order Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-white/90 backdrop-blur-md border-t border-gray-100">
        <div className="max-w-lg mx-auto">
          {kitchenSettings.min_order_amount && total < Number(kitchenSettings.min_order_amount) && !items.some(i => i.isReward) && (
            <p className="text-xs text-red-500 text-center mb-2">Minimum order amount is Rs. {kitchenSettings.min_order_amount}. Add Rs. {Number(kitchenSettings.min_order_amount) - total} more.</p>
          )}
          <button
            onClick={handlePlaceOrder}
            disabled={!selectedAddress || loading || (kitchenSettings.min_order_amount && total < Number(kitchenSettings.min_order_amount) && !items.some(i => i.isReward))}
            className="w-full bg-primary text-white py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-transform shadow-lg shadow-primary/25"
          >
            {loading ? 'Placing Order...' : `${t('place_order')} • Rs. ${finalTotal}`}
          </button>
        </div>
      </div>

      {/* Address Picker Bottom Sheet */}
      {showAddressPicker && (
        <div className="fixed inset-0 z-[100] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddressPicker(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl p-5 animate-slide-up max-h-[70vh] overflow-y-auto">
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Select Address</h3>
              <button
                onClick={() => setShowAddressPicker(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <HiOutlineXMark className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-3">No saved addresses</p>
                <Link
                  to="/addresses"
                  className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium inline-block"
                >
                  Add Address
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddress(addr);
                      setShowAddressPicker(false);
                    }}
                    className={`w-full flex items-start gap-3 p-3.5 rounded-2xl border transition-colors text-left ${
                      selectedAddress?.id === addr.id
                        ? 'border-primary bg-red-50/50'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      selectedAddress?.id === addr.id ? 'bg-primary/10' : 'bg-gray-100'
                    }`}>
                      {addr.icon === 'home' ? (
                        <HiOutlineHome className={`w-4 h-4 ${selectedAddress?.id === addr.id ? 'text-primary' : 'text-gray-500'}`} />
                      ) : (
                        <HiOutlineBriefcase className={`w-4 h-4 ${selectedAddress?.id === addr.id ? 'text-primary' : 'text-gray-500'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">{addr.label}</p>
                        {addr.isDefault && (
                          <span className="text-[9px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded-full">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{addr.address}</p>
                      <p className="text-xs text-gray-500">{addr.detail}</p>
                    </div>
                    {selectedAddress?.id === addr.id && (
                      <HiOutlineCheckCircle className="w-5 h-5 text-primary shrink-0 mt-1" />
                    )}
                  </button>
                ))}

                {/* Add new address link */}
                <Link
                  to="/addresses"
                  className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-500 font-medium mt-2"
                >
                  + Add New Address
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Order Success Overlay */}
      {orderSuccess && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center animate-fade-in">
          <div className="animate-success-bounce">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-green-500 animate-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-6">Order Placed!</h2>
          <p className="text-sm text-gray-500 mt-2">Your food is being prepared 🎉</p>
          <p className="text-xs text-gray-400 mt-4">Redirecting to orders...</p>
        </div>
      )}
    </div>
  );
}

export default Checkout;
