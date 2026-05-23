import { useState, useEffect } from 'react';
import api from '../services/api';

function Refunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRefunds()
      .then((res) => setRefunds(res.refunds || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleProcess = async (id, status) => {
    const note = prompt('Admin note (optional):') || '';
    try {
      await api.processRefund(id, status, note);
      setRefunds(refunds.map((r) =>
        r.id === id ? { ...r, status, admin_note: note } : r
      ));
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">Refunds</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : refunds.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No refunds</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {refunds.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">
                    #{r.order?.order_number}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {r.user?.name}
                  </td>
                  <td className="px-4 py-3 text-center capitalize">
                    {r.type.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    Rs. {Number(r.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      r.status === 'completed' ? 'bg-green-100 text-green-700' :
                      r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.status === 'pending' && (
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleProcess(r.id, 'completed')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Approve</button>
                        <button onClick={() => handleProcess(r.id, 'rejected')} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Refunds;
