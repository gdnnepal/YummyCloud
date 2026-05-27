import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  HiOutlineEnvelope,
  HiOutlineMagnifyingGlass,
  HiOutlineMoon,
  HiOutlineHandRaised,
} from 'react-icons/hi2';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';

function Home() {
  const { t, i18n } = useTranslation();
  const isNepali = i18n.language === 'ne';
  const addItem = useCartStore((state) => state.addItem);
  const { user } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const firstName = user?.name?.split(' ')[0] || 'Guest';

  const [categories, setCategories] = useState([]);
  const [popularDishes, setPopularDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);
  const [storeClosed, setStoreClosed] = useState(false);
  const [storeOpenTime, setStoreOpenTime] = useState('');

  useEffect(() => { document.title = `${t('app_name')} - Order Food Online`; }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, menuRes, settingsRes] = await Promise.all([
          api.getCategories(),
          api.getMenuItems(),
          api.getPublicSettings(),
        ]);
        setCategories(catRes.categories || []);
        const featured = (menuRes.items || []).filter((i) => i.is_featured);
        setPopularDishes(featured.length > 0 ? featured : (menuRes.items || []).slice(0, 4));
        const s = settingsRes.settings || {};
        if (s.banner_enabled === 'true' && s.banner_title) {
          setBanner({ title: s.banner_title, subtitle: s.banner_subtitle });
        }
        // Check if store is open
        if (s.store_open_time && s.store_close_time) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const [openH, openM] = s.store_open_time.split(':').map(Number);
          const [closeH, closeM] = s.store_close_time.split(':').map(Number);
          const openMinutes = openH * 60 + (openM || 0);
          const closeMinutes = closeH * 60 + (closeM || 0);
          let isOpen;
          if (closeMinutes < openMinutes) {
            isOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
          } else {
            isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
          }
          setStoreClosed(!isOpen);
          setStoreOpenTime(s.store_open_time);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddToCart = (dish) => {
    addItem({
      id: dish.id,
      name: dish.name,
      nameNe: dish.name_ne,
      price: Number(dish.price),
      image: dish.image || null,
    });
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <header className="bg-primary text-white px-4 pt-5 pb-7 rounded-b-[28px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HiOutlineHandRaised className="w-6 h-6 text-white/90" />
            <div>
              <p className="text-xs opacity-80">Welcome</p>
              <p className="text-sm font-semibold">{firstName}</p>
            </div>
          </div>
          <Link
            to="/messages"
            className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          >
            <HiOutlineEnvelope className="w-5 h-5" />
          </Link>
        </div>

        {/* Search Bar */}
        <Link
          to="/menu"
          className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 text-white/80"
        >
          <HiOutlineMagnifyingGlass className="w-5 h-5" />
          <span className="text-sm">{t('search')}</span>
        </Link>
      </header>

      {/* Store Closed Notice */}
      {storeClosed && (
        <div className="px-4 mt-3">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
                <HiOutlineMoon className="w-7 h-7 text-white/80" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">We're currently closed</p>
                <p className="text-white/60 text-xs mt-0.5">
                  Opens at {storeOpenTime ? (() => {
                    const h = parseInt(storeOpenTime.split(':')[0]);
                    const m = storeOpenTime.split(':')[1] || '00';
                    return `${h > 12 ? h - 12 : h}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
                  })() : 'later'}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-white/50">Ordering is paused</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offers Banner */}
      {banner && (
        <section className="px-4 mt-4">
          <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-4 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-6 translate-x-6" />
            <p className="text-xs font-medium opacity-90">{t('offers')}</p>
            <p className="text-lg font-bold mt-1">{banner.title}</p>
            {banner.subtitle && <p className="text-xs mt-1 opacity-80">{banner.subtitle}</p>}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="px-4 mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('categories')}</h2>
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl p-3 h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/menu?category=${cat.id}`}
                className="flex flex-col items-center gap-1.5 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 active:scale-95 transition-transform"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-xs font-medium text-gray-700">
                  {isNepali ? cat.name_ne || cat.name : cat.name}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Popular Dishes */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">{t('popular')}</h2>
          <Link to="/menu" className="text-sm text-primary font-medium">
            View All
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {popularDishes.map((dish) => (
              <div
                key={dish.id}
                className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100"
              >
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                  {dish.image ? (
                    <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${dish.image}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-12.75H6A2.25 2.25 0 003.75 6v12a2.25 2.25 0 002.25 2.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75z" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 text-sm">
                    {isNepali ? dish.name_ne || dish.name : dish.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-primary text-sm">
                      Rs. {Number(dish.price)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(dish)}
                      className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg font-medium active:scale-90 transition-transform"
                    >
                      + ADD
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
