import { useState } from 'react';
import { HiOutlineUser, HiOutlineXMark } from 'react-icons/hi2';

function CustomerFilter({ customers, selectedCustomer, onSelect, onClear }) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <div>
      <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Customer</label>
      <div className="relative">
        <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        {selectedCustomer ? (
          <div className="flex items-center border border-gray-200 rounded-lg pl-9 pr-2 py-2 bg-white min-w-[180px] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
            <span className="text-sm text-gray-700 truncate flex-1">{selectedCustomer.name}</span>
            <button onClick={onClear} className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-50 shrink-0 ml-1">
              <HiOutlineXMark className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        ) : (
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="All customers"
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white min-w-[180px]"
          />
        )}
        {showDropdown && search && !selectedCustomer && (
          <div className="absolute top-full mt-1 left-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-44 overflow-y-auto">
            {filtered.slice(0, 6).map((c) => (
              <button
                key={c.id}
                onMouseDown={() => { onSelect(c); setSearch(''); setShowDropdown(false); }}
                className="w-full text-left px-3 py-2.5 text-xs hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
              >
                <span className="font-medium text-gray-700">{c.name}</span>
                <span className="text-gray-400">{c.phone}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2.5 text-xs text-gray-400">No customers found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerFilter;
