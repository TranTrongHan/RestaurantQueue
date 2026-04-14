import React, { useEffect, useState, useCallback } from "react";
import { authApis, endpoints } from "../configs/Apis";
import useAuthStore from "../store/useAuthStore";
import SpinnerComp from "../components/common/SpinnerComp";
import Pagination from "../components/common/Pagination";
import moment from "moment";
import toast from "react-hot-toast";
import {
  ShoppingBag,
  Search,
  ListFilter,
  X,
  Calendar,
  User,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  Package,
  Hash,
  CreditCard,
  Eye,
  ArrowRight
} from "lucide-react";

const OnlineOrdersPage = () => {
  const { token } = useAuthStore();

  // List state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [isPaidFilter, setIsPaidFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrders = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = { page, size: 8 };
        if (search) params.customer = search;
        if (isPaidFilter !== "") params.isPaid = isPaidFilter;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;

        const res = await authApis(token).get(
          `${import.meta.env.VITE_API_BASE_URL}${endpoints.admin_online_order}`,
          { params }
        );
        const result = res.data?.result;
        setOrders(result?.data || []);
        setCurrentPage(result?.currentPage || 1);
        setTotalPages(result?.totalPages || 1);
        setTotalElements(result?.totalElements || 0);
      } catch (err) {
        toast.error(err.response?.data?.message || "Lỗi kết nối máy chủ");
      } finally {
        setLoading(false);
      }
    },
    [token, search, isPaidFilter, fromDate, toDate]
  );

  useEffect(() => {
    fetchOrders(1);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchOrders(1), 500);
    return () => clearTimeout(t);
  }, [search, isPaidFilter, fromDate, toDate]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchOrders(page);
  };

  const handleViewDetail = async (orderId) => {
    try {
      setDetailLoading(true);
      const res = await authApis(token).get(
        `${import.meta.env.VITE_API_BASE_URL}${endpoints.admin_online_order}/${orderId}`
      );
      setSelectedOrder(res.data?.result);
      setShowModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể tải chi tiết đơn hàng");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  const formatDate = (dateString) => moment(dateString).format("HH:mm, DD/MM/YYYY");

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Đơn đặt hàng Online</h1>
          <p className="text-slate-500 font-medium">Quản lý và vận hành các đơn hàng trực tuyến từ khách hàng</p>
        </div>
        <div className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl border border-blue-100 flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Package size={16} />
          </div>
          <span className="text-sm font-black uppercase tracking-wider">{totalElements} Tổng số đơn</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo Tên khách hàng, Email..." 
            className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative min-w-[200px]">
            <ListFilter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            <select 
              className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-bold appearance-none cursor-pointer"
              value={isPaidFilter}
              onChange={(e) => setIsPaidFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đã thanh toán</option>
              <option value="false">Chưa thanh toán</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-2 border border-slate-100">
            <Calendar size={14} className="text-slate-400" />
            <input 
              type="date" 
              className="bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-tighter"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <ArrowRight size={12} className="text-slate-300 mx-1" />
            <input 
              type="date" 
              className="bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-tighter"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mã đơn</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Khách hàng</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thời gian</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thanh toán</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-8 py-6 h-20 bg-slate-50/20"></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-slate-200">
                        <ShoppingBag size={40} />
                      </div>
                      <p className="text-slate-400 font-bold italic">Không tìm thấy đơn hàng nào</p>
                    </div>
                  </td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order.onlineOrderId} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        <Hash size={14} />
                      </div>
                      <span className="font-black text-slate-800 tracking-tighter">#{order.onlineOrderId}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-black text-slate-800 leading-none mb-1.5">{order.customerName || order.fullName || "—"}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail size={10} /> {order.email || "—"}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-bold text-slate-600">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-8 py-6">
                    {order.isPaid ? (
                      <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg border border-emerald-100 flex items-center gap-2 w-fit">
                        <CheckCircle size={10} /> Đã thanh toán
                      </span>
                    ) : (
                      <span className="px-4 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-lg border border-rose-100 flex items-center gap-2 w-fit">
                        <Clock size={10} /> Chờ thanh toán
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleViewDetail(order.onlineOrderId)}
                      className="px-6 py-2.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-black rounded-xl hover:bg-blue-600 transition-all shadow-lg active:scale-95 flex items-center gap-2 ml-auto"
                    >
                      <Eye size={14} /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Container */}
        <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trang {currentPage} / {totalPages}</span>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </div>
      </div>

      {/* Modern Detail Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Chi tiết đơn hàng</h2>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Order #{selectedOrder.onlineOrderId}</p>
                </div>
              </div>
              <button onClick={closeModal} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:shadow-xl transition-all"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-thin scrollbar-thumb-slate-200">
              {/* Customer Info Card */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-blue-400 rounded-full"></div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thông tin giao dịch</h3>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <User size={14} className="text-blue-400" />
                      <p className="text-sm font-bold">{selectedOrder.customerName || selectedOrder.fullName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail size={14} className="text-blue-400" />
                      <p className="text-sm font-bold opacity-80">{selectedOrder.email}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Phone size={14} className="text-blue-400" />
                        <p className="text-sm font-bold">{selectedOrder.phone || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <CreditCard size={14} className="text-blue-400" />
                        <p className="text-[10px] font-black bg-blue-500/20 px-3 py-1 rounded-full uppercase truncate max-w-[150px]">{selectedOrder.paymentMethod || 'VNPAY'}</p>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/10">
                    <div className="flex gap-3">
                        <Clock size={14} className="text-slate-500 shrink-0 mt-1" />
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 mb-1">Thời gian đặt</p>
                            <p className="text-xs font-black">{formatDate(selectedOrder.createdAt)}</p>
                        </div>
                    </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-slate-900 rounded-full"></div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sản phẩm đã đặt</h3>
                </div>
                <div className="space-y-3">
                  {selectedOrder.orderItems?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white transition-all hover:shadow-lg">
                      <div className="flex items-center gap-5">
                         <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center font-black text-slate-400 shadow-sm overflow-hidden">
                            {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package size={20} />}
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-900">{item.name || item.menuItemName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{item.quantity} x {formatPrice(item.price)}</p>
                         </div>
                      </div>
                      <p className="font-black text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng thanh toán</span>
                <span className="text-3xl font-black text-blue-600">{formatPrice(selectedOrder.totalAmount || 0)}</span>
              </div>
              <div className="flex items-center gap-3">
                 {selectedOrder.isPaid ? (
                    <span className="px-6 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-lg shadow-emerald-500/20">Đã thanh toán</span>
                 ) : (
                    <span className="px-6 py-3 bg-rose-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-lg shadow-rose-500/20">Chưa thanh toán</span>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineOrdersPage;
