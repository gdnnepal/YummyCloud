import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft, HiOutlineClock, HiOutlineClipboardDocumentList } from 'react-icons/hi2';
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
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <HiOutlineChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-base font-bold text-gray-800">Delivery History</h1>
      </header>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />)
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <HiOutlineClipboardDocumentList className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-sm text-gray-500 mt-3">No deliveries yet</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-gray-800">#{order.order_number}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Delivered</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-1">{order.address}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <HiOutlineClock className="w-3.5 h-3.5" />
                  {new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>
                <span className="text-sm font-bold">Rs. {Number(order.total)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default History;
