import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HiOutlineTrash, HiMinus, HiPlus } from 'react-icons/hi2';
import TopNav from '../components/TopNav';
import useCartStore from '../store/useCartStore';

function Cart() {
  const { t, i18n } = useTranslation();
  const isNepali = i18n.language === 'ne';
  const { items, updateQuantity, clearCart, getTotal } = useCartStore();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <>
        <TopNav title={t('cart')} showBack={true} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <span className="text-6xl mb-4">🛒</span>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">{t('no_items')}</h2>
          <Link
            to="/menu"
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm mt-4 active:scale-95 transition-transform"
          >
            {t('explore_menu')}
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="pb-28">
      <TopNav
        title={t('cart')}
        showBack={true}
        rightAction={
          <button
            onClick={clearCart}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50"
          >
            <HiOutlineTrash className="w-5 h-5 text-red-500" />
          </button>
        }
      />

      {/* Cart Items */}
      <div className="px-4 pt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100"
          >
            <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
              {item.image ? (
                <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${item.image}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">🍽️</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-800 text-sm truncate">
                {isNepali ? item.nameNe : item.name}
              </h3>
              <p className="text-sm font-bold text-primary mt-1">
                Rs. {item.price * item.quantity}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 active:scale-90 transition-transform"
              >
                <HiMinus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-semibold w-5 text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-7 h-7 rounded-lg bg-primary text-white shadow-sm flex items-center justify-center active:scale-90 transition-transform"
              >
                <HiPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bill Details */}
      <div className="px-4 mt-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Bill Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Item Total</span>
              <span>Rs. {total}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span className="text-green-600 font-medium">Calculated at checkout</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-800">
              <span>{t('total')}</span>
              <span>Rs. {total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Button - Fixed Bottom */}
      <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-white/90 backdrop-blur-md border-t border-gray-100">
        <div className="max-w-lg mx-auto">
          <Link
            to="/checkout"
            className="block w-full bg-primary text-white text-center py-3.5 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform shadow-lg shadow-primary/25"
          >
            {t('checkout')} • Rs. {total}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Cart;
