import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineMapPin, HiOutlineClock, HiOutlineArrowRightOnRectangle, HiOutlineClipboardDocumentList, HiOutlineBanknotes, HiOutlineCube } from 'react-icons/hi2';
import api from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rider-auth'))?.user || {}; }
    catch { return {}; }
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = (silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([api.getAssignedOrders(), api.getStats()])
      .then(([orderRes, statsRes]) => { setOrders(orderRes.orders || []); setStats(statsRes.stats); })
      .catch(console.error)
      .finally(() => { if (!silent) setLoading(false); });
  };

  const handleLogout = () => {
    api.logout().catch(() => {});
    localStorage.removeItem('rider-auth');
    navigate('/login');
  };

  const activeOrders = orders.filter((o) => o.status !== 'delivered');
  const formatTime = (d) => new Date(d).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-primary text-white px-4 pt-5 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs opacity-80">Hello 👋</p>
            <h1 className="text-lg font-bold">{user.name || 'Rider'}</h1>
          </div>
          <button onClick={handleLogout} className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center">
            <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
          </button>
        </div>
        {/* Stats */}
        {stats && (
          <>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{stats.today}</p>
              <p className="text-[10px] opacity-80">Today</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{stats.active}</p>
              <p className="text-[10px] opacity-80">Active</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3 text-center">
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-[10px] opacity-80">Total</p>
            </div>
          </div>
          {Number(stats.cod_to_return) > 0 && (
            <div className="mt-3 bg-white/10 border border-white/20 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] opacity-70">Cash to return to owner</p>
                <p className="text-lg font-bold">Rs. {Number(stats.cod_to_return)}</p>
              </div>
              <HiOutlineBanknotes className="w-7 h-7 opacity-70" />
            </div>
          )}
          </>
        )}
      </header>

      {/* Active Orders */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800">Active Deliveries</h2>
          <Link to="/history" className="text-xs text-primary font-medium flex items-center gap-1">
            <HiOutlineClipboardDocumentList className="w-3.5 h-3.5" /> History
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="bg-white rounded-xl h-28 animate-pulse" />)}</div>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-16">
            <HiOutlineCube className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-sm text-gray-500 mt-3">No active deliveries</p>
            <p className="text-xs text-gray-400 mt-1">New orders will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className="block bg-white rounded-xl p-4 border border-gray-100 shadow-sm active:scale-[0.98] transition-transform">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-800">#{order.order_number}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${order.status === 'on_the_way' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <HiOutlineMapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                  <span className="line-clamp-2">{order.address}</span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <HiOutlineClock className="w-3.5 h-3.5" />
                    <span>{formatTime(order.created_at)}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">Rs. {Number(order.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
