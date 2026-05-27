import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HiOutlineTrash, HiMinus, HiPlus, HiOutlineShoppingCart } from 'react-icons/hi2';
import TopNav from '../components/TopNav';
import useCartStore from '../store/useCartStore';

function Cart() {
  const { t, i18n } = useTranslation();
  const isNepali = i18n.language === 'ne';
  const { items, updateQuantity, clearCart, getTotal, getItemCount } = useCartStore();
  const total = getTotal();
  const itemCount = getItemCount();

  if (items.length === 0) {
    return (
      <>
        <TopNav title={t('cart')} showBack={true} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-5">
            <HiOutlineShoppingCart className="w-12 h-12 text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">{t('no_items')}</h2>
          <p className="text-sm text-gray-500 mb-6 text-center">Add items from the menu to get started</p>
          <Link
            to="/menu"
            className="bg-primary text-white px-8 py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform shadow-lg shadow-primary/25"
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
        title={`${t('cart')} (${itemCount})`}
        showBack={true}
        rightAction={
          <button
            onClick={clearCart}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-50 active:scale-90 transition-transform"
          >
            <HiOutlineTrash className="w-5 h-5 text-red-500" />
          </button>
        }
      />

      {/* Cart Items */}
      <div className="px-4 pt-4 space-y-2.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100"
          >
            <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
              {item.image ? (
                <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${item.image}`} alt="" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-12.75H6A2.25 2.25 0 003.75 6v12a2.25 2.25 0 002.25 2.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75z" /></svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-800 text-sm truncate">
                {isNepali ? item.nameNe : item.name}
              </h3>
              <p className="text-sm font-bold text-gray-900 mt-1">
                Rs. {item.price * item.quantity}
                {item.quantity > 1 && <span className="text-xs text-gray-400 font-normal ml-1">({item.price} each)</span>}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl p-1">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 active:scale-90 transition-transform border border-gray-100"
              >
                <HiMinus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-bold w-6 text-center text-gray-800">
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
      <div className="px-4 mt-5">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">Bill Summary</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Item Total ({itemCount} items)</span>
              <span className="font-medium text-gray-800">Rs. {total}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span className="text-xs text-gray-400 font-medium">At checkout</span>
            </div>
            <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-gray-900">
              <span>Subtotal</span>
              <span className="text-primary">Rs. {total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Button - Fixed Bottom */}
      <div className="fixed bottom-20 left-0 right-0 px-4 py-3 bg-white/95 backdrop-blur-md border-t border-gray-100">
        <div className="max-w-lg mx-auto">
          <Link
            to="/checkout"
            className="flex items-center justify-between w-full bg-primary text-white px-6 py-3.5 rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform shadow-lg shadow-primary/25"
          >
            <span>{t('checkout')}</span>
            <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">Rs. {total}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Cart;
