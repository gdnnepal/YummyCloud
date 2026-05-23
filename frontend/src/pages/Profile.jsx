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
} from 'react-icons/hi2';
import TopNav from '../components/TopNav';
import useAuthStore from '../store/useAuthStore';

function Profile() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuthStore();

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
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-4xl">👤</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">{t('login')}</h2>
          <p className="text-sm text-gray-500 mb-6 text-center">
            Login to view your profile, orders and more
          </p>
          <Link
            to="/login"
            className="bg-primary text-white px-8 py-2.5 rounded-xl font-medium text-sm active:scale-95 transition-transform"
          >
            {t('login')}
          </Link>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="mt-6 flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl"
          >
            <HiOutlineGlobeAlt className="w-4 h-4" />
            {i18n.language === 'en' ? t('nepali') : t('english')}
          </button>
        </div>
      </>
    );
  }

  const menuItems = [
    { icon: HiOutlineClipboardDocumentList, label: t('order_history'), to: '/orders' },
    { icon: HiOutlineMapPin, label: t('saved_addresses'), to: '/addresses' },
    { icon: HiOutlineWallet, label: t('wallet'), to: '/wallet' },
    { icon: HiOutlineCog6Tooth, label: 'Change Password', to: '/change-password' },
  ];

  return (
    <div className="pb-4">
      <TopNav title={t('profile')} showBack={true} />

      {/* Profile Header */}
      <div className="px-4 pt-4">
        <div className="bg-primary text-white rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <h2 className="text-lg font-bold">{user?.name || 'User'}</h2>
            <p className="text-sm opacity-90">{user?.phone || ''}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 mt-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
          >
            <item.icon className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700 flex-1">{item.label}</span>
            <HiOutlineChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        ))}

        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 w-full active:scale-[0.98] transition-transform"
        >
          <HiOutlineGlobeAlt className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700 flex-1 text-left">{t('language')}</span>
          <span className="text-xs text-primary font-medium">
            {i18n.language === 'en' ? t('nepali') : t('english')}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-red-100 w-full mt-4 active:scale-[0.98] transition-transform"
        >
          <HiOutlineArrowRightOnRectangle className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium text-red-500">{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}

export default Profile;
