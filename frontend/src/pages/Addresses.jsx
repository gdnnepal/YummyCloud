import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  HiOutlineMapPin,
  HiOutlinePlus,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineHome,
  HiOutlineBriefcase,
  HiOutlineXMark,
} from 'react-icons/hi2';
import TopNav from '../components/TopNav';
import useAuthStore from '../store/useAuthStore';
import useAddressStore from '../store/useAddressStore';
import api from '../services/api';

function Addresses() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const { addresses, setAddresses } = useAddressStore();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    label: 'Home',
    address: '',
    detail: '',
    latitude: null,
    longitude: null,
  });
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchAddresses();
  }, [isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      const res = await api.getAddresses();
      setAddresses(res.addresses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        if (error.code === 1) {
          alert('Location permission denied. Please allow location access in your browser settings.');
        } else if (error.code === 2) {
          alert('Location unavailable. Please try again.');
        } else if (error.code === 3) {
          alert('Location request timed out. Please try again.');
        } else {
          alert('Unable to get location. Note: Location requires HTTPS on mobile devices.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteAddress(id);
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.updateAddress(id, { is_default: true });
      setAddresses(addresses.map((a) => ({ ...a, is_default: a.id === id })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!formData.address.trim()) return;
    try {
      const res = await api.addAddress({
        label: formData.label,
        address: formData.address,
        detail: formData.detail,
        latitude: formData.latitude,
        longitude: formData.longitude,
      });
      setAddresses([...addresses, res.address]);
      setFormData({ label: 'Home', address: '', detail: '', latitude: null, longitude: null });
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <TopNav title={t('saved_addresses')} showBack={true} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <HiOutlineMapPin className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500 mb-4">Login to manage addresses</p>
          <Link to="/login" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium text-sm">
            {t('login')}
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="pb-4">
      <TopNav
        title={t('saved_addresses')}
        showBack={true}
        rightAction={
          <button
            onClick={() => setShowForm(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <HiOutlinePlus className="w-5 h-5 text-primary" />
          </button>
        }
      />

      {/* Address List */}
      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          [...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />
          ))
        ) : addresses.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <HiOutlineMapPin className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-4">No saved addresses</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-transform"
            >
              Add Address
            </button>
          </div>
        ) : (
          addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-2xl p-4 shadow-sm border transition-colors ${
                addr.is_default ? 'border-primary/30 bg-red-50/30' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  addr.is_default ? 'bg-primary/10' : 'bg-gray-100'
                }`}>
                  {addr.label === 'Home' ? (
                    <HiOutlineHome className={`w-5 h-5 ${addr.is_default ? 'text-primary' : 'text-gray-500'}`} />
                  ) : (
                    <HiOutlineBriefcase className={`w-5 h-5 ${addr.is_default ? 'text-primary' : 'text-gray-500'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 text-sm">{addr.label}</h3>
                    {addr.is_default && (
                      <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{addr.address}</p>
                  {addr.detail && <p className="text-xs text-gray-500 mt-0.5">{addr.detail}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                {!addr.is_default && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-xs text-primary font-medium px-3 py-1.5 rounded-lg bg-primary/5 active:scale-95 transition-transform"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-xs text-red-500 font-medium px-3 py-1.5 rounded-lg bg-red-50 active:scale-95 transition-transform flex items-center gap-1 ml-auto"
                >
                  <HiOutlineTrash className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Address Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-t-3xl p-6 animate-slide-up">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Add New Address</h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <HiOutlineXMark className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Label</label>
                <div className="flex gap-2">
                  {['Home', 'Office', 'Other'].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setFormData({ ...formData, label })}
                      className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                        formData.label === label ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Thamel, Kathmandu"
                  className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-gray-50/50 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Landmark / Detail</label>
                <input
                  type="text"
                  value={formData.detail}
                  onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                  placeholder="Near Garden of Dreams..."
                  className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-gray-50/50 font-medium"
                />
              </div>

              {/* GPS Location (optional) */}
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
                  GPS Location <span className="text-gray-400 normal-case font-normal">(optional)</span>
                </label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-2xl py-3 text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                >
                  {gettingLocation ? (
                    <>
                      <span className="w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                      Getting location...
                    </>
                  ) : formData.latitude ? (
                    <>
                      <HiOutlineMapPin className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-medium">Location captured</span>
                      <span className="text-[10px] text-gray-400">({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})</span>
                    </>
                  ) : (
                    <>
                      <HiOutlineMapPin className="w-4 h-4" />
                      Use Current Location
                    </>
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={!formData.address.trim()}
                className="w-full bg-primary text-white py-3.5 rounded-2xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all shadow-lg shadow-primary/30"
              >
                Save Address
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Addresses;
