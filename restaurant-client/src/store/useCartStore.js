import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * useCartStore — Global cart state (replace MyCartContext + MyCartReducer)
 *
 * Usage:
 *   const { cart, addItem, removeItem, clearCart, updateItemId } = useCartStore();
 */
const useCartStore = create(
    devtools(
        (set) => ({
            cart: [],

            /** Add item or increment quantity if already in cart */
            addItem: (payload) =>
                set((state) => {
                    const existing = state.cart.find(
                        (i) => i.menuItemId === payload.menuItemId
                    );
                    if (existing) {
                        return {
                            cart: state.cart.map((i) =>
                                i.menuItemId === payload.menuItemId
                                    ? { ...i, quantity: i.quantity + payload.quantity }
                                    : i
                            ),
                        };
                    }
                    return { cart: [...state.cart, { ...payload }] };
                }, false, 'addItem'),

            /** Remove a single item by menuItemId */
            removeItem: (menuItemId) =>
                set((state) => ({
                    cart: state.cart.filter((i) => i.menuItemId !== menuItemId),
                }), false, 'removeItem'),

            /** Clear the entire cart */
            clearCart: () => set({ cart: [] }, false, 'clearCart'),

            /** After API responds, sync the real cartItemId for an item */
            updateItemId: ({ menuItemId, cartItemId }) =>
                set((state) => ({
                    cart: state.cart.map((i) =>
                        i.menuItemId === menuItemId ? { ...i, cartItemId } : i
                    ),
                }), false, 'updateItemId'),

            /** Replace entire cart (used on initial load from API) */
            setCart: (items) => set({ cart: items }, false, 'setCart'),
        }),
        { name: 'CartStore' }
    )
);

export default useCartStore;
