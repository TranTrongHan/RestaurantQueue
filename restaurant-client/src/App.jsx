import React, { useEffect, useReducer } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './components/pages/LoginPage'
import RegisterPage from './components/pages/RegisterPage'
import HomePage from './components/pages/HomePage'
import MenuPages from './components/pages/MenuPages'
import MyUserReducer from './components/reducers/MyUserReducer'
import { MyCartContext, MyUserContext } from './components/configs/Context'
import TableBookingPage from './components/pages/TableBookingPage'
import { useCookies } from 'react-cookie'
import { authApis, endpoints } from './components/configs/Apis'
import MyReservationPage from './components/pages/MyReservationPage'
import ReservationDetailPage from './components/pages/ReservationDetailPage'
import MyCartReducer from './components/reducers/MyCartReducer'
import CartPage from './components/pages/CartPage'
import MyOnlineOrderPage from './components/pages/MyOnlineOrderPage'
import ReservationsPages from './components/pages/ReservationsPages'
import SessionPage from './components/pages/SessionPage/SessionPage'
import KitchenPage from './components/pages/KitchenPage/KitchenPage'
import OAuth2Success from './components/pages/OAuth2Succes'
import ProfilePage from './components/pages/ProfilePage'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(`${import.meta.env.VITE_STRIPE_PUBLIC_KEY}`);
const App = () => {
  let [user, dispatch] = useReducer(MyUserReducer, null);
  let [cart, dispatchCart] = useReducer(MyCartReducer, []);
  const [cookies,] = useCookies(["token"]);
  const loadUser = async () => {
    if (cookies.token) {
      try {
        let res = await authApis(cookies.token).get(endpoints['profile']);
        if (res.status === 200) {
          console.log(res.data.result);
        }
        dispatch({
          type: "login",
          payload: res.data.result
        });
      } catch (error) {
        console.log("Error loading user:", error);
        dispatch({ type: "logout" });
      }
    }
  }
  const loadCart = async () => {
    if (cookies.token) {
      if (user?.role === "CUSTOMER") {
        try {
          const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.cart}`;
          let res = await authApis(cookies.token).get(url);
          dispatchCart({
            type: "set",
            payload: res.data.result.items || []
          });
        } catch (error) {
          console.log("Error loading cart:", error);
        }
      }
    }

  };
  useEffect(() => {
    loadUser();
    loadCart();
  }, [cookies.token]);



  return (
    <>
      <MyUserContext.Provider value={[user, dispatch]}>
        <MyCartContext.Provider value={[cart, dispatchCart]}>
          <Elements stripe={stripePromise}>
            <BrowserRouter>
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
              </Routes>
            </BrowserRouter>
          </Elements>
        </MyCartContext.Provider>
      </MyUserContext.Provider>
    </>
  )
}

export default App
