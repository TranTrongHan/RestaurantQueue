import React, { useEffect, useState, useCallback } from "react";
import { authApis, endpoints } from "../configs/Apis";
import useAuthStore from "../store/useAuthStore";
import SpinnerComp from "../components/common/SpinnerComp";
import Pagination from "../components/common/Pagination";
import moment from "moment";
import toast from "react-hot-toast";
import {
  ShoppingCart,
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
} from "lucide-react";

const isPaidBadge = (isPaid) =>
  isPaid ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-600 border-emerald-200 uppercase tracking-wider">
      <CheckCircle size={10} /> Đã thanh toán
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-100 text-amber-600 border-amber-200 uppercase tracking-wider">
      <Clock size={10} /> Chưa thanh toán
    </span>
  );

const formatPrice = (price) =>
  price != null ? new Intl.NumberFormat("vi-VN").format(price) + "đ" : "—";

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
        const params = { page, size: 10 };
        if (search) params.customer = search;
        if (isPaidFilter !== "") params.isPaid = isPaidFilter;
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;

        const res = await authApis(token).get(
          `${import.meta.env.VITE_API_BASE_URL}${endpoints.online_order}/admin`,
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

  // Initial load
  useEffect(() => {
    fetchOrders(1);
  }, []);

  // Debounced filter
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
        `${import.meta.env.VITE_API_BASE_URL}${endpoints.online_order}/admin/${orderId}`
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

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <ShoppingCart className="text-blue-600" size={26} />
            Đơn đặt hàng Online
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý và theo dõi các đơn đặt hàng trực tuyến
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 font-semibold text-sm">
          <Package size={16} />
          <span>{totalElements} Đơn hàng</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] group">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
          />
          <input
            type="text"
            placeholder="Tìm khách hàng / email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* isPaid filter */}
        <div className="relative min-w-[160px]">
          <ListFilter
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <select
            value={isPaidFilter}
            onChange={(e) => setIsPaidFilter(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đã thanh toán</option>
            <option value="false">Chưa thanh toán</option>
          </select>
        </div>

        {/* From date */}
        <div className="relative min-w-[150px]">
          <Calendar
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full pl-10 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
          />
        </div>

        {/* To date */}
        <div className="relative min-w-[150px]">
          <Calendar
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full pl-10 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col space-y-4">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <SpinnerComp className="w-10 h-10 border-blue-600 border-t-transparent" />
            <p className="mt-4 text-slate-400 text-sm font-medium animate-pulse">
              Đang tải danh sách đơn hàng...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex-1 bg-white rounded-3xl border border-dashed border-slate-200 py-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">
              Không tìm thấy đơn hàng
            </h3>
            <p className="text-slate-400 max-w-xs mx-auto mt-1">
              Thử thay đổi từ khóa hoặc bộ lọc.
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                  <tr>
                    <th className="text-left px-5 py-3.5 text-xs font-black text-slate-400 uppercase tracking-widest">
                      #
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-black text-slate-400 uppercase tracking-widest">
                      Khách hàng
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-black text-slate-400 uppercase tracking-widest">
                      Thời gian
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-black text-slate-400 uppercase tracking-widest">
                      Tổng tiền
                    </th>
                    <th className="text-left px-5 py-3.5 text-xs font-black text-slate-400 uppercase tracking-widest">
                      Thanh toán
                    </th>
                    <th className="text-right px-5 py-3.5 text-xs font-black text-slate-400 uppercase tracking-widest">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map((order) => (
                    <tr
                      key={order.onlineOrderId}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Hash size={13} className="text-blue-500" />
                          </div>
                          <span className="font-bold text-slate-700 text-xs">
                            {order.onlineOrderId}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {order.customerName || order.fullName || "—"}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <Mail size={10} />
                            {order.email || "—"}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700 font-medium">
                          {order.createdAt
                            ? moment(order.createdAt).format("HH:mm, DD/MM/YYYY")
                            : "—"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-black text-slate-800">
                          {formatPrice(order.totalAmount)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {isPaidBadge(order.isPaid)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleViewDetail(order.onlineOrderId)}
                          disabled={detailLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 transition-all active:scale-95"
                        >
                          <Eye size={13} />
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mt-auto">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Đơn hàng #{selectedOrder.onlineOrderId}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {isPaidBadge(selectedOrder.isPaid)}
                    <span className="text-xs text-slate-400">
                      {selectedOrder.createdAt
                        ? moment(selectedOrder.createdAt).format("HH:mm, DD/MM/YYYY")
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
              {/* Customer Info */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Thông tin khách hàng
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <User size={15} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Họ tên</p>
                    <p className="text-sm font-bold text-slate-800">
                      {selectedOrder.customerName || selectedOrder.fullName || "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Mail size={15} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="text-sm font-bold text-slate-800">
                      {selectedOrder.email || "—"}
                    </p>
                  </div>
                </div>
                {selectedOrder.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Phone size={15} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Điện thoại</p>
                      <p className="text-sm font-bold text-slate-800">
                        {selectedOrder.phone}
                      </p>
                    </div>
                  </div>
                )}
                {selectedOrder.paymentMethod && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <CreditCard size={15} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Phương thức thanh toán</p>
                      <p className="text-sm font-bold text-slate-800">
                        {selectedOrder.paymentMethod}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items */}
              {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    Danh sách món
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.orderItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl px-5 py-3 hover:border-blue-100 transition-all"
                      >
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {item.name || item.menuItemName}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatPrice(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <p className="font-black text-slate-900 text-sm">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between bg-blue-600 text-white rounded-2xl px-6 py-4">
                <span className="font-black uppercase tracking-wider text-sm">
                  Tổng cộng
                </span>
                <span className="text-2xl font-black">
                  {formatPrice(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineOrdersPage;
