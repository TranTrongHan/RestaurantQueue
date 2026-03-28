import { useEffect, useState } from "react";
import { authApis, endpoints } from "../configs/Apis";
import { useCookies } from "react-cookie";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import moment from "moment";
import SpinnerComp from "../common/SpinnerComp";
import { Users, Clock, Mail, Phone, StickyNote, Search, ListFilter, CheckCircle2, LogIn } from "lucide-react";
import toast from 'react-hot-toast';

const STATUS_MAP = {
    BOOKED:     { label: "Đã đặt",      cls: "bg-success/10 text-success border-success/30" },
    CHECKEDIN:  { label: "Đã check-in", cls: "bg-primary/10 text-primary border-primary/30" },
    CHECKEDOUT: { label: "Đã checkout", cls: "bg-gray-100 dark:bg-gray-700 text-gray-500 border-gray-200 dark:border-gray-600" },
};
const StatusBadge = ({ status }) => {
    const s = STATUS_MAP[status] || { label: status, cls: "bg-gray-100 text-gray-500 border-gray-200" };
    return (
        <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border tracking-wide uppercase ${s.cls}`}>
            {s.label}
        </span>
    );
};

const ReservationsPages = () => {
    const [reservations, setReservations] = useState([]);
    const [cookies] = useCookies(["token"]);
    const [loading, setLoading] = useState(false);
    const [loadingBtn, setLoadingBtn] = useState(null); // reservationId being processed
    const [error, setError] = useState(null);
    // const [success, setSuccess] = useState(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("BOOKED");

    const fetchReservations = async () => {
        try {
            setLoading(true);
            let url = `${import.meta.env.VITE_API_BASE_URL}${endpoints["booking"]}`;
            const params = [];
            if (search) params.push(`customer=${search}`);
            if (status) params.push(`status=${status}`);
            if (params.length) url += `?${params.join("&")}`;
            const res = await authApis(cookies.token).get(url);
            if (res.status === 200) setReservations(res.data.result);
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi kết nối mạng. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReservations(); }, []);
    useEffect(() => { fetchReservations(); }, [search, status]);

    // useEffect(() => {
    //     if (success) { const t = setTimeout(() => setSuccess(null), 2500); return () => clearTimeout(t); }
    // }, [success]);

    const handleCheckin = async (reservationId) => {
        try {
            setLoadingBtn(reservationId);
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints["booking"]}/${reservationId}`;
            const res = await authApis(cookies.token).post(url);
            if (res.status === 200) {
                // setSuccess("Check-in thành công!");
                toast.success("Check-in thành công!");
                fetchReservations();
                const { sessionToken, customerJwt, sessionId } = res.data.result;
                if (sessionToken) {
                    const sessionUrl = `${import.meta.env.VITE_CONTEXT_PATH}/order_session?token=${sessionToken}&sessionId=${sessionId}`;
                    const newWindow = window.open(sessionUrl, "_blank");
                    if (newWindow) {
                        newWindow.onload = () => newWindow.postMessage(customerJwt, window.location.origin);
                    }
                }
            }
        } catch (err) {
            // setError(err.response?.data?.message || "Lỗi kết nối mạng.");
            toast.error(err.response?.data?.message || "Lỗi kết nối mạng.");
        } finally {
            setLoadingBtn(null);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
                {/* Page Header */}
                <div className="mb-7">
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-1">Quản lý đặt bàn</h1>
                    <p className="text-sm text-gray-500">{reservations.length} kết quả đang hiển thị</p>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-7">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên khách hàng hoặc tên bàn..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary transition"
                        />
                    </div>

                    {/* Status filter */}
                    <div className="relative">
                        <ListFilter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="pl-10 pr-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary transition appearance-none cursor-pointer"
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="BOOKED">Đã đặt bàn</option>
                            <option value="CHECKEDIN">Đã check-in</option>
                            <option value="CHECKEDOUT">Đã checkout</option>
                        </select>
                    </div>
                </div>

                {/* Notifications */}
                {/* 
                {success && (
                    <div className="flex items-center gap-3 mb-5 bg-success/10 border border-success/30 text-success px-5 py-3.5 rounded-2xl text-sm font-medium">
                        <CheckCircle2 size={17} className="shrink-0" /> {success}
                    </div>
                )}
                */}
                {error && (
                    <div className="mb-5 bg-danger/10 border border-danger/30 text-danger px-5 py-3.5 rounded-2xl text-sm font-medium">
                        ⚠ {error}
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-20"><SpinnerComp /></div>
                )}

                {/* Empty State */}
                {!loading && reservations.length === 0 && (
                    <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card">
                        <ListFilter size={52} className="text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500 mb-1">Không có đơn đặt bàn nào</h3>
                        <p className="text-sm text-gray-400">Thử thay đổi bộ lọc để xem thêm kết quả.</p>
                    </div>
                )}

                {/* Cards Grid */}
                {!loading && reservations.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {reservations.map((res) => (
                            <div
                                key={res.reservationId}
                                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
                            >
                                {/* Card Header */}
                                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary to-primary-active text-white">
                                    <h3 className="font-extrabold text-lg">{res.tableResponse.tableName}</h3>
                                    <StatusBadge status={res.status} />
                                </div>

                                {/* Card Body */}
                                <div className="px-5 py-4 space-y-2.5">
                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <Users size={14} className="text-primary shrink-0" />
                                        <span><strong>Khách hàng:</strong> {res.customerResponse.fullName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <Clock size={14} className="text-warning shrink-0" />
                                        <span><strong>Check-in:</strong> {moment(res.checkinTime).format("HH:mm DD/MM/YYYY")}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <Users size={14} className="text-gray-400 shrink-0" />
                                        <span><strong>Số người:</strong> {res.tableResponse.capacity}</span>
                                    </div>

                                    <div className="border-t border-gray-100 dark:border-gray-800 pt-2.5 mt-2.5 space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Mail size={12} className="shrink-0" />
                                            {res.customerResponse.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Phone size={12} className="shrink-0" />
                                            {res.customerResponse.phone}
                                        </div>
                                        {res.note && (
                                            <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 italic">
                                                <StickyNote size={12} className="shrink-0 mt-0.5" />
                                                <span className="line-clamp-2">{res.note}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Footer - Checkin Button */}
                                <div className="px-5 pb-5">
                                    <button
                                        onClick={() => handleCheckin(res.reservationId)}
                                        disabled={loadingBtn === res.reservationId || res.status === "CHECKEDOUT"}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary-active transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loadingBtn === res.reservationId ? (
                                            <SpinnerComp className="w-4 h-4 border-2" />
                                        ) : (
                                            <>
                                                <LogIn size={15} />
                                                Check-in
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default ReservationsPages;