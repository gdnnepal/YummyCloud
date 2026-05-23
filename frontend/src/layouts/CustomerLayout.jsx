import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HiOutlineHome,
  HiHome,
  HiOutlineSquares2X2,
  HiSquares2X2,
  HiOutlineShoppingBag,
  HiShoppingBag,
  HiOutlineClipboardDocumentList,
  HiClipboardDocumentList,
  HiOutlineUser,
  HiUser,
} from 'react-icons/hi2';
import useCartStore from '../store/useCartStore';

function CustomerLayout() {
  const { t } = useTranslation();
  const itemCount = useCartStore((state) => state.getItemCount());

  const navItems = [
    {
      to: '/',
      label: t('home'),
      icon: HiOutlineHome,
      activeIcon: HiHome,
    },
    {
      to: '/menu',
      label: t('menu'),
      icon: HiOutlineSquares2X2,
      activeIcon: HiSquares2X2,
    },
    {
      to: '/cart',
      label: t('cart'),
      icon: HiOutlineShoppingBag,
      activeIcon: HiShoppingBag,
      badge: itemCount,
    },
    {
      to: '/orders',
      label: t('orders'),
      icon: HiOutlineClipboardDocumentList,
      activeIcon: HiClipboardDocumentList,
    },
    {
      to: '/profile',
      label: t('profile'),
      icon: HiOutlineUser,
      activeIcon: HiUser,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Main Content */}
      <main className="max-w-lg mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation - iOS Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200/60 z-50 safe-area-bottom">
        <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 min-w-[56px] py-1 ${
                  isActive ? 'text-primary' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    {isActive ? (
                      <item.activeIcon className="w-6 h-6" />
                    ) : (
                      <item.icon className="w-6 h-6" />
                    )}
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default CustomerLayout;
