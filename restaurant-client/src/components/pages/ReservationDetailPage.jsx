import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { authApis, endpoints } from "../configs/Apis";
import { useCookies } from "react-cookie";
import SpinnerComp from "../common/SpinnerComp";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import useUserStore from "../../store/useUserStore";
import dayjs from "dayjs";
import {
    ArrowLeft, Users, User, CalendarDays, Clock, StickyNote,
    Receipt, CreditCard, Check, AlertCircle, CheckCircle, XCircle, Pencil
} from "lucide-react";
import toast from 'react-hot-toast';

const STATUS_MAP = {
    BOOKED:     { label: "Đã đặt",        cls: "bg-success/10 text-success border-success/30" },
    CANCELED:   { label: "Đã hủy",        cls: "bg-danger/10 text-danger border-danger/30" },
    CHECKED_IN: { label: "Đã nhận bàn",   cls: "bg-primary/10 text-primary border-primary/30" },
    CHECKEDOUT: { label: "Đã thanh toán", cls: "bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200" },
};

const StatusBadge = ({ status }) => {
    const s = STATUS_MAP[status] || { label: status, cls: "bg-gray-100 text-gray-500 border-gray-200" };
    return (
        <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border ${s.cls}`}>
            {s.label}
        </span>
    );
};

const InfoRow = ({ icon: Icon, iconCls = "text-primary", label, value }) => (
    <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
        <Icon size={15} className={`${iconCls} shrink-0 mt-0.5`} />
        <span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{label}: </span>
            {value}
        </span>
    </div>
);

const ReservationDetailPage = () => {
    const { id } = useParams();
    const [cookies] = useCookies(["token"]);
    const [reservation, setReservation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const nav = useNavigate();
    const { user } = useUserStore();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [newCheckinTime, setNewCheckinTime] = useState("");

    const formatPrice = (p) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);
    const formatDateTime = (dt) => {
        if (!dt) return "Chưa có";
        return new Date(dt).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
    };

    const fetchReservationDetail = async () => {
        if (!user) { setShowLoginModal(true); return; }
        try {
            setLoading(true);
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints["booking"]}/${id}`;
            const res = await authApis(cookies.token).get(url);
            if (res.data.code === 200) {
                setReservation(res.data.result);
                setError(null);
            }
        } catch (err) {
            if (err.response?.data?.code === 9997) setError("Không có quyền truy cập!");
            else setError(err.message || "Không tìm thấy đặt bàn.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!newCheckinTime) return;
        try {
            setLoading(true);
            const payload = { checkinTime: dayjs(newCheckinTime).format("YYYY-MM-DD HH:mm:ss") };
            const res = await authApis(cookies.token).put(
                `${import.meta.env.VITE_API_BASE_URL}${endpoints["booking"]}/${id}`, payload
            );
            if (res.data.code === 200) {
                // setSuccess("Thay đổi giờ check-in thành công!");
                toast.success("Thay đổi giờ check-in thành công!");
                setNewCheckinTime("");
                fetchReservationDetail();
            }
        } catch (err) {
            const code = Number(err.response?.data?.code);
            if (code === 5004) toast.error("Chỉ được thay đổi trong vòng 2 tiếng kể từ khi đặt bàn.");
            else if (code === 5005) toast.error("Thời gian thay đổi không hợp lệ.");
            else toast.error(err.response?.data?.message || "Lỗi khi cập nhật.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setLoading(true);
            const res = await authApis(cookies.token).delete(
                `${import.meta.env.VITE_API_BASE_URL}${endpoints["booking"]}/${id}`
            );
            if (res.data.code === 200) {
                toast.success("Hủy đơn thành công!");
                nav("/my-reservations");
            }
        } catch (err) {
            const code = Number(err.response?.data?.code);
            if (code === 5004) toast.error("Chỉ được hủy trong vòng 2 tiếng kể từ khi đặt bàn.");
            else toast.error(err.response?.data?.message || "Lỗi khi hủy đơn.");
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    useEffect(() => { fetchReservationDetail(); }, [id]);
    useEffect(() => {
        if (error) { const t = setTimeout(() => setError(null), 3000); return () => clearTimeout(t); }
    }, [error]);
    useEffect(() => {
        if (success) { const t = setTimeout(() => setSuccess(null), 3000); return () => clearTimeout(t); }
    }, [success]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                {/* Back */}
                <button
                    onClick={() => nav("/my-reservations")}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary transition-colors mb-6"
                >
                    <ArrowLeft size={16} />
                    Trở về danh sách đặt bàn
                </button>

                {/* Alerts */}
                {/* Bỏ banner toast thành công cũ, nhưng giữ banner lỗi kết nối nếu có 
                {error && (
                    <div className="flex items-center gap-3 mb-5 bg-danger/10 border border-danger/30 text-danger px-5 py-3.5 rounded-2xl text-sm font-medium">
                        <XCircle size={17} className="shrink-0" /> {error}
                    </div>
                )}
                */}
                {/* 
                {success && (
                    <div className="flex items-center gap-3 mb-5 bg-success/10 border border-success/30 text-success px-5 py-3.5 rounded-2xl text-sm font-medium">
                        <CheckCircle size={17} className="shrink-0" /> {success}
                    </div>
                )}
                */}

                {loading && !reservation && (
                    <div className="flex justify-center py-20"><SpinnerComp /></div>
                )}

                {reservation && (
                    <div className="space-y-5">
                        {/* ── Card 1: Thông tin đặt bàn ── */}
                        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-primary to-primary-active text-white">
                                <div>
                                    <p className="text-white/70 text-xs font-medium uppercase tracking-wider mb-0.5">Bàn đặt</p>
                                    <h2 className="text-xl font-extrabold">{reservation.table.tableName}</h2>
                                </div>
                                <StatusBadge status={reservation.status} />
                            </div>

                            {/* Body - info grid */}
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InfoRow icon={Users}       iconCls="text-gray-400"  label="Sức chứa"   value={`${reservation.table.capacity} người`} />
                                <InfoRow icon={User}        iconCls="text-info"      label="Khách"      value={reservation.customer.fullName} />
                                <InfoRow icon={CalendarDays} iconCls="text-primary"  label="Ngày đặt"   value={formatDateTime(reservation.bookingTime)} />
                                <InfoRow icon={Clock}       iconCls="text-success"   label="Check-in"   value={formatDateTime(reservation.checkinTime)} />
                                {reservation.checkoutTime && (
                                    <InfoRow icon={Clock}   iconCls="text-danger"    label="Check-out"  value={formatDateTime(reservation.checkoutTime)} />
                                )}
                                {reservation.note && (
                                    <InfoRow icon={StickyNote} iconCls="text-gray-400" label="Ghi chú" value={<span className="italic text-gray-500">{reservation.note}</span>} />
                                )}
                            </div>

                            {/* Edit check-in + Cancel (only BOOKED) */}
                            {reservation.status === "BOOKED" && (
                                <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6 pb-6 pt-5 space-y-4">
                                    {/* Change check-in time */}
                                    <div>
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                                            <Pencil size={14} className="text-warning" />
                                            Thay đổi giờ check-in
                                        </h4>
                                        <form onSubmit={handleUpdate} className="flex items-center gap-3 flex-wrap">
                                            <input
                                                type="datetime-local"
                                                value={newCheckinTime}
                                                onChange={(e) => setNewCheckinTime(e.target.value)}
                                                className="px-3 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary transition"
                                            />
                                            <button
                                                type="submit"
                                                disabled={loading || !newCheckinTime}
                                                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-success hover:bg-success-active text-white text-sm font-semibold transition shadow-md shadow-success/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                <Check size={14} /> Lưu
                                            </button>
                                        </form>
                                    </div>

                                    {/* Cancel button */}
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        disabled={loading}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-danger/30 text-danger text-sm font-semibold hover:bg-danger hover:text-white hover:border-danger transition disabled:opacity-60"
                                    >
                                        <XCircle size={15} /> Hủy đơn đặt bàn
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── Card 2: Hóa đơn ── */}
                        {reservation.bill && (
                            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                                    <h3 className="flex items-center gap-2 font-extrabold text-gray-900 dark:text-gray-100">
                                        <Receipt size={18} className="text-primary" />
                                        Hóa đơn #{reservation.bill.billId}
                                    </h3>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                                        reservation.bill.status === "PAID"
                                            ? "bg-success/10 text-success border-success/30"
                                            : "bg-warning/10 text-warning border-warning/30"
                                    }`}>
                                        {reservation.bill.status === "PAID" ? "✓ Đã thanh toán" : "Chờ thanh toán"}
                                    </span>
                                </div>

                                <div className="p-6 space-y-4">
                                    {/* Bill meta */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pb-4 border-b border-dashed border-gray-200 dark:border-gray-700">
                                        <div className="text-gray-600 dark:text-gray-400">
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">Ngày tạo: </span>
                                            {formatDateTime(reservation.bill.createdAt)}
                                        </div>
                                        {reservation.bill.paymentTime && (
                                            <div className="text-gray-600 dark:text-gray-400">
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">Thanh toán: </span>
                                                {formatDateTime(reservation.bill.paymentTime)}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">Đơn hàng:</span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                                reservation.bill.order.isPaid
                                                    ? "bg-success/10 text-success border-success/30"
                                                    : "bg-warning/10 text-warning border-warning/30"
                                            }`}>
                                                {reservation.bill.order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Payment summary */}
                                    <div className="bg-gradient-to-br from-primary to-primary-active rounded-2xl p-5 text-white">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-2.5">
                                                <h5 className="font-bold text-white/90 text-sm uppercase tracking-wider mb-3">Thông tin thanh toán</h5>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white/80">Tạm tính:</span>
                                                    <span className="font-semibold">{formatPrice(reservation.bill.subTotal)}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white/80">Giảm giá:</span>
                                                    <span className="font-semibold text-yellow-300">
                                                        {reservation.bill.discountAmount > 0
                                                            ? `-${formatPrice(reservation.bill.discountAmount)}`
                                                            : formatPrice(0)}
                                                    </span>
                                                </div>
                                                <div className="border-t border-white/20 pt-2.5 flex justify-between">
                                                    <span className="font-extrabold text-base">Tổng cộng:</span>
                                                    <span className="font-extrabold text-xl text-yellow-300">
                                                        {formatPrice(reservation.bill.totalAmount)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-center opacity-80 shrink-0">
                                                <CreditCard size={36} className="text-yellow-300 mb-1 mx-auto" />
                                                <p className="text-[11px] text-white/70">Phương thức</p>
                                                <p className="text-xs font-bold">Tại quầy</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <Footer />

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative z-10 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-8 border border-gray-100 dark:border-gray-800 text-center">
                        <AlertCircle size={48} className="text-danger mx-auto mb-4" />
                        <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">Xác nhận hủy đặt bàn?</h3>
                        <p className="text-sm text-gray-500 mb-6">Hành động này không thể hoàn tác. Bạn có chắc chắn muốn hủy đơn đặt bàn này không?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                Giữ lại
                            </button>
                            <button onClick={handleDelete} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-danger hover:bg-danger-active transition shadow-lg shadow-danger/20 disabled:opacity-70">
                                {loading ? "Đang hủy..." : "Hủy đặt bàn"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLoginModal(false)} />
                    <div className="relative z-10 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-8 border border-gray-100 dark:border-gray-800 text-center">
                        <AlertCircle size={48} className="text-warning mx-auto mb-4" />
                        <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-3">Yêu cầu đăng nhập</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Vui lòng{" "}
                            <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} className="font-bold text-primary underline">
                                đăng nhập
                            </Link>{" "}
                            để xem đơn đặt bàn.
                        </p>
                        <button onClick={() => setShowLoginModal(false)} className="w-full py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition">
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationDetailPage;