import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineShoppingBag, HiOutlineCurrencyDollar, HiOutlineUsers, HiOutlineClipboardDocumentList } from 'react-icons/hi2';
import api from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('today');

  useEffect(() => {
    setLoading(true);
    api.getDashboard(`?period=${period}`).then(setStats).catch(console.error).finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl h-28 animate-pulse" />)}</div>;

  const cards = [
    { label: 'Total Orders', value: stats?.total_orders || 0, icon: HiOutlineShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: `Revenue (${period})`, value: `Rs. ${stats?.total_revenue || 0}`, icon: HiOutlineCurrencyDollar, color: 'bg-green-50 text-green-600' },
    { label: 'Customers', value: stats?.total_customers || 0, icon: HiOutlineUsers, color: 'bg-purple-50 text-purple-600' },
    { label: 'Pending Orders', value: stats?.pending_orders || 0, icon: HiOutlineClipboardDocumentList, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {['today', 'week', 'month'].map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${period === p ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-4 border border-gray-100">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Recent Orders</h2>
          <Link to="/orders" className="text-xs text-primary font-medium">View All</Link>
        </div>
        <div className="space-y-2">
          {(stats?.recent_orders || []).map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">#{order.order_number}</p>
                <p className="text-xs text-gray-500">{order.user?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">Rs. {Number(order.total)}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
