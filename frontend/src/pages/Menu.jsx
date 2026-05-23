import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { HiOutlineMagnifyingGlass, HiOutlineAdjustmentsHorizontal } from 'react-icons/hi2';
import TopNav from '../components/TopNav';
import useCartStore from '../store/useCartStore';
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
  const addItem = useCartStore((state) => state.addItem);

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
  }, []);

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
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-3.5 h-3.5 border-2 rounded-sm flex items-center justify-center ${
                        item.is_veg ? 'border-green-600' : 'border-red-600'
                      }`}
                    >
                      <span
                        className={`block w-1.5 h-1.5 rounded-full ${
                          item.is_veg ? 'bg-green-600' : 'bg-red-600'
                        }`}
                      />
                    </span>
                    <h3 className="font-medium text-gray-800 text-sm truncate">
                      {isNepali ? item.name_ne || item.name : item.name}
                    </h3>
                  </div>
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
