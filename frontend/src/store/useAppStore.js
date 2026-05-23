import { create } from 'zustand';
import api from '../services/api';

const useAppStore = create((set) => ({
  appName: localStorage.getItem('app_name') || 'CloudKitchen',
  settings: {},
  loaded: false,

  fetchSettings: async () => {
    try {
      const res = await api.getPublicSettings();
      const s = res.settings || {};
      const name = s.kitchen_name || 'CloudKitchen';
      localStorage.setItem('app_name', name);
      set({ appName: name, settings: s, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));

export default useAppStore;
