import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineMagnifyingGlass, HiOutlineGift, HiOutlineTrophy, HiOutlineXMark } from 'react-icons/hi2';
import TopNav from '../components/TopNav';
import useCartStore from '../store/useCartStore';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';

function Menu() {
  const { t, i18n } = useTranslation();
  const isNepali = i18n.language === 'ne';
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rewardData, setRewardData] = useState(null);
  const addItem = useCartStore((state) => state.addItem);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.getCategories();
        setCategories([{ id: 'all', name: 'All', name_ne: 'सबै' }, ...(res.categories || [])]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
    // Fetch reward eligibility
    if (isAuthenticated) {
      api.request('/rewards').then(setRewardData).catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const categoryId = activeCategory === 'all' ? null : activeCategory;
        const res = await api.getMenuItems(categoryId);
        setMenuItems(res.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [activeCategory]);

  const filteredItems = searchQuery
    ? menuItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.name_ne && item.name_ne.includes(searchQuery))
      )
    : menuItems;

  const handleAddToCart = (item) => {
    addItem({
      id: item.id,
      name: item.name,
      nameNe: item.name_ne,
      price: Number(item.price),
      image: item.image || null,
    });
  };

  return (
    <div className="pb-4 bg-gray-50 min-h-screen">
      <TopNav
        title={t('menu')}
        showBack={true}
      />

      {/* Search */}
      <div className="px-4 pt-3 pb-2 bg-white">
        <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
          <HiOutlineMagnifyingGlass className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-sm flex-1 text-gray-700 placeholder-gray-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="shrink-0">
              <HiOutlineXMark className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-2.5 bg-white border-b border-gray-100 sticky top-14 z-40">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(String(cat.id))}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                String(activeCategory) === String(cat.id)
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-gray-100 text-gray-600 active:scale-95'
              }`}
            >
              {isNepali ? cat.name_ne || cat.name : cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Reward Section */}
      {rewardData && (
        <div className="px-4 mt-3 mb-1">
          {rewardData.eligible && rewardData.reward_items?.length > 0 ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <HiOutlineGift className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-amber-800 text-sm">Loyalty Reward Unlocked!</h3>
              </div>
              <p className="text-xs text-amber-700 mb-3">You've completed {rewardData.delivered_count} orders{rewardData.min_order_amount > 0 ? ` (above Rs. ${rewardData.min_order_amount})` : ''}! Pick a free item below (delivery fee applies).</p>
              <div className="space-y-2">
                {rewardData.reward_items.map((item) => {
                  const inCart = useCartStore.getState().items.some(i => i.id === item.id && i.isReward);
                  return (
                  <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-amber-100">
                    <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {item.image ? (
                        <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${item.image}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <HiOutlineGift className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 text-sm truncate">{isNepali ? item.name_ne || item.name : item.name}</h4>
                      <p className="text-xs text-green-600 font-bold">FREE</p>
                    </div>
                    {inCart ? (
                      <span className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-lg font-medium">✓ Added</span>
                    ) : (
                      <button
                        onClick={() => addItem({ id: item.id, name: item.name, nameNe: item.name_ne, price: 0, image: item.image, isReward: true })}
                        className="bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium active:scale-90 transition-transform"
                      >
                        + CLAIM
                      </button>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          ) : rewardData.orders_until_reward > 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-3.5 flex items-center gap-3 shadow-sm">
              <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                <HiOutlineTrophy className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-700"><strong>{rewardData.orders_until_reward} more order{rewardData.orders_until_reward > 1 ? 's' : ''}</strong>{rewardData.min_order_amount > 0 ? ` (above Rs. ${rewardData.min_order_amount})` : ''} to unlock a free reward!</p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Menu Items */}
      <div className="px-4 mt-3 space-y-2.5">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />
          ))
        ) : (
          <>
            {/* Item count */}
            {!searchQuery && filteredItems.length > 0 && (
              <p className="text-[11px] text-gray-400 font-medium px-1">{filteredItems.length} items</p>
            )}

            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${item.image}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-7 h-7 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-12.75H6A2.25 2.25 0 003.75 6v12a2.25 2.25 0 002.25 2.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75z" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">
                    {isNepali ? item.name_ne || item.name : item.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-gray-900 text-sm">
                      Rs. {Number(item.price)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="bg-primary/10 text-primary text-xs px-3.5 py-1.5 rounded-lg font-bold active:scale-90 active:bg-primary active:text-white transition-all"
                    >
                      + ADD
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <HiOutlineMagnifyingGlass className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No items found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search or category</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Menu;
