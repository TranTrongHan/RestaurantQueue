import React, { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './components/pages/LoginPage'
import RegisterPage from './components/pages/RegisterPage'
import HomePage from './components/pages/HomePage'
import MenuPages from './components/pages/MenuPages'
import TableBookingPage from './components/pages/TableBookingPage'
import { useCookies } from 'react-cookie'
import { authApis, endpoints } from './components/configs/Apis'
import MyReservationPage from './components/pages/MyReservationPage'
import ReservationDetailPage from './components/pages/ReservationDetailPage'
import CartPage from './components/pages/CartPage'
import MyOnlineOrderPage from './components/pages/MyOnlineOrderPage'
import ReservationsPages from './components/pages/ReservationsPages'
import SessionPage from './components/pages/SessionPage/SessionPage'
import KitchenPage from './components/pages/KitchenPage/KitchenPage'
import OAuth2Success from './components/pages/OAuth2Succes'
import ProfilePage from './components/pages/ProfilePage'
import LoyaltyPortalPage from './components/pages/LoyaltyPortalPage'
import useUserStore from './store/useUserStore'
import useCartStore from './store/useCartStore'
import { Toaster } from 'react-hot-toast'

const App = () => {
  const [cookies] = useCookies(["token"]);
  const { setUser, logout, user } = useUserStore();
  const { setCart } = useCartStore();

  // Load authenticated user from API on token change
  const loadUser = async () => {
    if (cookies.token) {
      try {
        const res = await authApis(cookies.token).get(endpoints['profile']);
        if (res.status === 200) setUser(res.data.result);
      } catch {
        logout();
      }
    } else {
      logout();
    }
  };

  // Load cart from API (only for CUSTOMER role)
  const loadCart = async () => {
    if (cookies.token && user?.role === "CUSTOMER") {
      try {
        const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.cart}`;
        const res = await authApis(cookies.token).get(url);
        setCart(res.data.result.items || []);
      } catch {
        // silently fail
      }
    }
  };

  useEffect(() => { loadUser(); }, [cookies.token]);
  useEffect(() => { loadCart(); }, [user?.role]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path="/oauth2/success" element={<OAuth2Success />} />
        <Route path='/' element={<HomePage />} />
        <Route path='*' element={<HomePage />} />
        <Route path='/menu' element={<MenuPages />} />
        <Route path='/booking' element={<TableBookingPage />} />
        <Route path='/my-reservations' element={<MyReservationPage />} />
        <Route path='/my-reservations/:id' element={<ReservationDetailPage />} />
        <Route path='/cart' element={<CartPage />} />
        <Route path='/online_order' element={<MyOnlineOrderPage />} />
        <Route path='/reservations' element={<ReservationsPages />} />
        <Route path='/order_session' element={<SessionPage />} />
        <Route path='/kitchen' element={<KitchenPage />} />
        <Route path='/profile' element={<ProfilePage />} />
        <Route path='/loyalty' element={<LoyaltyPortalPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
