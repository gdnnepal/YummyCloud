import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Pagination from '../components/Pagination';
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

  useEffect(() => {
    const interval = setInterval(() => { fetchOrders(true); }, 15000);
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
        if (silent && newOrders.length > orders.length) {
          const diff = newOrders.length - orders.length;
          document.title = `(${diff} new) Orders`;
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

  const statusTabs = [
    { key: 'all', label: 'All Orders' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'on_the_way', label: 'On The Way' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">Orders</h1>
        <span className="text-sm text-gray-500">{filteredOrders.length} total</span>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" value={orderSearch} onChange={(e) => { setOrderSearch(e.target.value); setPage(1); }} placeholder="Search order..." className="border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm w-44 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-gray-50" />
          </div>

          <div className="h-8 w-px bg-gray-200 hidden sm:block" />

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-gray-50" />
            <span className="text-gray-400 text-xs">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary bg-gray-50" />
          </div>

          <div className="h-8 w-px bg-gray-200 hidden sm:block" />

          {/* Customer Filter */}
          <CustomerFilter
            customers={customers}
            selectedCustomer={selectedCustomer}
            onSelect={setSelectedCustomer}
            onClear={() => setSelectedCustomer(null)}
          />

          {(dateFrom || dateTo || selectedCustomer || orderSearch) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setSelectedCustomer(null); setOrderSearch(''); }} className="text-xs text-primary font-medium hover:underline">
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {statusTabs.map((s) => (
          <button key={s.key} onClick={() => setFilter(s.key)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === s.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-sm text-gray-400">No orders found</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Order</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${order.status === 'confirmed' ? 'bg-red-50/50' : ''}`}>
                    <td className="px-5 py-3.5">
                      <Link to={`/orders/${order.id}`} className="font-semibold text-primary hover:underline text-sm">#{order.order_number}</Link>
                      <p className="text-[11px] text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-gray-700 font-medium">{order.user?.name}</p>
                      <p className="text-[11px] text-gray-400">{order.user?.phone}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusColors[order.status]}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-semibold text-gray-800">Rs. {Number(order.total)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {nextStatus[order.status] ? (
                        <button
                          onClick={() => handleQuickStatus(order.id, nextStatus[order.status])}
                          disabled={updatingId === order.id}
                          className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-medium hover:bg-primary/90 transition-colors capitalize disabled:opacity-50"
                        >
                          {updatingId === order.id ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            </span>
                          ) : (
                            `${nextStatus[order.status].replace('_', ' ')}`
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
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
