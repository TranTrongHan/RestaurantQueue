import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { authApis, endpoints } from "../configs/Apis";
import useAuthStore from "../store/useAuthStore";
import moment from "moment";
import SpinnerComp from "../components/common/SpinnerComp";
import {
    ChevronLeft,
    Users,
    Clock,
    MapPin,
    User,
    Phone,
    Mail,
    CreditCard,
    Banknote,
    CheckCircle2,
    AlertCircle,
    ShoppingCart,
    MoreVertical,
    Calendar,
    ArrowRight,
    Tag,
    Ticket,
    ChevronDown,
    Plus,
    X
} from "lucide-react";
import toast from 'react-hot-toast';
import { db } from "../configs/firebase";
import { collection, onSnapshot, query, doc } from "firebase/firestore";

const STATUS_MAP = {
    BOOKED: { label: "Chờ đến", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    CHECKEDIN: { label: "Đang dùng món", cls: "bg-blue-100 text-blue-700 border-blue-200" },
    REQUEST_PAYMENT: { label: "Chờ thanh toán", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    CHECKEDOUT: { label: "Hoàn tất", cls: "bg-slate-100 text-slate-500 border-slate-200" },
};

const ReservationDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const [reservation, setReservation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingBtn, setLoadingBtn] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [realtimeMeta, setRealtimeMeta] = useState(null);
    const [vouchers, setVouchers] = useState([]);
    const [selectedVoucher, setSelectedVoucher] = useState("");
    const [isManualCode, setIsManualCode] = useState(false);
    const [discountInfo, setDiscountInfo] = useState(null);
    const [showVoucherList, setShowVoucherList] = useState(false);

    const realtimeRef = useRef(null);

    const fetchDetail = async () => {
        try {
            setLoading(true);
            const res = await authApis(token).get(`${endpoints.admin_reservation_detail}/${id}`);
            if (res.status === 200) {
                setReservation(res.data.result);
            }
        } catch (err) {
            toast.error("Không thể tải thông tin đặt bàn");
            navigate("/reservations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id && token) fetchDetail();
    }, [id, token]);

    // Firestore Listener for Real-time Metadata (Total Amount, Status)
    useEffect(() => {
        if (!id) return;
        const resDocRef = doc(db, "activeReservations", id.toString());
        const unsubscribe = onSnapshot(resDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setRealtimeMeta(data);

                // Alert if payment requested
                if (data.status === "REQUEST_PAYMENT" && realtimeRef.current?.status !== "REQUEST_PAYMENT") {
                    toast("🔔 Bàn này đang yêu cầu thanh toán!", { icon: "💰", duration: 5000 });
                }
                realtimeRef.current = data;
            }
        });
        return () => unsubscribe();
    }, [id]);

    // Firestore Listener for Order Items
    useEffect(() => {
        if (!id) return;
        const itemsRef = collection(db, "activeReservations", id.toString(), "orderItems");
        const q = query(itemsRef);
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            items.sort((a, b) => (a.orderedAt?.seconds || 0) - (b.orderedAt?.seconds || 0));
            setOrderItems(items);
        });
        return () => unsubscribe();
    }, [id]);

    // Fetch Customer Vouchers
    const fetchVouchers = async () => {
        if (!reservation?.customer?.userId) return;
        try {
            const res = await authApis(token).get(`${endpoints.admin_customers}/${reservation.customer.userId}/vouchers`);
            if (res.status === 200) {
                setVouchers(res.data.result || []);
            }
        } catch (err) {
            console.error("Lỗi lấy voucher:", err);
        }
    };

    useEffect(() => {
        if (reservation?.customer?.userId) fetchVouchers();
    }, [reservation?.customer?.userId]);

    const handleCheckVoucher = async () => {
        if (!selectedVoucher) {
            setDiscountInfo(null);
            return;
        }
        try {
            setLoadingBtn("check-voucher");
            const res = await authApis(token).post(
                `${import.meta.env.VITE_API_BASE_URL}${endpoints["order_session"]}/check-voucher/${reservation.sessionId}?voucherCode=${selectedVoucher}`
            );
            if (res.status === 200) {
                setDiscountInfo(res.data.result);
                toast.success("Áp dụng mã thành công!");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Mã giảm giá không hợp lệ");
            setDiscountInfo(null);
        } finally {
            setLoadingBtn(null);
        }
    };

    const handleVNPayPayment = async () => {
        try {
            setLoadingBtn("vnpay");
            const returnUrl = `${window.location.origin}/payment-return`;
            const payload = {
                promotionName: selectedVoucher || null,
                paymentType: "VNPAY"
            };
            const res = await authApis(token).post(
                `${import.meta.env.VITE_API_BASE_URL}${endpoints["order_session"]}/createPayment/${reservation.sessionId}?returnUrl=${encodeURIComponent(returnUrl)}`,
                payload
            );
            if (res.status === 200) {
                const paymentUrl = res.data.result;
                if (paymentUrl) window.open(paymentUrl, "_blank");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi khởi tạo VNPay!");
        } finally {
            setLoadingBtn(null);
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0) + 'đ';

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center p-20">
            <SpinnerComp className="w-10 h-10 border-blue-600 border-t-transparent" />
            <p className="mt-4 text-slate-400 font-medium animate-pulse">Đang tải dữ liệu chi tiết...</p>
        </div>
    );

    if (!reservation) return null;

    const currentStatus = realtimeMeta?.status || reservation.status;
    const statusInfo = STATUS_MAP[currentStatus] || { label: currentStatus, cls: "bg-slate-100 text-slate-500" };

    return (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-500">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/reservations")}
                        className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                            <Link to="/reservations" className="hover:text-blue-600">ĐIỀU PHỐI BÀN</Link>
                            <span>/</span>
                            <span className="text-slate-800">CHI TIẾT BÀN {reservation.table?.tableName}</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Chi tiết bàn: {reservation.table?.tableName}
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${statusInfo.cls}`}>
                                {statusInfo.label}
                            </span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {currentStatus === "REQUEST_PAYMENT" && (
                        <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-200 flex items-center gap-2 animate-pulse">
                            <AlertCircle size={16} />
                            <span className="text-sm font-bold uppercase tracking-tight">Cần xử lý thanh toán</span>
                        </div>
                    )}
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
                        <Calendar size={16} />
                        <span className="text-sm font-bold">{moment(reservation.checkinTime).format("HH:mm, DD/MM/YYYY")}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Content: Order List (Real-time) */}
                <div className="lg:col-span-2 flex flex-col space-y-6">
                    <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ShoppingCart size={16} /> Danh sách món đã gọi ({orderItems.length})
                            </h3>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto max-h-[600px] scrollbar-hide">
                            {orderItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center py-20 text-slate-300 italic">
                                    <ShoppingCart size={48} className="mb-4 opacity-20" />
                                    <p>Chưa có món nào được gọi trong phiên này</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orderItems.map((item, idx) => (
                                        <div key={item.id} className="group flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-blue-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-base">{item.name}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs font-bold text-slate-400">Số lượng: {item.quantity}</span>
                                                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full
                                                            ${item.status === "PENDING" ? "bg-amber-100 text-amber-600" :
                                                                item.status === "COOKING" ? "bg-blue-100 text-blue-600" :
                                                                    item.status === "READY" ? "bg-cyan-100 text-cyan-600" :
                                                                        "bg-emerald-100 text-emerald-600"}
                                                        `}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-900 text-lg">{formatPrice(item.price * item.quantity)}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{formatPrice(item.price)}/món</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Info & Payment */}
                <div className="space-y-6">
                    {/* Customer Info Card */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-4">
                            <User size={16} /> Thông tin khách hàng
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <User size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tên khách hàng</p>
                                    <p className="text-lg font-black text-slate-800">{reservation.customer?.fullName}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 pt-2">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Phone size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold">{reservation.customer?.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Mail size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold">{reservation.customer?.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <MapPin size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold">Bàn {reservation.table?.tableName} ({reservation.table?.capacity} chỗ)</span>
                                </div>
                            </div>
                        </div>

                        {reservation.note && (
                            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 italic">
                                <Info size={18} className="text-amber-500 shrink-0" />
                                <p className="text-xs text-amber-800 leading-relaxed">"{reservation.note}"</p>
                            </div>
                        )}
                    </div>

                    {/* Order Summary & Payment actions */}
                    <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl space-y-8 relative">
                        {/* Decorative circle */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center border-b border-white/10 pb-4 mb-6">Tạm tính hóa đơn</h3>

                            <div className="flex flex-col items-center justify-center py-4 border-b border-white/10 mb-6">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Tổng tiền món ăn</p>
                                <h4 className={`font-black text-white tracking-tighter transition-all ${discountInfo ? 'text-2xl opacity-50' : 'text-5xl'}`}>
                                    {formatPrice(realtimeMeta?.totalAmount || 0)}
                                </h4>
                                {discountInfo && (
                                    <div className="flex flex-col items-center mt-2 animate-in slide-in-from-top-2 duration-300">
                                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Tiết kiệm: -{formatPrice(discountInfo.discount)}</p>
                                        <h4 className="text-5xl font-black text-white tracking-tighter">
                                            {formatPrice(discountInfo.finalTotal)}
                                        </h4>
                                    </div>
                                )}
                            </div>

                            {/* Voucher Section */}
                            <div className="mb-8 space-y-3">
                                <label className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                    <span>Mã giảm giá</span>
                                    <button 
                                        onClick={() => setIsManualCode(!isManualCode)}
                                        className="text-blue-400 hover:text-blue-300 transition-colors capitalize"
                                    >
                                        {isManualCode ? "Chọn từ danh sách" : "Nhập mã tay"}
                                    </button>
                                </label>

                                {isManualCode ? (
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                            <input 
                                                type="text"
                                                value={selectedVoucher}
                                                onChange={(e) => setSelectedVoucher(e.target.value.toUpperCase())}
                                                placeholder="NHẬP MÃ..."
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleCheckVoucher}
                                            disabled={loadingBtn === "check-voucher" || !selectedVoucher}
                                            className="px-6 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all disabled:opacity-50"
                                        >
                                            {loadingBtn === "check-voucher" ? "..." : "ÁP DỤNG"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <button 
                                            onClick={() => setShowVoucherList(!showVoucherList)}
                                            className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-left group hover:bg-white/10 transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Ticket size={18} className="text-slate-500" />
                                                <span className={`text-sm font-bold ${selectedVoucher ? 'text-white' : 'text-slate-500'}`}>
                                                    {selectedVoucher || "Chọn voucher của khách..."}
                                                </span>
                                            </div>
                                            <ChevronDown size={18} className={`text-slate-500 transition-transform ${showVoucherList ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showVoucherList && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl p-2 max-h-48 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2">
                                                {vouchers.length === 0 ? (
                                                    <p className="text-[10px] text-slate-500 text-center py-4 font-bold">Khách chưa có voucher nào</p>
                                                ) : (
                                                    vouchers.filter(v => !v.isUsed).map(v => (
                                                        <button 
                                                            key={v.id}
                                                            onClick={() => {
                                                                setSelectedVoucher(v.voucher.voucherCode);
                                                                setShowVoucherList(false);
                                                                // Auto trigger check
                                                                setTimeout(() => handleCheckVoucher(), 100);
                                                            }}
                                                            className={`w-full text-left p-3 rounded-xl hover:bg-white/5 transition-all mb-1 ${selectedVoucher === v.voucher.voucherCode ? 'bg-blue-600/20 border border-blue-500/30' : ''}`}
                                                        >
                                                            <div className="flex justify-between items-center mb-0.5">
                                                                <p className="text-xs font-black text-white">{v.voucher.voucherCode}</p>
                                                                <span className="text-[9px] font-black text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded uppercase">
                                                                    -{v.voucher.discountValue}{v.voucher.voucherType === 'PERCENTAGE' ? '%' : 'đ'}
                                                                </span>
                                                            </div>
                                                            <p className="text-[10px] font-bold text-slate-400 truncate">{v.voucher.voucherName}</p>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {discountInfo && (
                                    <div className="flex items-center justify-between px-2 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Đã áp dụng mã</span>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setSelectedVoucher("");
                                                setDiscountInfo(null);
                                            }}
                                            className="text-slate-400 hover:text-white transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleVNPayPayment}
                                    disabled={loadingBtn === "vnpay" || !reservation?.sessionId}
                                    className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-500 shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loadingBtn === "vnpay" ? <SpinnerComp className="w-5 h-5 border-white border-t-transparent" /> : (
                                        <>
                                            <ShoppingCart size={20} />
                                            VNPay / QR Online
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="text-[10px] text-center text-slate-500 italic mt-6 px-4">
                                Xác nhận thanh toán sẽ tự động hoàn tất đơn hàng và giải phóng trạng thái bàn.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReservationDetailPage;
