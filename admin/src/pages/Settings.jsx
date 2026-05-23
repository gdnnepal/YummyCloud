import { useState, useEffect } from 'react';
import api from '../services/api';

const settingsConfig = [
  { key: 'kitchen_name', label: 'Kitchen / Restaurant Name', type: 'text', group: 'General' },
  { key: 'kitchen_phone', label: 'Kitchen Phone', type: 'text', group: 'General' },
  { key: 'kitchen_address', label: 'Kitchen Address', type: 'text', group: 'General' },
  { key: 'support_phone', label: 'Support Phone (WhatsApp)', type: 'text', group: 'General' },
  { key: 'banner_enabled', label: 'Show Offer Banner', type: 'select', options: ['true', 'false'], group: 'Offer Banner' },
  { key: 'banner_title', label: 'Banner Title', type: 'text', group: 'Offer Banner' },
  { key: 'banner_subtitle', label: 'Banner Subtitle', type: 'text', group: 'Offer Banner' },
  { key: 'delivery_fee', label: 'Delivery Fee (Rs.)', type: 'number', group: 'Orders' },
  { key: 'min_order_amount', label: 'Minimum Order Amount (Rs.)', type: 'number', group: 'Orders' },
  { key: 'estimated_delivery_time', label: 'Estimated Delivery Time', type: 'text', group: 'Orders' },
  { key: 'welcome_bonus', label: 'Welcome Bonus (Rs.)', type: 'number', group: 'Wallet' },
  { key: 'qr_payment_info', label: 'QR Payment Instructions', type: 'text', group: 'Payment' },
  { key: 'qr_image', label: 'QR Code Image', type: 'file', group: 'Payment' },
];

function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const groups = [...new Set(settingsConfig.map((s) => s.group))];

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl h-32 animate-pulse" />)}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-4 text-sm text-green-700">
          Settings saved successfully!
        </div>
      )}

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group} className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">{group}</h2>
            <div className="space-y-4">
              {settingsConfig.filter((s) => s.group === group).map((config) => (
                <div key={config.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-xs font-medium text-gray-600 sm:w-48 shrink-0">{config.label}</label>
                  {config.type === 'select' ? (
                    <select
                      value={settings[config.key] || ''}
                      onChange={(e) => setSettings({ ...settings, [config.key]: e.target.value })}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      {config.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : config.type === 'file' ? (
                    <div className="flex-1 flex items-center gap-3">
                      {settings[config.key] && (
                        <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}/storage/${settings[config.key]}`} alt="QR" className="w-16 h-16 rounded-lg border object-cover" />
                      )}
                      <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-xs font-medium text-gray-600">
                        Upload
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
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Settings;
