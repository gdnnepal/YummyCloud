import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2';
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
    <div className="pb-4">
      <TopNav
        title={t('menu')}
        showBack={true}
      />

      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-3">
          <HiOutlineMagnifyingGlass className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-sm flex-1 text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(String(cat.id))}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                String(activeCategory) === String(cat.id)
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isNepali ? cat.name_ne || cat.name : cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Reward Section */}
      {rewardData && (
        <div className="px-4 mt-3 mb-2">
          {rewardData.eligible && rewardData.reward_items?.length > 0 ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎁</span>
                <h3 className="font-bold text-amber-800 text-sm">Loyalty Reward Unlocked!</h3>
              </div>
              <p className="text-xs text-amber-700 mb-3">You've completed {rewardData.delivered_count} orders! Pick a free item below (delivery fee applies).</p>
              <div className="space-y-2">
                {rewardData.reward_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-amber-100">
                    <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {item.image ? (
                        <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${item.image}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">🎁</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 text-sm truncate">{isNepali ? item.name_ne || item.name : item.name}</h4>
                      <p className="text-xs text-green-600 font-bold">FREE</p>
                    </div>
                    <button
                      onClick={() => addItem({ id: item.id, name: item.name, nameNe: item.name_ne, price: 0, image: item.image, isReward: true })}
                      className="bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium active:scale-90 transition-transform"
                    >
                      + CLAIM
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : rewardData.orders_until_reward > 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 flex items-center gap-3">
              <span className="text-lg">🎯</span>
              <div className="flex-1">
                <p className="text-xs text-gray-600"><strong>{rewardData.orders_until_reward} more order{rewardData.orders_until_reward > 1 ? 's' : ''}</strong> to unlock a free reward item!</p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Menu Items */}
      <div className="px-4 mt-2 space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-20 animate-pulse" />
          ))
        ) : (
          <>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100"
              >
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${item.image}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">🍽️</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 text-sm truncate">
                    {isNepali ? item.name_ne || item.name : item.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-gray-800 text-sm">
                      Rs. {Number(item.price)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="bg-primary text-white text-xs px-3 py-1.5 rounded-lg font-medium active:scale-90 transition-transform"
                    >
                      + ADD
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-2">🔍</p>
                <p className="text-sm">No items found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Menu;
