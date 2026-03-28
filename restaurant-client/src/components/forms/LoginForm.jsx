import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import SpinnerComp from "../common/SpinnerComp";
import Apis, { authApis, endpoints } from "../configs/Apis";
import useUserStore from "../../store/useUserStore";
import { useCookies } from "react-cookie";

const LoginForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { setUser } = useUserStore();
  const [, setCookie] = useCookies(["token"]);
  const [error, setError] = useState(null);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectPath = params.get("redirect") || "/";
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  
  const [validated, setValidated] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    try {
      setLoading(true);
      
      let res = await Apis.post(endpoints["login"], formData);

      if (res.data.code === 200) {
        setCookie("token", res.data.result.token, { path: "/" });

        const userRes = await authApis(res.data.result.token).get(endpoints["profile"]);
        setUser(userRes.data.result);
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <form noValidate className={`${validated ? 'was-validated' : ''} space-y-5`} onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1" htmlFor="username">Tên đăng nhập</label>
        <input
          required
          id="username"
          name="username"
          value={formData.username}
          type="text"
          placeholder="Nhập tên đăng nhập"
          onChange={handleInputChange}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
        />
        {validated && !formData.username && (
          <p className="mt-1.5 text-xs text-danger font-medium">Vui lòng nhập tên đăng nhập</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1" htmlFor="password">Mật khẩu</label>
        <input
          required
          id="password"
          name="password"
          value={formData.password}
          type="password"
          placeholder="Nhập mật khẩu"
          onChange={handleInputChange}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
        />
         {validated && !formData.password && (
           <p className="mt-1.5 text-xs text-danger font-medium">Vui lòng nhập mật khẩu</p>
        )}
      </div>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-primary/30 shadow-lg text-sm font-bold text-white bg-primary hover:bg-primary-active focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed -translate-y-[1px] hover:-translate-y-[2px]"
      >
        {loading ? <SpinnerComp className="w-5 h-5 border-2" /> : "Đăng nhập ngay"}
      </button>

      <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
        <span className="mr-2">Chưa có tài khoản?</span>
        <Link to="/register" className="font-bold text-primary hover:text-primary-active transition-colors">Đăng ký mới</Link>
      </div>
      
      <div className="relative my-6">
         <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
         </div>
         <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Hoặc đăng nhập với</span>
         </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => window.location.href = "http://localhost:8080/restaurantserver/oauth2/authorization/google"}
          className="inline-flex items-center justify-center gap-3 w-full py-2.5 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-all shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
            <path fill="none" d="M1 1h22v22H1z" />
          </svg>
          Sử dụng Google
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
