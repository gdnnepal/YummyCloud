import { useState, useEffect } from 'react';
import { HiOutlineBuildingStorefront, HiOutlineTruck, HiOutlineCreditCard, HiOutlineMegaphone, HiOutlineWallet } from 'react-icons/hi2';
import api from '../services/api';

const tabs = [
  { id: 'store', label: 'Store Details', icon: HiOutlineBuildingStorefront },
  { id: 'orders', label: 'Orders & Delivery', icon: HiOutlineTruck },
  { id: 'payment', label: 'Payment', icon: HiOutlineCreditCard },
  { id: 'promotions', label: 'Promotions', icon: HiOutlineMegaphone },
  { id: 'wallet', label: 'Wallet', icon: HiOutlineWallet },
];

const settingsConfig = {
  store: [
    { key: 'kitchen_name', label: 'Kitchen / Restaurant Name', type: 'text', placeholder: 'e.g. YummyCloud Kitchen' },
    { key: 'kitchen_phone', label: 'Kitchen Phone', type: 'text', placeholder: '9800000000' },
    { key: 'kitchen_address', label: 'Kitchen Address', type: 'text', placeholder: 'e.g. Kathmandu, Nepal' },
    { key: 'support_phone', label: 'Support Phone (WhatsApp)', type: 'text', placeholder: '9800000000' },
  ],
  orders: [
    { key: 'delivery_fee', label: 'Delivery Fee (Rs.)', type: 'number', placeholder: '50' },
    { key: 'delivery_fee_mandatory', label: 'Always Charge Delivery Fee', type: 'toggle', defaultValue: 'true', hint: 'When ON, delivery fee cannot be covered by wallet or coupons' },
    { key: 'min_order_amount', label: 'Minimum Order Amount (Rs.)', type: 'number', placeholder: '100' },
    { key: 'estimated_delivery_time', label: 'Estimated Delivery Time', type: 'text', placeholder: '30-45 mins' },
  ],
  payment: [
    { key: 'qr_payment_info', label: 'QR Payment Instructions', type: 'text', placeholder: 'Scan to pay via eSewa/Khalti' },
    { key: 'qr_image', label: 'QR Code Image', type: 'file' },
  ],
  promotions: [
    { key: 'banner_enabled', label: 'Show Offer Banner', type: 'select', options: [{ value: 'true', label: 'Enabled' }, { value: 'false', label: 'Disabled' }] },
    { key: 'banner_title', label: 'Banner Title', type: 'text', placeholder: 'e.g. 20% OFF Today!' },
    { key: 'banner_subtitle', label: 'Banner Subtitle', type: 'text', placeholder: 'e.g. Use code FIRST20' },
  ],
  wallet: [
    { key: 'welcome_bonus', label: 'Welcome Bonus (Rs.)', type: 'number', placeholder: '100' },
    { key: 'reward_enabled', label: 'Enable Loyalty Rewards', type: 'toggle', defaultValue: 'false', hint: 'Customers get a free reward item after every X delivered orders' },
    { key: 'reward_orders_required', label: 'Orders Required for Reward', type: 'number', placeholder: '5' },
  ],
};

function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  useEffect(() => {
    api.request('/admin/settings')
      .then((res) => setSettings(res.settings || {}))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.request('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl h-32 animate-pulse" />)}</div>;

  const currentFields = settingsConfig[activeTab] || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-4 text-sm text-green-700">
          Settings saved successfully!
        </div>
      )}

      <div className="flex gap-5">
        {/* Tabs Sidebar */}
        <div className="w-52 shrink-0 hidden md:block">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <tab.icon className="w-4.5 h-4.5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden w-full mb-4">
          <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">{tabs.find(t => t.id === activeTab)?.label}</h2>
            </div>
            <div className="p-6 space-y-5">
              {currentFields.map((config) => (
                <div key={config.key}>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">{config.label}</label>
                  {config.type === 'select' ? (
                    <select
                      value={settings[config.key] || ''}
                      onChange={(e) => setSettings({ ...settings, [config.key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
                    >
                      {config.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  ) : config.type === 'toggle' ? (
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={settings[config.key] === 'true' || settings[config.key] === true || (!settings.hasOwnProperty(config.key) && config.defaultValue === 'true')}
                            onChange={(e) => setSettings({ ...settings, [config.key]: e.target.checked ? 'true' : 'false' })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-checked:bg-primary rounded-full transition-colors" />
                          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-5 transition-transform" />
                        </div>
                        <span className="text-sm text-gray-700">{(settings[config.key] === 'true' || settings[config.key] === true || (!settings.hasOwnProperty(config.key) && config.defaultValue === 'true')) ? 'Enabled' : 'Disabled'}</span>
                      </label>
                      {config.hint && <p className="text-[10px] text-gray-400 mt-1.5">{config.hint}</p>}
                    </div>
                  ) : config.type === 'file' ? (
                    <div className="flex items-center gap-4">
                      {settings[config.key] && (
                        <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${settings[config.key]}`} alt="QR" className="w-20 h-20 rounded-lg border border-gray-200 object-cover" />
                      )}
                      <label className="cursor-pointer inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {settings[config.key] ? 'Change Image' : 'Upload Image'}
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const formData = new FormData();
                          formData.append('qr_image', file);
                          try {
                            const res = await api.upload('/admin/settings/qr-image', formData);
                            setSettings({ ...settings, qr_image: res.path });
                          } catch (err) { alert(err.message); }
                        }} />
                      </label>
                    </div>
                  ) : (
                    <input
                      type={config.type}
                      value={settings[config.key] || ''}
                      onChange={(e) => setSettings({ ...settings, [config.key]: e.target.value })}
                      placeholder={config.placeholder || ''}
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
                    />
                  )}
                </div>
              ))}

              {activeTab === 'wallet' && (
                <p className="text-xs text-gray-400 mt-2">New customers receive this amount as wallet credit upon registration.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
