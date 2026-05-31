import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const endpoints = {
  login: "/auth/login",
  register: "/users",
  profile: "/auth/profile",
  menu_items: "/menu_items",
  categories: "/categories",
  booking: "/reservation",
  cart: "/cart",
  online_order: "/online_order",
  order_session: "/order_session",
  kitchen_order: "/kitchen",
  comments: "/comments",
  stripe: "/stripe",
  membership_status: "/customer/membership/status",
  membership_history: "/customer/membership/history",
  my_vouchers: "/customer/vouchers/my-wallet",
  exchangeable_vouchers: "/customer/vouchers/exchangeable",
  redeem_voucher: "/customer/vouchers/redeem",
  points_history: "/customer/points/transactions",
  user_voucher_detail: "/customer/vouchers",
}

export default axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  }
})

export const authApis = (token) =>
  axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });


