import { create } from 'zustand';

const useAddressStore = create((set, get) => ({
  addresses: [],
  loaded: false,

  setAddresses: (addresses) => set({ addresses, loaded: true }),

  getDefault: () => {
    return get().addresses.find((a) => a.is_default) || get().addresses[0] || null;
  },
}));

export default useAddressStore;
