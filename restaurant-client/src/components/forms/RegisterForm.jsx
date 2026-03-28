import React, { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import SpinnerComp from "../common/SpinnerComp";
import Apis, { endpoints } from "../configs/Apis";

const RegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    email: "",
    phone: "",
    address: "",
    username: "",
    password: "",
    confirm: "",
  });
  const avatar = useRef();
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    if (formData.password !== formData.confirm) {
      setError("Mật khẩu xác nhận không khớp");
      setValidated(true);
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      data.append("file", avatar.current?.files?.[0] || null);

      let res = await Apis.post(endpoints["register"], data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.code === 200) {
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Đăng ký thất bại");
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null); 
  };

  return (
    <form noValidate className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Cột trái */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1" htmlFor="fullName">Họ và tên</label>
            <input
              required
              id="fullName"
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
            {validated && !formData.fullName && (
              <p className="mt-1.5 text-xs text-danger font-medium">Vui lòng nhập họ và tên.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1" htmlFor="dob">Ngày sinh</label>
            <input
              required
              id="dob"
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
            {validated && !formData.dob && (
              <p className="mt-1.5 text-xs text-danger font-medium">Vui lòng chọn ngày sinh.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1" htmlFor="email">Email</label>
            <input
              required
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
            {validated && !formData.email && (
              <p className="mt-1.5 text-xs text-danger font-medium">Vui lòng nhập email hợp lệ.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1" htmlFor="phone">Số điện thoại</label>
            <input
              required
              id="phone"
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
            {validated && !formData.phone && (
              <p className="mt-1.5 text-xs text-danger font-medium">Vui lòng nhập số điện thoại.</p>
            )}
          </div>
        </div>

        {/* Cột phải */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1" htmlFor="address">Địa chỉ</label>
            <input
              required
              id="address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
            {validated && !formData.address && (
              <p className="mt-1.5 text-xs text-danger font-medium">Vui lòng nhập địa chỉ.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1" htmlFor="username">Tên đăng nhập</label>
            <input
              required
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
            {validated && !formData.username && (
              <p className="mt-1.5 text-xs text-danger font-medium">Vui lòng nhập tên đăng nhập.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1" htmlFor="password">Mật khẩu</label>
            <input
              required
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              minLength={6}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
            {validated && (!formData.password || formData.password.length < 6) && (
              <p className="mt-1.5 text-xs text-danger font-medium">Mật khẩu phải tối thiểu 6 ký tự.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1" htmlFor="confirm">Xác nhận mật khẩu</label>
            <input
              required
              id="confirm"
              type="password"
              name="confirm"
              value={formData.confirm}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 rounded-xl border bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition duration-150 ease-in-out dark:bg-gray-800 dark:text-gray-100 ${error ? 'border-danger focus:ring-danger/50 focus:border-danger' : 'border-gray-200 dark:border-gray-700'}`}
            />
            {validated && (!formData.confirm || error) && (
              <p className="mt-1.5 text-xs text-danger font-medium">{error || "Vui lòng xác nhận mật khẩu."}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1" htmlFor="avatar">Ảnh đại diện</label>
        <input 
          id="avatar"
          type="file" 
          name="file" 
          ref={avatar} 
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all dark:text-gray-400 dark:file:bg-primary/20 dark:hover:file:bg-primary/30"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center items-center py-3 px-4 mt-6 border border-transparent rounded-xl shadow-primary/30 shadow-lg text-sm font-bold text-white bg-primary hover:bg-primary-active focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed -translate-y-[1px] hover:-translate-y-[2px]"
      >
        {loading ? <SpinnerComp className="w-5 h-5 border-2" /> : "Đăng ký ngay"}
      </button>

      <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
        <span className="mr-2">Đã có tài khoản?</span>
        <Link to="/login" className="font-bold text-primary hover:text-primary-active transition-colors">Đăng nhập</Link>
      </div>
    </form>
  );
};

export default RegisterForm;
