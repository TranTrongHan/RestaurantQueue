import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useUserStore from '../../store/useUserStore';
import { useCookies } from 'react-cookie';
import { LogOut, User, Menu, X, Calendar, Utensils, Award } from 'lucide-react';

const Header = () => {
  const { user, logout } = useUserStore();
  const [, , removeCookie] = useCookies(["token"]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    removeCookie("token", { path: "/" });
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-gray-950/80 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-primary dark:text-primary-400">
              Restaurant<span className="text-gray-900 dark:text-gray-100 font-black">App</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 transition-colors">Trang Chủ</Link>
            <Link to="/menu" className="text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 transition-colors">Thực đơn</Link>
            {user?.role === "STAFF" && (
              <>
                <Link to="/reservations" className="text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 transition-colors">Danh sách bàn</Link>
                <Link to="/kitchen" className="text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 transition-colors">Đơn bếp</Link>
              </>
            )}
            {user?.role === "CUSTOMER" && <Link to="/booking" className="text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 transition-colors">Đặt bàn</Link>}
            <Link to="/about" className="text-sm font-medium text-gray-700 hover:text-primary dark:text-gray-300 transition-colors">Giới thiệu</Link>
          </nav>

          {/* User Section (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 focus:outline-none transition-colors dark:border-gray-800 dark:hover:bg-gray-900"
                >
                  <img src={user.image || 'https://via.placeholder.com/40'} alt="avatar" className="w-8 h-8 rounded-full object-cover bg-gray-100 border border-gray-200" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 pr-1">Chào {user.fullName}</span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-card border border-gray-100 dark:border-gray-800 py-2 overflow-hidden transform duration-200 opacity-100 scale-100 origin-top-right">
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setIsDropdownOpen(false)}>
                      <User size={16} /> Thông tin cá nhân
                    </Link>
                    {user?.role === "CUSTOMER" && (
                      <Link to="/loyalty" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors dark:text-amber-400 dark:hover:bg-amber-900/20" onClick={() => setIsDropdownOpen(false)}>
                        <Award size={16} /> Thành viên & Ưu đãi
                      </Link>
                    )}
                    {user?.role === "CUSTOMER" && (
                      <Link to="/my-reservations" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setIsDropdownOpen(false)}>
                        <Calendar size={16} /> Thông tin đặt bàn
                      </Link>
                    )}
                    {user?.role === "CUSTOMER" && (
                      <Link to="/online_order" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setIsDropdownOpen(false)}>
                        <Utensils size={16} /> Thông tin món đã đặt
                      </Link>
                    )}
                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
                    <button onClick={() => { handleLogout(); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger-light transition-colors">
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-200 dark:hover:bg-gray-800 transition-colors">Đăng nhập</Link>
                <Link to="/register" className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-lg shadow-primary hover:bg-primary-active transition-all -translate-y-[1px] hover:-translate-y-[2px]">Đăng ký</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-600 hover:text-primary focus:outline-none dark:text-gray-300 transition-colors">
              {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 shadow-lg absolute w-full left-0">
          <div className="px-4 py-4 space-y-2">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-base font-semibold text-gray-800 hover:bg-gray-50 hover:text-primary transition-colors dark:text-gray-200 dark:hover:bg-gray-900">Trang Chủ</Link>
            <Link to="/menu" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-base font-semibold text-gray-800 hover:bg-gray-50 hover:text-primary transition-colors dark:text-gray-200 dark:hover:bg-gray-900">Thực đơn</Link>
            {user?.role === "STAFF" && (
              <>
                <Link to="/reservations" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-base font-semibold text-gray-800 hover:bg-gray-50 hover:text-primary transition-colors dark:text-gray-200 dark:hover:bg-gray-900">Danh sách bàn</Link>
                <Link to="/kitchen" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-base font-semibold text-gray-800 hover:bg-gray-50 hover:text-primary transition-colors dark:text-gray-200 dark:hover:bg-gray-900">Đơn bếp</Link>
              </>
            )}
            {user?.role === "CUSTOMER" && <Link to="/booking" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-base font-semibold text-gray-800 hover:bg-gray-50 hover:text-primary transition-colors dark:text-gray-200 dark:hover:bg-gray-900">Đặt bàn</Link>}

            <div className="border-t border-gray-100 dark:border-gray-800 mt-4 pt-4">
              {user ? (
                <>
                  <div className="px-3 py-2 mb-2 flex items-center gap-3">
                    <img src={user.image} className="w-10 h-10 rounded-full border border-gray-200" alt="avatar" />
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-gray-800 dark:text-gray-100">{user.fullName}</span>
                      <span className="text-xs text-gray-500">{user.role}</span>
                    </div>
                  </div>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors dark:text-gray-400">Thông tin cá nhân</Link>
                  <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-danger hover:bg-danger-light transition-colors">Đăng xuất</button>
                </>
              ) : (
                <div className="flex flex-col gap-3 mt-2">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full text-center px-4 py-3 text-sm font-semibold text-gray-800 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:bg-gray-800 dark:text-gray-200">Đăng nhập</Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="w-full text-center px-4 py-3 text-sm font-semibold text-white bg-primary rounded-lg shadow-primary hover:bg-primary-active transition-colors">Đăng ký</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
