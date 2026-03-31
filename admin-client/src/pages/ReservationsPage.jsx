import React, { useEffect, useState } from "react";
import { authApis, endpoints } from "../configs/Apis";
import useAuthStore from "../store/useAuthStore";
import moment from "moment";
import SpinnerComp from "../components/common/SpinnerComp";
import Pagination from "../components/common/Pagination";
import { 
  Users, 
  Clock, 
  Mail, 
  Phone, 
  StickyNote, 
  Search, 
  ListFilter, 
  LogIn,
  MoreVertical,
  CalendarDays,
  User,
  Hash,
  X,
  Info,
  AlertCircle,
  ShoppingCart
} from "lucide-react";
import toast from 'react-hot-toast';
import { db } from "../configs/firebase";
import { collection, onSnapshot, query, doc } from "firebase/firestore";
import axios from "axios";

const STATUS_MAP = {
    BOOKED:     { label: "Chờ đến",      cls: "bg-amber-100 text-amber-700 border-amber-200" },
    CHECKEDIN:  { label: "Đang dùng món", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    REQUEST_PAYMENT: { label: "Chờ thanh toán", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    CHECKEDOUT: { label: "Hoàn tất", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

const StatusBadge = ({ status }) => {
    const s = STATUS_MAP[status] || { label: status, cls: "bg-slate-100 text-slate-500 border-slate-200" };
    return (
        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${s.cls}`}>
            {s.label}
        </span>
    );
};

const ReservationsPage = () => {
    const [reservations, setReservations] = useState([]);
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [loadingBtn, setLoadingBtn] = useState(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("BOOKED");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Real-time Firestore States
    const [realtimeData, setRealtimeData] = useState({}); // { reservationId: { paymentStatus, totalAmount } }
    const [selectedSession, setSelectedSession] = useState(null); // The reservation we are viewing details for
    const [orderItems, setOrderItems] = useState([]); // Order items for the selected session
    const [showModal, setShowModal] = useState(false);

    const fetchReservations = async (page = currentPage) => {
        try {
            setLoading(true);
            let url = `${import.meta.env.VITE_API_BASE_URL}${endpoints["booking"]}`;
            const params = [];
            if (search) params.push(`customer=${search}`);
            if (status) params.push(`status=${status}`);
            params.push(`page=${page}`);
            params.push(`size=10`); // Default size
            
            if (params.length) url += `?${params.join("&")}`;
            const res = await authApis(token).get(url);
            if (res.status === 200) {
                const { data, currentPage: current, totalPages: total, totalElements: totalEl } = res.data.result;
                setReservations(data || []);
                setCurrentPage(current || 1);
                setTotalPages(total || 1);
                setTotalElements(totalEl || 0);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi kết nối máy chủ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReservations(1); }, []); // Initial load

    useEffect(() => { 
        const delayDebounceFn = setTimeout(() => {
            setCurrentPage(1); // Reset to first page
            fetchReservations(1);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search, status]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchReservations(page);
    };

    const realtimeDataRef = React.useRef({});

    // 1. Listen to activeReservations collection for real-time table status
    useEffect(() => {
        const q = query(collection(db, "activeReservations"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = {};
            
            snapshot.docChanges().forEach((change) => {
                if (change.type === "modified") {
                    const newData = change.doc.data();
                    const oldData = realtimeDataRef.current[change.doc.id];
                    const oldStatus = oldData?.status;

                    if (newData.status === "REQUEST_PAYMENT" && oldStatus !== "REQUEST_PAYMENT") {
                        toast(`🔔 Bàn ${newData.tableResponse?.tableName || change.doc.id} đang yêu cầu thanh toán!`, {
                            icon: '💰',
                            duration: 5000,
                            position: 'top-right',
                            style: {
                                borderRadius: '10px',
                                background: '#333',
                                color: '#fff',
                            },
                        });
                    }
                }
            });

            snapshot.docs.forEach(docSnap => {
                data[docSnap.id] = docSnap.data();
            });

            realtimeDataRef.current = data;
            setRealtimeData(data);
        });
        return () => unsubscribe();
    }, []); 


    // 2. Listen to orderItems sub-collection when a session is selected
    useEffect(() => {
        if (!selectedSession) {
            setOrderItems([]);
            return;
        }

        const itemsRef = collection(db, "activeReservations", selectedSession.reservationId.toString(), "orderItems");
        const q = query(itemsRef);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            items.sort((a, b) => (a.orderedAt?.seconds || 0) - (b.orderedAt?.seconds || 0));
            setOrderItems(items);
        });

        return () => unsubscribe();
    }, [selectedSession]);

    const handleCashPayment = async (sessionId) => {
        if (!window.confirm("Xác nhận thanh toán TIỀN MẶT cho bàn này?")) return;
        try {
            setLoadingBtn("cash_" + sessionId);
            const res = await authApis(token).post(`${import.meta.env.VITE_API_BASE_URL}${endpoints["order_session"]}/${sessionId}`);
            if (res.status === 200) {
                toast.success("Thanh toán thành công! Bàn đã được dọn.");
                setShowModal(false);
                fetchReservations();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi thanh toán!");
        } finally {
            setLoadingBtn(null);
        }
    };

    const handleVNPayPayment = async (sessionId) => {
        try {
            setLoadingBtn("vnpay_" + sessionId);
            const returnUrl = `${window.location.origin}/payment-return`;
            const res = await authApis(token).post(
                `${import.meta.env.VITE_API_BASE_URL}${endpoints["order_session"]}/createPayment/${sessionId}?returnUrl=${encodeURIComponent(returnUrl)}`,
                {}
            );
            if (res.status === 200) {
                const paymentUrl = res.data.result;
                if (paymentUrl) {
                    window.open(paymentUrl, "_blank");
                    toast.success("Đã mở trang thanh toán VNPay! Vui lòng hoàn tất tại tab mới.");
                }
            }
        } catch (err) {
            console.error("VNPay Error:", err);
            toast.error(err.response?.data?.message || "Lỗi khởi tạo VNPay!");
        } finally {
            setLoadingBtn(null);
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

    const handleCheckin = async (reservationId) => {
        try {
            setLoadingBtn(reservationId);
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints["booking"]}/${reservationId}`;
            const res = await authApis(token).post(url);
            if (res.status === 200) {
                toast.success("Check-in thành công!");
                fetchReservations();
                const { sessionToken, sessionId, customerJwt } = res.data.result;
                if (sessionToken) {
                    const simUrl = `${window.location.origin}/customer/ordering?token=${customerJwt}&sessionId=${sessionId}&sessionToken=${sessionToken}`;
                    window.open(simUrl, "_blank");
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi check-in!");
        } finally {
            setLoadingBtn(null);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Điều phối bàn</h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý và cập nhật trạng thái khách hàng đặt trước</p>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 font-semibold text-sm">
                   <CalendarDays size={16} />
                   <span>{totalElements} Lượt đặt</span>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 group w-full">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Tìm khách hàng hoặc tên bàn..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400"
                    />
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full">
                        <ListFilter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="BOOKED">Chờ đến</option>
                            <option value="CHECKEDIN">Đã có mặt</option>
                            <option value="CHECKEDOUT">Hoàn tất</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List Section Section */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col space-y-4">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <SpinnerComp className="w-10 h-10 border-blue-600 border-t-transparent" />
                        <p className="mt-4 text-slate-400 text-sm font-medium animate-pulse">Đang đồng bộ dữ liệu...</p>
                    </div>
                ) : reservations.length === 0 ? (
                    <div className="flex-1 bg-white rounded-3xl border border-dashed border-slate-200 py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                           <Search size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">Không tìm thấy kết quả</h3>
                        <p className="text-slate-400 max-w-xs mx-auto mt-1">Vui lòng thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc trạng thái.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-4">
                                {reservations.map((res) => (
                                    <div key={res.reservationId} className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col overflow-hidden">
                                        {/* Card Header & Status */}
                                        <div className="p-4 border-b border-slate-50 flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold 
                                                    ${realtimeData[res.reservationId]?.status === "REQUEST_PAYMENT" 
                                                        ? "bg-amber-500 text-white animate-bounce" 
                                                        : "bg-blue-50 text-blue-600"}`}>
                                                    {realtimeData[res.reservationId]?.status === "REQUEST_PAYMENT" ? "💰" : <Hash size={16} />}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 leading-tight text-sm">{res.tableResponse.tableName}</h3>
                                                    <div className="flex items-center text-[11px] text-slate-500 mt-0.5">
                                                        <Users size={10} className="mr-1" />
                                                        {res.tableResponse.capacity} khách
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <StatusBadge status={realtimeData[res.reservationId]?.status || res.status} />
                                                {realtimeData[res.reservationId]?.status === "REQUEST_PAYMENT" && (
                                                    <span className="text-[9px] font-black text-amber-600 animate-pulse uppercase tracking-tighter">Cần phục vụ 💰</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-4 py-3 space-y-3 flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <User size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Khách hàng</p>
                                                    <p className="text-sm font-bold text-slate-700 truncate">{res.customerResponse.fullName}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                    <Clock size={14} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Thời gian đến</p>
                                                    <p className="text-sm font-bold text-slate-700">{moment(res.checkinTime).format("HH:mm, DD/MM")}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                                                <div className="flex items-center text-[10px] text-slate-500">
                                                    <Phone size={10} className="mr-1.5 text-slate-400" /> {res.customerResponse.phone}
                                                </div>
                                                <div className="flex items-center text-[10px] text-slate-500 truncate">
                                                    <Mail size={10} className="mr-1.5 text-slate-400" /> {res.customerResponse.email}
                                                </div>
                                            </div>

                                            {res.note && (
                                                <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100/50 flex gap-2">
                                                    <StickyNote size={12} className="text-amber-500 shrink-0 mt-0.5" />
                                                    <p className="text-[10px] text-amber-700 leading-relaxed italic line-clamp-1">"{res.note}"</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className={`p-3 px-4 border-t mt-auto flex flex-col gap-2 
                                            ${realtimeData[res.reservationId]?.status === "REQUEST_PAYMENT" 
                                                ? "bg-amber-50 border-amber-100" 
                                                : "bg-slate-50/50 border-slate-100"}`}>
                                            {res.status === "CHECKEDIN" || realtimeData[res.reservationId] ? (
                                                <button
                                                    onClick={() => { setSelectedSession(res); setShowModal(true); }}
                                                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm
                                                        ${realtimeData[res.reservationId]?.status === "REQUEST_PAYMENT" || realtimeData[res.reservationId]?.paymentStatus === "REQUESTED"
                                                            ? "bg-amber-500 text-white hover:bg-amber-600"
                                                            : "bg-white border border-blue-100 text-blue-600 hover:bg-blue-50"}
                                                    `}
                                                >
                                                    <ListFilter size={14} />
                                                    {realtimeData[res.reservationId]?.status === "REQUEST_PAYMENT" ? "XỬ LÝ THANH TOÁN" : "Xem chi tiết ăn uống"}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleCheckin(res.reservationId)}
                                                    disabled={loadingBtn === res.reservationId || res.status !== "BOOKED"}
                                                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm
                                                        ${res.status === "BOOKED" 
                                                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10 active:scale-[0.98]' 
                                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                                                    `}
                                                >
                                                    {loadingBtn === res.reservationId ? (
                                                        <SpinnerComp className="w-4 h-4 border-white border-t-transparent" />
                                                    ) : (
                                                        <>
                                                            <LogIn size={14} />
                                                            Xác nhận có mặt
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pagination Section - Sticky at bottom of this container */}
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
            {/* Session Detail Modal */}
            {showModal && selectedSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-white w-full max-w-4xl max-h-[85vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-600 rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                                    <ShoppingCart size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Chi tiết bàn: {selectedSession.tableResponse.tableName}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Khách: {selectedSession.customerResponse.fullName}</span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border 
                                            ${realtimeData[selectedSession.reservationId]?.status === "REQUEST_PAYMENT" || realtimeData[selectedSession.reservationId]?.paymentStatus === "REQUESTED" 
                                                ? "bg-amber-100 text-amber-600 border-amber-200 animate-pulse" 
                                                : "bg-blue-100 text-blue-600 border-blue-200"}
                                        `}>
                                            {realtimeData[selectedSession.reservationId]?.status === "REQUEST_PAYMENT" || realtimeData[selectedSession.reservationId]?.paymentStatus === "REQUESTED" ? "Yêu cầu thanh toán" : "Đang ăn uống"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-neutral-100 transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 scrollbar-hide">
                            {/* Left: Order Items List */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Danh sách món ăn</h3>
                                {orderItems.length === 0 ? (
                                    <div className="py-20 text-center text-slate-300 italic text-sm">Chưa có món nào được gọi</div>
                                ) : (
                                    <div className="space-y-3">
                                        {orderItems.map(item => (
                                            <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-800">{item.name}</p>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        <span className="text-xs text-slate-400">Qty: {item.quantity}</span>
                                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full
                                                            ${item.status === "PENDING" ? "bg-amber-100 text-amber-600" :
                                                              item.status === "COOKING" ? "bg-blue-100 text-blue-600" :
                                                              item.status === "READY" ? "bg-cyan-100 text-cyan-600" :
                                                              "bg-emerald-100 text-emerald-600"}
                                                        `}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-slate-900 text-sm">{formatPrice(item.price * item.quantity)}</p>
                                                    <p className="text-[10px] text-slate-400">{formatPrice(item.price)}/món</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right: Summary & Actions */}
                            <div className="flex flex-col h-full bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-6 text-center">Hóa đơn tạm tính</h3>
                                
                                <div className="flex-1">
                                    <div className="flex flex-col items-center justify-center py-10 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                        <p className="text-sm font-bold text-slate-400 mb-1">Tổng cộng (sau giảm giá nếu có)</p>
                                        <h4 className="text-5xl font-black text-blue-600 tracking-tighter">
                                            {formatPrice(realtimeData[selectedSession.reservationId]?.totalAmount || 0)}
                                        </h4>
                                    </div>

                                    {realtimeData[selectedSession.reservationId]?.paymentMethod && (
                                        <div className="mt-6 flex items-center justify-center gap-3 py-3 px-6 bg-amber-50 text-amber-700 rounded-2xl border border-amber-200 text-sm font-bold">
                                            <AlertCircle size={16} />
                                            <span>Khách chọn: {realtimeData[selectedSession.reservationId]?.paymentMethod}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-10 space-y-3">
                                    <button 
                                        onClick={() => handleCashPayment(selectedSession.sessionId)}
                                        disabled={loadingBtn === ("cash_" + selectedSession.sessionId)}
                                        className="w-full h-16 bg-slate-900 text-white rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 shadow-xl transition-all active:scale-[0.98]"
                                    >
                                        {loadingBtn === ("cash_" + selectedSession.sessionId) ? (
                                            <SpinnerComp className="w-5 h-5 border-white border-t-transparent" />
                                        ) : (
                                            "Thanh toán TIỀN MẶT"
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => handleVNPayPayment(selectedSession.sessionId)}
                                        disabled={loadingBtn === ("vnpay_" + selectedSession.sessionId)}
                                        className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 shadow-3xl shadow-blue-500/30 transition-all active:scale-[0.98]"
                                    >
                                        {loadingBtn === ("vnpay_" + selectedSession.sessionId) ? (
                                            <SpinnerComp className="w-5 h-5 border-white border-t-transparent" />
                                        ) : (
                                            "Thanh toán Online (VNPay / QR)"
                                        )}
                                    </button>
                                </div>
                                <p className="mt-4 text-[11px] text-center text-slate-400 italic">
                                    Xác nhận thanh toán sẽ kết thúc phiên ăn uống và giải phóng bàn {selectedSession.tableResponse.tableName}.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationsPage;
