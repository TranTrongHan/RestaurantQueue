import React from 'react';
import useAuthStore from '../store/useAuthStore';
import { 
  BarChart3, 
  Users, 
  ShoppingBag, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const HomePage = () => {
  const { user } = useAuthStore();

  const stats = [
    { label: 'Tổng doanh thu', value: '124.5M', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Khách hàng mới', value: '+1,240', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Đơn hàng hôm nay', value: '45', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Thời gian phục vụ', value: '12m', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Chào mừng trở lại, {user?.username || 'Admin'}! 👋</h1>
          <p className="text-slate-500 mt-1">Dưới đây là tổng quan về hoạt động của nhà hàng hôm nay.</p>
        </div>
        <div className="hidden md:flex bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm items-center gap-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-green-500/20 shadow-lg"></div>
          <span className="text-sm font-semibold text-slate-600">Hệ thống đang hoạt động tốt</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className={`p-3 w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} mb-4 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recent Activity Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center min-h-[400px]">
          <div className="p-4 bg-slate-50 rounded-full mb-6">
            <BarChart3 size={48} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Báo cáo chi tiết</h3>
          <p className="text-slate-400 text-center mt-2 max-w-sm">Chọn một mục từ sidebar để xem báo cáo chi tiết và quản lý các hoạt động.</p>
          <button className="mt-8 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">
            Xem báo cáo ngay
          </button>
        </div>

        {/* Right: Quick Actions/Alerts */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 via-[#1a1f2e] to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-400" />
              Thông báo hệ thống
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-semibold opacity-90">Có 12 đơn hàng mới</p>
                  <p className="text-xs opacity-50 mt-0.5">Vừa xong</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-semibold opacity-90">Đặt bàn lúc 19:00</p>
                  <p className="text-xs opacity-50 mt-0.5">5 phút trước</p>
                </div>
              </li>
              <li className="flex gap-4 opacity-50">
                <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                <div>
                  <p className="text-sm font-semibold">Đã cập nhật thực đơn</p>
                  <p className="text-xs mt-0.5">1 giờ trước</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-rose-50 border border-rose-100 rounded-3xl p-8 flex items-start gap-4 shadow-sm">
            <div className="p-3 bg-white rounded-2xl shadow-sm">
              <AlertCircle size={20} className="text-rose-500" />
            </div>
            <div>
              <h4 className="text-rose-900 font-bold">Cảnh báo</h4>
              <p className="text-rose-700 text-sm mt-1">Cửa hàng số 2 đang có lượng đặt bàn quá tải.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
