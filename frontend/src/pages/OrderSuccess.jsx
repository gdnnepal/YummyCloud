import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HiOutlineCheckCircle } from 'react-icons/hi2';

function OrderSuccess() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
        <HiOutlineCheckCircle className="w-16 h-16 text-green-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('order_placed')}</h1>
      <p className="text-sm text-gray-500 mb-8">
        Your order has been placed successfully. You can track it from orders page.
      </p>
      <div className="flex gap-3">
        <Link
          to="/orders"
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm active:scale-95 transition-transform shadow-lg shadow-primary/25"
        >
          {t('track_order')}
        </Link>
        <Link
          to="/"
          className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-medium text-sm active:scale-95 transition-transform"
        >
          {t('home')}
        </Link>
      </div>
    </div>
  );
}

export default OrderSuccess;
