import { HiOutlineCalendarDays } from 'react-icons/hi2';

function DateInput({ value, onChange, placeholder = 'Select date', label }) {
  return (
    <div>
      {label && <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">{label}</label>}
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white appearance-none cursor-pointer"
        />
        <HiOutlineCalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

export default DateInput;
