import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineMapPin,
  HiOutlineWallet,
  HiOutlineGlobeAlt,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChevronRight,
  HiOutlineCog6Tooth,
  HiOutlineUserCircle,
  HiOutlineEnvelope,
  HiOutlinePhone,
} from 'react-icons/hi2';
import TopNav from '../components/TopNav';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';

function Profile() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [walletBalance, setWalletBalance] = useState(null);
  const [orderCount, setOrderCount] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Fetch wallet balance and order count for profile summary
    Promise.all([
      api.getWallet().catch(() => ({ balance: 0 })),
      api.getOrders().catch(() => ({ orders: [] })),
    ]).then(([walletRes, ordersRes]) => {
      setWalletBalance(Number(walletRes.balance) || 0);
      setOrderCount((ordersRes.orders || []).length);
    });
  }, [isAuthenticated]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ne' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('lang', newLang);
  };

  if (!isAuthenticated) {
    return (
      <>
        <TopNav title={t('profile')} showBack={true} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-5">
            <HiOutlineUserCircle className="w-14 h-14 text-gray-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-1">{t('login')}</h2>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-[240px]">
            Sign in to view your profile, orders, wallet and more
          </p>
          <Link
            to="/login"
            className="bg-primary text-white px-8 py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform shadow-lg shadow-primary/25"
          >
            {t('login')}
          </Link>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="mt-8 flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-5 py-2.5 rounded-xl active:scale-95 transition-transform"
          >
            <HiOutlineGlobeAlt className="w-4 h-4" />
            {i18n.language === 'en' ? t('nepali') : t('english')}
          </button>
        </div>
      </>
    );
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const menuItems = [
    { icon: HiOutlineClipboardDocumentList, label: t('order_history'), to: '/orders', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: HiOutlineMapPin, label: t('saved_addresses'), to: '/addresses', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: HiOutlineWallet, label: t('wallet'), to: '/wallet', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: HiOutlineEnvelope, label: 'Messages', to: '/messages', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: HiOutlineCog6Tooth, label: 'Change Password', to: '/change-password', color: 'text-gray-600', bg: 'bg-gray-100' },
  ];

  return (
    <div className="pb-4 bg-gray-50 min-h-screen">
      {/* Header with gradient */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary-dark pt-12 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-[-40px] right-[-40px] w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-white/5 rounded-full" />
      </div>

      {/* Profile Card - overlapping header */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-3xl shadow-lg shadow-black/5 p-6">
          {/* Avatar + Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
              <span className="text-xl font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">{user?.name || 'User'}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <HiOutlinePhone className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-sm text-gray-500">{user?.phone || ''}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            <Link to="/orders" className="bg-gray-50 rounded-2xl p-3.5 text-center active:scale-95 transition-transform">
              <p className="text-xl font-bold text-gray-800">{orderCount !== null ? orderCount : '—'}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Total Orders</p>
            </Link>
            <Link to="/wallet" className="bg-gray-50 rounded-2xl p-3.5 text-center active:scale-95 transition-transform">
              <p className="text-xl font-bold text-gray-800">Rs. {walletBalance !== null ? walletBalance : '—'}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 font-medium">Wallet Balance</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 mt-5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">Account</p>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {menuItems.map((item, index) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3.5 px-4 py-3.5 active:bg-gray-50 transition-colors ${
                index < menuItems.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <item.icon className={`w-[18px] h-[18px] ${item.color}`} />
              </div>
              <span className="text-sm font-medium text-gray-700 flex-1">{item.label}</span>
              <HiOutlineChevronRight className="w-4 h-4 text-gray-300" />
            </Link>
          ))}
        </div>
      </div>

      {/* Preferences */}
      <div className="px-4 mt-5">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 px-1">Preferences</p>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-3.5 px-4 py-3.5 w-full active:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <HiOutlineGlobeAlt className="w-[18px] h-[18px] text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 flex-1 text-left">{t('language')}</span>
            <span className="text-xs text-primary font-semibold bg-primary/5 px-2.5 py-1 rounded-lg">
              {i18n.language === 'en' ? t('nepali') : t('english')}
            </span>
          </button>
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mt-5">
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2.5 bg-white rounded-2xl shadow-sm px-4 py-3.5 w-full active:scale-[0.98] transition-transform border border-red-50"
        >
          <HiOutlineArrowRightOnRectangle className="w-5 h-5 text-red-500" />
          <span className="text-sm font-semibold text-red-500">{t('logout')}</span>
        </button>
      </div>

      {/* App Version */}
      <p className="text-center text-[10px] text-gray-300 mt-6 mb-2">v1.0.0</p>
    </div>
  );
}

export default Profile;
