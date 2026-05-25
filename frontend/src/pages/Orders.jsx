import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HiOutlineClock, HiOutlineFunnel } from 'react-icons/hi2';
import TopNav from '../components/TopNav';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  on_the_way: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'on_the_way', label: 'On the Way' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

function Orders() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const fetchOrders = async () => {
      try {
        const res = await api.getOrders();
        setOrders(res.orders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [isAuthenticated]);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (dateFrom) {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      if (orderDate < dateFrom) return false;
    }
    if (dateTo) {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      if (orderDate > dateTo) return false;
    }
    return true;
  });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  return (
    <>
      <TopNav
        title={t('my_orders')}
        showBack={true}
        rightAction={
          orders.length > 0 ? (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <HiOutlineFunnel className="w-5 h-5 text-gray-700" />
              {activeFilterCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          ) : null
        }
      />

      {/* Filters */}
      {showFilters && (
        <div className="px-4 pt-3 pb-2 bg-white border-b border-gray-100 space-y-3">
          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Status</label>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    statusFilter === opt.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
            {(statusFilter !== 'all' || dateFrom || dateTo) && (
              <button
                onClick={() => { setStatusFilter('all'); setDateFrom(''); setDateTo(''); }}
                className="text-xs text-primary font-medium px-2 mt-4"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {!isAuthenticated ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <span className="text-6xl mb-4">📋</span>
          <p className="text-sm text-gray-500 mb-4">Login to view your orders</p>
          <Link to="/login" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm">
            {t('login')}
          </Link>
        </div>
      ) : loading ? (
        <div className="px-4 pt-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
          <span className="text-5xl mb-4">📋</span>
          <h2 className="text-base font-semibold text-gray-800 mb-1">
            {orders.length === 0 ? 'No orders yet' : 'No matching orders'}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {orders.length === 0 ? 'Place your first order!' : 'Try changing the filters'}
          </p>
          {orders.length === 0 && (
            <Link to="/menu" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm">
              {t('explore_menu')}
            </Link>
          )}
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-3 pb-4">
          {filteredOrders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-800">#{order.order_number}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                  {order.status.replaceAll('_', ' ')}
                </span>
              </div>
              <div className="text-xs text-gray-500 space-y-0.5">
                {order.items?.slice(0, 2).map((item) => (
                  <p key={item.id}>{item.name} × {item.quantity}</p>
                ))}
                {order.items?.length > 2 && (
                  <p className="text-gray-400">+{order.items.length - 2} more items</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <HiOutlineClock className="w-3.5 h-3.5" />
                  <span>{formatDate(order.created_at)}</span>
                </div>
                <span className="text-sm font-bold text-gray-800">Rs. {Number(order.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

export default Orders;
