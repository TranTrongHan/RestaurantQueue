import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    ShoppingCart,
    Grid,
    List,
    PlusCircle,
    QrCode,
    Play
} from "lucide-react";
import toast from 'react-hot-toast';
import { db } from "../configs/firebase";
import { collection, onSnapshot, query, doc } from "firebase/firestore";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";

const STATUS_MAP = {
    BOOKED: { label: "Chờ đến", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    CHECKEDIN: { label: "Đang dùng món", cls: "bg-blue-100 text-blue-700 border-blue-200" },
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
    const [viewMode, setViewMode] = useState("list"); // list or map
    const [reservations, setReservations] = useState([]);
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [loadingBtn, setLoadingBtn] = useState(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    // Table Map States
    const [tables, setTables] = useState([]);
    const [loadingTables, setLoadingTables] = useState(false);
    const [qrTable, setQrTable] = useState(null);
    const [qrToken, setQrToken] = useState("");
    const [loadingQR, setLoadingQR] = useState(false);

    // Real-time Firestore States
    const [realtimeData, setRealtimeData] = useState({}); // { reservationId: { paymentStatus, totalAmount } }
    const navigate = useNavigate();

    const fetchReservations = async (page = currentPage) => {
        try {
            setLoading(true);
            let url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.admin_reservation}`;
            const params = [];
            if (search) params.push(`customer=${search}`);
            if (status) params.push(`status=${status}`);
            params.push(`page=${page}`);
            params.push(`size=10`); // Default size

            if (params.length) url += `?${params.join("&")}`;
            const res = await authApis(token).get(url);
            if (res.status === 200) {
                const { data, currentPage: current, totalPages: total, totalElements: totalEl } = res.data?.result || {};
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

    const fetchTables = async () => {
        try {
            setLoadingTables(true);
            const res = await authApis(token).get(`${import.meta.env.VITE_API_BASE_URL}${endpoints.admin_tables}`);
            if (res.status === 200) {
                setTables(res.data.result || []);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi tải sơ đồ bàn");
        } finally {
            setLoadingTables(false);
        }
    };

    useEffect(() => {
        fetchReservations(1);
    }, []); // Initial load

    useEffect(() => {
        if (viewMode === "map") {
            fetchTables();
        }
    }, [viewMode]);

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
                        toast(`🔔 Bàn ${newData.tableName || change.doc.id} đang yêu cầu thanh toán!`, {
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

    // Load Session Token for selected QR table
    useEffect(() => {
        if (!qrTable) {
            setQrToken("");
            return;
        }

        if (qrTable.isActivationQR) {
            setQrToken("ACTIVATION");
            return;
        }

        const loadQRToken = async () => {
            try {
                setLoadingQR(true);
                const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/order_session/active-session?tableId=${qrTable.tableId}`);
                if (res.status === 200 && res.data.result?.valid) {
                    setQrToken(res.data.result.reservationResponse.sessionToken);
                } else {
                    toast.error("Không lấy được token phiên ăn!");
                }
            } catch (err) {
                console.error("QR token error:", err);
                toast.error("Lỗi lấy thông tin phiên");
            } finally {
                setLoadingQR(false);
            }
        };

        loadQRToken();
    }, [qrTable]);

    const handleCheckin = async (reservationId) => {
        try {
            setLoadingBtn(reservationId);
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.admin_reservation}/${reservationId}`;
            const res = await authApis(token).post(url);
            if (res.status === 200) {
                toast.success("Check-in thành công!");
                fetchReservations();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi check-in!");
        } finally {
            setLoadingBtn(null);
        }
    };

    const handleQuickCheckin = async (tableId) => {
        try {
            setLoadingBtn(tableId);
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.admin_quick_checkin}?tableId=${tableId}`;
            const res = await authApis(token).post(url);
            if (res.status === 200) {
                toast.success("Mở bàn khách vãng lai thành công!");
                fetchTables();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi mở bàn vãng lai!");
        } finally {
            setLoadingBtn(null);
        }
    };

    const getActiveResForTable = (tableId) => {
        return Object.values(realtimeData).find(res => parseInt(res.tableId) === tableId);
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Điều phối bàn</h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý và cập nhật trạng thái khách hàng đặt trước</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Switcher */}
                    <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                        >
                            <List size={16} /> Danh sách đặt bàn
                        </button>
                        <button
                            onClick={() => setViewMode("map")}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "map" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                        >
                            <Grid size={16} /> Sơ đồ bàn
                        </button>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 font-semibold text-sm">
                        <CalendarDays size={16} />
                        <span>{totalElements} Lượt đặt</span>
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {viewMode === "list" ? (
                    <div className="flex-1 flex flex-col space-y-4 min-h-0">
                        {/* Filter Section */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4 shrink-0">
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
                        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
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
                                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 pb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                                                            onClick={() => navigate(`/reservations/${res.reservationId}`)}
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
                            )}

                            {/* Pagination Section - Sticky at bottom of this container */}
                            {reservations.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mt-auto shrink-0">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Sơ đồ bàn view */
                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                        {loadingTables ? (
                            <div className="h-full flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                                <SpinnerComp className="w-10 h-10 border-blue-600 border-t-transparent" />
                                <p className="mt-4 text-slate-400 text-sm font-medium animate-pulse">Đang tải sơ đồ bàn...</p>
                            </div>
                        ) : tables.length === 0 ? (
                            <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-250 font-medium">
                                Chưa có bàn ăn nào được cấu hình trong hệ thống.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-6">
                                {tables.map((table) => {
                                    const activeRes = getActiveResForTable(table.tableId);
                                    const isOccupied = !!activeRes;

                                    return (
                                        <div
                                            key={table.tableId}
                                            className={`group rounded-3xl border p-5 flex flex-col shadow-sm transition-all duration-350 hover:shadow-xl hover:-translate-y-1
                                                ${isOccupied
                                                    ? activeRes.status === "REQUEST_PAYMENT"
                                                        ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/20"
                                                        : "bg-blue-50/70 border-blue-200"
                                                    : "bg-white border-slate-200 hover:border-slate-350"}`}
                                        >
                                            {/* Card Top */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm
                                                        ${isOccupied
                                                            ? activeRes.status === "REQUEST_PAYMENT"
                                                                ? "bg-amber-500 text-white animate-bounce"
                                                                : "bg-blue-600 text-white"
                                                            : "bg-slate-100 text-slate-500"}`}>
                                                        {isOccupied && activeRes.status === "REQUEST_PAYMENT" ? "💰" : table.tableName.replace(/\D/g, "") || "T"}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-extrabold text-slate-800 leading-tight text-base">{table.tableName}</h3>
                                                        <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <Users size={12} /> {table.capacity} chỗ ngồi
                                                        </span>
                                                    </div>
                                                </div>

                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm
                                                    ${isOccupied
                                                        ? activeRes.status === "REQUEST_PAYMENT"
                                                            ? "bg-amber-100 text-amber-700 border-amber-300 animate-pulse"
                                                            : "bg-blue-100 text-blue-700 border-blue-300"
                                                        : "bg-emerald-50 text-emerald-700 border-emerald-300"}`}>
                                                    {isOccupied
                                                        ? activeRes.status === "REQUEST_PAYMENT"
                                                            ? "Chờ thanh toán 💰"
                                                            : "Đang dùng món"
                                                        : "Bàn trống"}
                                                </span>
                                            </div>

                                            {/* Card Middle Info */}
                                            <div className="flex-1 space-y-3 mb-5 border-t border-slate-100 pt-3 text-sm">
                                                {isOccupied ? (
                                                    <>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-400 font-bold">Khách:</span>
                                                            <span className="text-slate-700 font-black truncate max-w-[120px]">{activeRes.customerName}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-400 font-bold">Tạm tính:</span>
                                                            <span className="text-blue-600 font-extrabold text-sm">{formatPrice(activeRes.totalAmount || 0)}</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-slate-400 font-medium text-xs py-2 leading-relaxed">
                                                        Bàn hiện đang khả dụng. Bấm mở bàn nhanh để đón khách vãng lai và kích hoạt máy tính bảng.
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card Footer Actions */}
                                            <div className="space-y-2 mt-auto">
                                                {isOccupied ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setQrTable(table)}
                                                            className="px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 flex items-center justify-center transition-all shadow-sm"
                                                            title="Xem mã QR phiên"
                                                        >
                                                            <QrCode size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/reservations/${activeRes.reservationId}`)}
                                                            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 shadow-sm
                                                                ${activeRes.status === "REQUEST_PAYMENT"
                                                                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                                                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10"}`}
                                                        >
                                                            <ListFilter size={14} />
                                                            {activeRes.status === "REQUEST_PAYMENT" ? "THANH TOÁN" : "Xem ăn uống"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setQrTable({ ...table, isActivationQR: true })}
                                                            className="px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 flex items-center justify-center transition-all shadow-sm"
                                                            title="Xem mã QR Kích Hoạt Bàn"
                                                        >
                                                            <QrCode size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleQuickCheckin(table.tableId)}
                                                            disabled={loadingBtn === table.tableId}
                                                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1 disabled:bg-slate-200"
                                                        >
                                                            {loadingBtn === table.tableId ? (
                                                                <SpinnerComp className="w-4 h-4 border-white border-t-transparent" />
                                                            ) : (
                                                                <>
                                                                    <PlusCircle size={14} /> Mở bàn nhanh
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
							</div>
                        )}
                    </div>
                )}
            </div>

            {/* QR Modal Popup */}
            {qrTable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setQrTable(null)}></div>
                    <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="w-full flex items-center justify-between border-b pb-3">
                            <h3 className="font-extrabold text-slate-800 text-base">QR Gọi Món - {qrTable.tableName}</h3>
                            <button
                                onClick={() => setQrTable(null)}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-250 flex items-center justify-center text-slate-500 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* QR Code display */}
                        {loadingQR ? (
                            <div className="h-64 flex flex-col items-center justify-center">
                                <SpinnerComp className="w-8 h-8 border-blue-600 border-t-transparent" />
                                <p className="text-slate-400 text-xs mt-3">Đang tạo mã QR...</p>
                            </div>
                        ) : qrToken ? (
                            <div className="space-y-4">
                                <QRCodeSVG
                                    value={
                                        qrTable.isActivationQR
                                            ? `${import.meta.env.VITE_API_BASE_URL}/order_session/activate-by-scan?tableId=${qrTable.tableId}`
                                            : `http://${window.location.hostname}:5173/menu?token=${qrToken}`
                                    }
                                    size={220}
                                    className="mx-auto border p-4 bg-white rounded-2xl shadow-sm"
                                />
                                <p className="text-[11px] text-slate-400 font-semibold max-w-[240px] mx-auto leading-relaxed">
                                    {qrTable.isActivationQR
                                        ? "Khách dùng camera điện thoại quét mã này để kích hoạt bàn ăn từ xa."
                                        : "Khách hàng dùng camera điện thoại quét mã này để vào gọi món trực tiếp."}
                                </p>
                            </div>
                        ) : (
                            <div className="text-red-500 text-xs py-10 font-bold">Không thể khởi tạo mã QR!</div>
                        )}

                        {/* Simulator controls */}
                        <div className="w-full border-t pt-4 space-y-2">
                            {qrTable.isActivationQR && (
                                <button
                                    onClick={() => {
                                        const scanUrl = `${import.meta.env.VITE_API_BASE_URL}/order_session/activate-by-scan?tableId=${qrTable.tableId}`;
                                        window.open(scanUrl, "_blank");
                                        setQrTable(null);
                                    }}
                                    className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                >
                                    <QrCode size={14} /> Giả lập quét QR (Khách quét điện thoại)
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    const simUrl = `http://localhost:5173/menu?tableMode=true&tableId=${qrTable.tableId}`;
                                    window.open(simUrl, "_blank");
                                    setQrTable(null);
                                }}
                                className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm"
                            >
                                <Play size={14} /> Mở giả lập Tablet Bàn {qrTable.tableId}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationsPage;

