import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft, HiOutlineClock, HiOutlineClipboardDocumentList, HiOutlineCheckCircle } from 'react-icons/hi2';
import api from '../services/api';

function History() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAssignedOrders()
      .then((res) => setOrders((res.orders || []).filter((o) => o.status === 'delivered')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-3.5 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:scale-90 transition-transform">
          <HiOutlineChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-base font-bold text-gray-800">Delivery History</h1>
      </header>

      <div className="px-4 pt-4 pb-4 space-y-2.5">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <HiOutlineClipboardDocumentList className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No deliveries yet</p>
            <p className="text-xs text-gray-400 mt-1">Completed deliveries will appear here</p>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-gray-400 font-medium px-1">{orders.length} deliveries completed</p>
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <HiOutlineCheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm font-bold text-gray-800">#{order.order_number}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">Rs. {Number(order.total)}</span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1 ml-10">{order.address}</p>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-2 ml-10">
                  <HiOutlineClock className="w-3.5 h-3.5" />
                  {new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default History;
