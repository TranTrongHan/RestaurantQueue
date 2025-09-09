import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const endpoints = {
    login : "/auth/login",
    register: "/users",
    profile:"/auth/profile",
    menu_items:"/menu_items",
    categories: "/categories",
    booking : "/reservation",
    cart : "/cart",
    online_order:"/online_order",
    order_session: "/order_session",
    kitchen_order:"/kitchen",
    comments: "/comments",
    stripe: "/stripe"
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


