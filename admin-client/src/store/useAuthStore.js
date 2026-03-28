import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

const useAuthStore = create(
    devtools(
        persist(
            (set) => ({
                user: null,
                token: null,
                isAuthenticated: false,

                setUser: (userData) => set({ 
                    user: userData, 
                    isAuthenticated: !!userData 
                }, false, 'setUser'),

                setToken: (token) => set({ 
                    token: token,
                    isAuthenticated: !!token 
                }, false, 'setToken'),

                login: (userData, token) => set({ 
                    user: userData, 
                    token: token, 
                    isAuthenticated: true 
                }, false, 'login'),

                logout: () => set({ 
                    user: null, 
                    token: null, 
                    isAuthenticated: false 
                }, false, 'logout'),
            }),
            {
                name: 'admin-auth',
                partialize: (state) => ({ 
                    user: state.user, 
                    token: state.token,
                    isAuthenticated: state.isAuthenticated 
                }),
            }
        ),
        { name: 'AuthStore' }
    )
);

export default useAuthStore;
