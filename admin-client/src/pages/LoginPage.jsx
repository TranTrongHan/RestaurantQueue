import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useCookies } from 'react-cookie';
import toast from 'react-hot-toast';
import Apis, { authApis, endpoints } from '../configs/Apis';
import useAuthStore from '../store/useAuthStore';
import bgImage from '/img/bg.png';
import foodImage from '/img/image-1.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const [, setCookie] = useCookies(['token']);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    try {
      setLoading(true);
      const res = await Apis.post(endpoints.login, formData);

      if (res.data.code === 200) {
        const token = res.data.result?.token;
        setCookie('token', token, { path: '/', maxAge: 86400 * 7 }); // 7 days

        const userRes = await authApis(token).get(endpoints.profile);
        login(userRes.data?.result, token);

        toast.success('Đăng nhập thành công!');
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('Tên đăng nhập hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      {/* Left Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24 xl:px-32">
        <div className="max-w-md w-full animate-in fade-in slide-in-from-left duration-700">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-extrabold text-[#071437] mb-2">
              Đăng nhập hệ thống
            </h1>
            <p className="text-[#99A1B7] font-medium text-lg">
              Quản trị hệ thống
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-bold text-[#252F4A]">
                Tên đăng nhập
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#99A1B7] group-focus-within:text-primary transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Tên đăng nhập"
                  className="block w-full pl-11 pr-4 py-3.5 bg-white border border-[#DBDFE9] rounded-xl text-[#252F4A] placeholder-[#99A1B7] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all active:scale-[0.99]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-[#252F4A]">
                  Mật khẩu
                </label>
                <a href="#" className="text-sm font-bold text-primary hover:underline">
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#99A1B7] group-focus-within:text-primary transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mật khẩu"
                  className="block w-full pl-11 pr-12 py-3.5 bg-white border border-[#DBDFE9] rounded-xl text-[#252F4A] placeholder-[#99A1B7] focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all active:scale-[0.99]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#99A1B7] hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-primary-active transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="mt-12 text-center lg:text-left">
            <p className="text-xs text-[#99A1B7] font-medium">
              © 2025 Admin System. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Visual Image */}
      <div
        className="hidden lg:flex w-1/2 relative justify-center items-center bg-[#030A1E] overflow-hidden"
        style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover' }}
      >
        {/* Overlay to darken background further */}
        <div className="absolute inset-0 bg-gray/70" />

        <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-12 animate-in fade-in zoom-in duration-1000">
          <div className="mb-12">
            <img
              src={foodImage}
              alt="Restaurant Cuisine"
              className="shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full h-auto object-cover transform hover:scale-[1.02] transition-transform duration-500"
            />
          </div>

          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-white leading-tight">
              Chào mừng đến với<br />
              Hệ thống quản trị
            </h2>
            <p className="text-white/70 text-lg font-medium">
              Quản lý toàn bộ hệ thống một cách hiệu quả và chuyên nghiệp
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#030A1E] to-transparent opacity-50 pointer-events-none" />
      </div>
    </div>
  );
};

export default LoginPage;
