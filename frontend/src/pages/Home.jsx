import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  HiOutlineEnvelope,
  HiOutlineMagnifyingGlass,
  HiOutlineMoon,
  HiOutlineBell,
} from 'react-icons/hi2';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import useAppStore from '../store/useAppStore';
import api from '../services/api';

function Home() {
  const { t, i18n } = useTranslation();
  const isNepali = i18n.language === 'ne';
  const addItem = useCartStore((state) => state.addItem);
  const { user } = useAuthStore();
  const appName = useAppStore((s) => s.appName);

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
  const [notice, setNotice] = useState(null);

  useEffect(() => { document.title = `${appName || t('app_name')} - Order Food Online`; }, [appName]);

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
        setPopularDishes(featured.length > 0 ? featured : (menuRes.items || []).slice(0, 6));
        const s = settingsRes.settings || {};
        if (s.banner_enabled === 'true' && s.banner_title) {
          setBanner({ title: s.banner_title, subtitle: s.banner_subtitle });
        }
        if (s.notice_enabled === 'true' && s.notice_text) {
          setNotice(s.notice_text);
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
      <header className="bg-gradient-to-br from-primary via-primary to-primary-dark text-white px-5 pt-6 pb-8 rounded-b-[32px] relative overflow-hidden">
        <div className="absolute top-[-30px] right-[-30px] w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute bottom-[-20px] left-[20%] w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs text-white/70 font-medium">{getGreeting()}</p>
              <h1 className="text-lg font-bold mt-0.5">{firstName}</h1>
            </div>
            <Link
              to="/messages"
              className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center active:scale-90 transition-transform"
            >
              <HiOutlineBell className="w-5 h-5" />
            </Link>
          </div>

          {/* Search Bar */}
          <Link
            to="/menu"
            className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3.5 border border-white/10"
          >
            <HiOutlineMagnifyingGlass className="w-5 h-5 text-white/60" />
            <span className="text-sm text-white/60">Search for dishes...</span>
          </Link>
        </div>
      </header>

      {/* Store Closed Notice */}
      {storeClosed && (
        <div className="px-4 mt-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
                <HiOutlineMoon className="w-6 h-6 text-white/80" />
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

      {/* Notice */}
      {notice && (
        <div className="px-4 mt-4">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <HiOutlineBell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium leading-relaxed">{notice}</p>
          </div>
        </div>
      )}

      {/* Offers Banner */}
      {banner && (
        <section className="px-4 mt-4">
          <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-6 -translate-x-6" />
            <div className="relative z-10">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{t('offers')}</p>
              <p className="text-lg font-bold mt-1.5">{banner.title}</p>
              {banner.subtitle && <p className="text-xs mt-1.5 opacity-80">{banner.subtitle}</p>}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800">{t('categories')}</h2>
          <Link to="/menu" className="text-xs text-primary font-semibold">See All</Link>
        </div>
        {loading ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl w-20 h-24 shrink-0 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/menu?category=${cat.id}`}
                className="flex flex-col items-center gap-2 shrink-0 w-[72px] active:scale-95 transition-transform"
              >
                <div className="w-[60px] h-[60px] bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
                  <span className="text-2xl">{cat.icon}</span>
                </div>
                <span className="text-[11px] font-medium text-gray-600 text-center leading-tight line-clamp-2">
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
          <h2 className="text-base font-bold text-gray-800">{t('popular')}</h2>
          <Link to="/menu" className="text-xs text-primary font-semibold">
            View All
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {popularDishes.map((dish) => (
              <div
                key={dish.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="w-full h-28 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {dish.image ? (
                    <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${dish.image}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-12.75H6A2.25 2.25 0 003.75 6v12a2.25 2.25 0 002.25 2.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75z" /></svg>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">
                    {isNepali ? dish.name_ne || dish.name : dish.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-gray-900 text-sm">
                      Rs. {Number(dish.price)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(dish)}
                      className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white active:scale-90 transition-transform shadow-sm shadow-primary/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" /></svg>
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
