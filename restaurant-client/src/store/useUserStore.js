import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * useUserStore — Global user state (replace MyUserContext + MyUserReducer)
 *
 * Usage:
 *   const { user, setUser, logout } = useUserStore();
 */
const useUserStore = create(
    devtools(
        persist(
            (set) => ({
                user: null,

                /** Called after successful login / profile fetch */
                setUser: (userData) => set({ user: userData }, false, 'setUser'),

                /** Called on logout */
                logout: () => set({ user: null }, false, 'logout'),
            }),
            {
                name: 'rq-user',          // localStorage key
                partialize: (state) => ({ user: state.user }),
            }
        ),
        { name: 'UserStore' }
    )
);

export default useUserStore;
