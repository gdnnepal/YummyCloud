import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineMapPin, HiOutlineClock, HiOutlineArrowRightOnRectangle, HiOutlineClipboardDocumentList, HiOutlineBanknotes, HiOutlineCube, HiOutlineCog6Tooth, HiOutlineTruck } from 'react-icons/hi2';
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

  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const formatTime = (d) => new Date(d).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <header className="bg-primary text-white px-5 pt-6 pb-7 rounded-b-[28px]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-white/70 font-medium">Welcome back,</p>
            <h1 className="text-lg font-bold mt-0.5">{user.name || 'Rider'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/change-password" className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center active:scale-90 transition-transform">
              <HiOutlineCog6Tooth className="w-5 h-5" />
            </Link>
            <button onClick={handleLogout} className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center active:scale-90 transition-transform">
              <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{stats.today}</p>
                <p className="text-[10px] text-white/60 mt-0.5">Today</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{stats.active}</p>
                <p className="text-[10px] text-white/60 mt-0.5">Active</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <p className="text-xl font-bold">{stats.total}</p>
                <p className="text-[10px] text-white/60 mt-0.5">Total</p>
              </div>
            </div>
            {Number(stats.cod_to_return) > 0 && (
              <div className="mt-3 bg-white/10 border border-white/10 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-white/60">Cash to return to owner</p>
                  <p className="text-lg font-bold mt-0.5">Rs. {Number(stats.cod_to_return)}</p>
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <HiOutlineBanknotes className="w-5 h-5 text-white/70" />
                </div>
              </div>
            )}
          </>
        )}
      </header>

      {/* Active Orders */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800">Active Deliveries</h2>
          <Link to="/history" className="text-xs text-primary font-semibold flex items-center gap-1 active:scale-95 transition-transform">
            <HiOutlineClipboardDocumentList className="w-3.5 h-3.5" /> History
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)}</div>
        ) : activeOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <HiOutlineCube className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No active deliveries</p>
            <p className="text-xs text-gray-400 mt-1">New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.map((order) => (
              <Link key={order.id} to={`/orders/${order.id}`} className="block bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-[0.98] transition-transform">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${order.status === 'on_the_way' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                      <HiOutlineTruck className={`w-4 h-4 ${order.status === 'on_the_way' ? 'text-blue-600' : 'text-orange-600'}`} />
                    </div>
                    <span className="text-sm font-bold text-gray-800">#{order.order_number}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg capitalize ${
                    order.status === 'on_the_way' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                  }`}>
                    {order.status.replaceAll('_', ' ')}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-600 ml-10">
                  <HiOutlineMapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                  <span className="line-clamp-2">{order.address}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 ml-10">
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
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
