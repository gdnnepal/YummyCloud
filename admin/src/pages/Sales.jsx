import { useState, useEffect } from 'react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import DateInput from '../components/DateInput';
import CustomerFilter from '../components/CustomerFilter';

const PER_PAGE = 10;

function Sales() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    api.getUsers().then((res) => setCustomers(res.users || [])).catch(console.error);
    fetchReport();
  }, []);

  const fetchReport = () => {
    setLoading(true);
    let params = '?';
    if (dateFrom) params += `from=${dateFrom}&`;
    if (dateTo) params += `to=${dateTo}&`;
    if (selectedCustomer) params += `user_id=${selectedCustomer.id}&`;
    api.request(`/admin/sales-report${params}`)
      .then(setData).catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReport();
  };

  const [orderSearch, setOrderSearch] = useState('');

  const orders = data?.orders || [];
  const filteredSalesOrders = orderSearch
    ? orders.filter((o) => o.order_number.toLowerCase().includes(orderSearch.toLowerCase()))
    : orders;
  const totalPages = Math.ceil(filteredSalesOrders.length / PER_PAGE);
  const paginatedOrders = filteredSalesOrders.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const formatDateTime = (d) =>
    new Date(d).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">Sales Report</h1>
      <div className="mb-3">
        <input type="text" value={orderSearch} onChange={(e) => { setOrderSearch(e.target.value); setPage(1); }} placeholder="Search by Order ID..." className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full max-w-xs outline-none focus:border-primary" />
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} className="flex flex-wrap gap-3 items-end mb-6">
        <DateInput value={dateFrom} onChange={setDateFrom} label="From" />
        <DateInput value={dateTo} onChange={setDateTo} label="To" />

        <CustomerFilter
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelect={setSelectedCustomer}
          onClear={() => setSelectedCustomer(null)}
        />

        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium">Apply</button>
        {(dateFrom || dateTo || selectedCustomer) && (
          <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); setSelectedCustomer(null); setTimeout(fetchReport, 0); }} className="text-sm text-primary font-medium">Clear</button>
        )}
      </form>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />)}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{data?.total_orders || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600 mt-1">Rs. {data?.total_revenue || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">Rs. {data?.avg_order_value || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500">Total Discounts</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">Rs. {data?.total_discount || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-right">Discount</th>
                  <th className="px-4 py-3 text-right">Wallet</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3 font-medium">#{order.order_number}</td>
                    <td className="px-4 py-3 text-gray-600">{order.user?.name || '—'}</td>
                    <td className="px-4 py-3 text-right">Rs. {Number(order.subtotal)}</td>
                    <td className="px-4 py-3 text-right text-green-600">{Number(order.discount) > 0 ? `-Rs. ${Number(order.discount)}` : '—'}</td>
                    <td className="px-4 py-3 text-right text-green-600">{Number(order.wallet_deduction) > 0 ? `-Rs. ${Number(order.wallet_deduction)}` : '—'}</td>
                    <td className="px-4 py-3 text-right font-bold">Rs. {Number(order.total)}</td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">{formatDateTime(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}

export default Sales;
