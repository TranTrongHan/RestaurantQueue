import { create } from 'zustand'

export const useStore = create((set) => ({
  // Define global state fields here
  user: null,
  cartItems: [],
  notifications: [],

  // Functions to update the state
  setUser: (user) => set({ user }),
  addToCart: (item) => set((state) => ({ cartItems: [...state.cartItems, item] })),
  clearCart: () => set({ cartItems: [] }),
  addNotification: (notification) => set((state) => ({ 
    notifications: [...state.notifications, notification] 
  })),
  clearNotifications: () => set({ notifications: [] }),
}))
