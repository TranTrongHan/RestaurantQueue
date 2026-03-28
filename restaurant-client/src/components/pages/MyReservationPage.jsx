import Footer from "../layout/Footer";
import Header from "../layout/Header";
import { useEffect, useState } from "react";
import SpinnerComp from "../common/SpinnerComp";
import { authApis, endpoints } from "../configs/Apis";
import { useCookies } from "react-cookie";
import { CalendarDays, Clock, Users, StickyNote, ClipboardList, ChevronRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_MAP = {
  BOOKED:     { label: "Đã đặt",         cls: "bg-success/10 text-success border-success/30" },
  CANCELED:   { label: "Đã hủy",         cls: "bg-danger/10 text-danger border-danger/30" },
  CHECKED_IN: { label: "Đã nhận bàn",    cls: "bg-primary/10 text-primary border-primary/30" },
  CHECKEDOUT: { label: "Đã thanh toán",  cls: "bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700" },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || { label: status, cls: "bg-gray-100 text-gray-500 border-gray-200" };
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
};

const MyReservationPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cookies] = useCookies(["token"]);
  const nav = useNavigate();

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints["booking"]}/my`;
      const res = await authApis(cookies.token).get(url);
      if (res.data.code === 200) {
        setReservations(res.data.result);
      } else {
        setError("Không tìm thấy đặt bàn nào.");
      }
    } catch {
      setError("Lỗi khi tải dữ liệu đặt bàn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-6xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <ClipboardList size={26} className="text-primary" />
              Đơn đặt bàn của tôi
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {reservations.length > 0 ? `${reservations.length} đơn đặt bàn` : "Chưa có đơn đặt bàn nào"}
            </p>
          </div>
          <button
            onClick={fetchReservations}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary transition-colors px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary bg-white dark:bg-gray-900"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-danger/10 border border-danger/30 text-danger px-5 py-4 rounded-2xl text-sm font-medium">
            ⚠ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <SpinnerComp />
          </div>
        )}

        {/* Reservation Cards Grid */}
        {!loading && reservations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reservations.map((res) => (
              <div
                key={res.reservationId}
                onClick={() => nav(`/my-reservations/${res.reservationId}`)}
                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 hover:border-primary/20"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-base leading-tight">
                      {res.tableResponse.tableName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                      <Users size={12} />
                      Sức chứa: {res.tableResponse.capacity} người
                    </div>
                  </div>
                  <StatusBadge status={res.status} />
                </div>

                {/* Card Body */}
                <div className="px-5 py-4 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                    <CalendarDays size={14} className="text-primary shrink-0" />
                    <span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Ngày đặt:</span>{" "}
                      {res.bookingTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                    <Clock size={14} className="text-warning shrink-0" />
                    <span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">Giờ check-in:</span>{" "}
                      {res.checkinTime}
                    </span>
                  </div>
                  {res.note && (
                    <div className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-gray-400 italic">
                      <StickyNote size={14} className="text-gray-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{res.note}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs text-gray-500 font-medium">
                    👤 {res.customerResponse.fullName}
                  </span>
                  <ChevronRight size={15} className="text-gray-400 group-hover:text-primary transition-colors group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && reservations.length === 0 && !error && (
          <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-card">
            <ClipboardList size={56} className="text-gray-200 dark:text-gray-700 mx-auto mb-5" />
            <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500 mb-2">
              Chưa có đơn đặt bàn nào
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              Bạn chưa thực hiện đặt bàn nào. Hãy đặt bàn ngay!
            </p>
            <a
              href="/booking"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary hover:bg-primary-active text-white font-bold text-sm transition-all shadow-lg shadow-primary/20"
            >
              <CalendarDays size={16} />
              Đặt bàn ngay
            </a>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyReservationPage;
