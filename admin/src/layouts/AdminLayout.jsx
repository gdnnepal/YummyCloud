import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineHome, HiOutlineClipboardDocumentList, HiOutlineSquares2X2, HiOutlineTag, HiOutlineUsers, HiOutlineChatBubbleLeft, HiOutlineBanknotes, HiOutlineArrowRightOnRectangle, HiOutlineBars3, HiOutlineChartBar, HiOutlineTruck, HiOutlineCog6Tooth, HiOutlineStar, HiOutlineWallet } from 'react-icons/hi2';
import { useState, useEffect } from 'react';

const navItems = [
  { to: '/', icon: HiOutlineHome, label: 'Dashboard', end: true },
  { to: '/orders', icon: HiOutlineClipboardDocumentList, label: 'Orders' },
  { to: '/menu', icon: HiOutlineSquares2X2, label: 'Menu' },
  { to: '/categories', icon: HiOutlineSquares2X2, label: 'Categories' },
  { to: '/coupons', icon: HiOutlineTag, label: 'Coupons' },
  { to: '/users', icon: HiOutlineUsers, label: 'Customers' },
  { to: '/wallets', icon: HiOutlineWallet, label: 'Wallets' },
  { to: '/delivery-partners', icon: HiOutlineTruck, label: 'Delivery Partners' },
  { to: '/messages', icon: HiOutlineChatBubbleLeft, label: 'Messages' },
  { to: '/refunds', icon: HiOutlineBanknotes, label: 'Refunds' },
  { to: '/reviews', icon: HiOutlineStar, label: 'Reviews' },
  { to: '/sales', icon: HiOutlineChartBar, label: 'Sales Report' },
  { to: '/settings', icon: HiOutlineCog6Tooth, label: 'Settings' },
];

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [kitchenName, setKitchenName] = useState('CloudKitchen');
  const [licenseToast, setLicenseToast] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      setLicenseToast(e.detail || 'License inactive. Please activate in Settings > License.');
      setTimeout(() => setLicenseToast(null), 6000);
    };
    window.addEventListener('license-error', handler);
    return () => window.removeEventListener('license-error', handler);
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '')}/api/settings/public`)
      .then(r => r.json())
      .then(res => { if (res.settings?.kitchen_name) setKitchenName(res.settings.kitchen_name); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const titles = { '/': 'Dashboard', '/orders': 'Orders', '/menu': 'Menu Items', '/categories': 'Categories', '/coupons': 'Coupons', '/users': 'Customers', '/delivery-partners': 'Delivery Partners', '/messages': 'Messages', '/refunds': 'Refunds', '/reviews': 'Reviews', '/sales': 'Sales Report', '/settings': 'Settings' };
    const title = titles[location.pathname] || 'Admin';
    document.title = `${title} - ${kitchenName} Admin`;
  }, [location.pathname, kitchenName]);

  const handleLogout = () => {
    localStorage.removeItem('admin-auth');
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 lg:relative lg:inset-auto overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-5 h-16 border-b border-gray-100">
          <span className="text-2xl"></span>
          <h1 className="text-lg font-bold text-gray-800">{kitchenName}</h1>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
          <NavLink to="/change-password" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'text-primary bg-primary/10' : 'text-gray-600 hover:bg-gray-100'} mb-1`}>
            <HiOutlineCog6Tooth className="w-5 h-5" /> Change Password
          </NavLink>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 w-full">
            <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3">
            <HiOutlineBars3 className="w-6 h-6 text-gray-700" />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">Admin Panel</h2>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* License Error Toast */}
      {licenseToast && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm animate-slide-in">
          <div className="bg-red-600 text-white px-5 py-4 rounded-xl shadow-2xl flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="font-semibold text-sm">License Error</p>
              <p className="text-xs text-red-100 mt-0.5">{licenseToast}</p>
            </div>
            <button onClick={() => setLicenseToast(null)} className="ml-auto text-red-200 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;
