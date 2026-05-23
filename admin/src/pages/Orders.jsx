import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Pagination from '../components/Pagination';
import DateInput from '../components/DateInput';
import CustomerFilter from '../components/CustomerFilter';

const statusColors = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700', preparing: 'bg-orange-100 text-orange-700', on_the_way: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
const nextStatus = { confirmed: 'preparing', preparing: 'on_the_way', on_the_way: 'delivered' };
const PER_PAGE = 10;

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');

  useEffect(() => {
    api.getUsers().then((res) => setCustomers(res.users || [])).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [filter, dateFrom, dateTo, selectedCustomer]);

  // Poll every 15 seconds (only updates table data, not UI state)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [filter, dateFrom, dateTo, selectedCustomer]);

  const fetchOrders = (silent = false) => {
    if (!silent) setLoading(true);
    let params = filter !== 'all' ? `?status=${filter}` : '?';
    if (dateFrom) params += `&from=${dateFrom}`;
    if (dateTo) params += `&to=${dateTo}`;
    if (selectedCustomer) params += `&user_id=${selectedCustomer.id}`;
    api.getOrders(params)
      .then((res) => {
        const newOrders = res.orders || [];
        // Check for new orders (notify)
        if (silent && newOrders.length > orders.length) {
          const diff = newOrders.length - orders.length;
          document.title = `(${diff} new) Orders - CloudKitchen`;
          // Play notification sound
          try { new Audio('data:audio/wav;base64,UklGRl9vT19teleVBQAIABAAEAABABAAEAAQABAAEA==').play(); } catch {}
        }
        setOrders(newOrders);
        if (!silent) setPage(1);
      })
      .catch(console.error)
      .finally(() => { if (!silent) setLoading(false); });
  };

  const filteredOrders = orderSearch
    ? orders.filter((o) => o.order_number.toLowerCase().includes(orderSearch.toLowerCase()))
    : orders;
  const totalPages = Math.ceil(filteredOrders.length / PER_PAGE);
  const paginatedOrders = filteredOrders.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const [updatingId, setUpdatingId] = useState(null);

  const handleQuickStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await api.updateOrderStatus(orderId, status);
      setOrders(orders.map((o) => o.id === orderId ? { ...o, status } : o));
    } catch (err) { alert(err.message); }
    finally { setUpdatingId(null); }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">Orders</h1>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {['all', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap capitalize ${filter === s ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
        <div className="flex items-center gap-3 ml-auto">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" value={orderSearch} onChange={(e) => { setOrderSearch(e.target.value); setPage(1); }} placeholder="Order ID..." className="border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs w-36 outline-none focus:border-primary bg-white" />
          </div>
          <DateInput value={dateFrom} onChange={setDateFrom} label="From" />
          <DateInput value={dateTo} onChange={setDateTo} label="To" />
          <CustomerFilter
            customers={customers}
            selectedCustomer={selectedCustomer}
            onSelect={setSelectedCustomer}
            onClear={() => setSelectedCustomer(null)}
          />
          {(dateFrom || dateTo || selectedCustomer) && <button onClick={() => { setDateFrom(''); setDateTo(''); setSelectedCustomer(null); }} className="text-xs text-primary font-medium mt-4">Clear</button>}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : orders.length === 0 ? <div className="p-8 text-center text-gray-400">No orders</div> : (
          <>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className={`hover:bg-gray-50 ${order.status === 'confirmed' ? 'animate-pulse bg-red-200' : ''}`}>
                  <td className="px-4 py-3">
                    <Link to={`/orders/${order.id}`} className="font-medium text-primary">#{order.order_number}</Link>
                    <p className="text-[10px] text-gray-400">{new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.user?.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[order.status]}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">Rs. {Number(order.total)}</td>
                  <td className="px-4 py-3 text-center">
                    {nextStatus[order.status] ? (
                      <button
                        onClick={() => handleQuickStatus(order.id, nextStatus[order.status])}
                        disabled={updatingId === order.id}
                        className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium hover:bg-primary/20 transition-colors capitalize disabled:opacity-50"
                      >
                        {updatingId === order.id ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            Updating
                          </span>
                        ) : (
                          `→ ${nextStatus[order.status].replace('_', ' ')}`
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

export default Orders;
