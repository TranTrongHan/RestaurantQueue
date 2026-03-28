import { useEffect, useState } from "react";
import { authApis, endpoints } from "../configs/Apis";
import { useCookies } from "react-cookie";
import SpinnerComp from "../common/SpinnerComp";
import dayjs from "dayjs";
import useUserStore from "../../store/useUserStore";
import { Link } from "react-router-dom";
import { Users, Calendar, StickyNote, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import toast from 'react-hot-toast';

const inputCls = "w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition";
const labelCls = "flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5";

const TableBookingForm = () => {
  const [formData, setFormData] = useState({ checkinTime: "", capacity: "", note: "" });
  const [validated, setValidated] = useState(false);
  const { user } = useUserStore();
  const [showModal, setShowModal] = useState(false);
  const [cookies] = useCookies(["token"]);
  const [loading, setLoading] = useState(false);
  // --- Start Old Alert State ---
  // const [error, setError] = useState(null);
  // const [success, setSuccess] = useState(null);
  // --- End Old Alert State ---

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!user) { setShowModal(true); return; }

    if (!formData.checkinTime || !formData.capacity) {
      setValidated(true);
      return;
    }

    try {
      setLoading(true);
      const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['booking']}/add`;
      const payload = {
        checkinTime: dayjs(formData.checkinTime).format("YYYY-MM-DD HH:mm:ss"),
        capacity: Number(formData.capacity),
        note: formData.note || ""
      };
      const res = await authApis(cookies.token).post(url, payload);
      if (res.data.code === 200) {
        // setSuccess("Đặt bàn thành công! Chúng tôi sẽ xác nhận sớm nhất có thể.");
        // setError(null);
        toast.success("Đặt bàn thành công! Chúng tôi sẽ xác nhận sớm nhất có thể.");
        setFormData({ checkinTime: "", capacity: "", note: "" });
        setValidated(false);
      }
    } catch (err) {
      if (err.response) {
        if (err.response.data.code === 4002) toast.error("Tạm thời hết bàn. Vui lòng thử lại sau.");
        else if (err.response.data.code === 5002) toast.error("Bạn đã có đơn đặt bàn trước đó.");
        else toast.error(err.response.data.message || "Có lỗi xảy ra.");
      } else {
        toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Start Old Alert Effect ---
  // useEffect(() => {
  //   if (success || error) {
  //     const t = setTimeout(() => { setSuccess(null); setError(null); }, 5000);
  //     return () => clearTimeout(t);
  //   }
  // }, [success, error]);
  // --- End Old Alert Effect ---

  return (
    <>
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* Card header gradient */}
        <div className="bg-gradient-to-r from-primary to-primary-active px-8 py-6 text-white">
          <h2 className="text-xl font-extrabold">Thông tin đặt bàn</h2>
          <p className="text-sm text-white/80 mt-1">Vui lòng điền đầy đủ các thông tin bên dưới</p>
        </div>

        <div className="p-8">
          {/* Alerts */}
          {/* 
          {success && (
            <div className="flex items-start gap-3 mb-5 bg-success/10 border border-success/30 text-success px-4 py-3 rounded-xl text-sm font-medium">
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              {success}
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 mb-5 bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl text-sm font-medium">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          */}

          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            {/* Check-in Time */}
            <div>
              <label className={labelCls}>
                <Calendar size={15} className="text-primary" />
                Thời gian nhận bàn <span className="text-danger">*</span>
              </label>
              <input
                type="datetime-local"
                name="checkinTime"
                value={formData.checkinTime}
                onChange={handleInputChange}
                required
                className={`${inputCls} ${validated && !formData.checkinTime ? 'border-danger focus:ring-danger/40 focus:border-danger' : ''}`}
              />
              {validated && !formData.checkinTime && (
                <p className="text-xs text-danger mt-1.5 font-medium">Vui lòng chọn thời gian nhận bàn.</p>
              )}
            </div>

            {/* Capacity */}
            <div>
              <label className={labelCls}>
                <Users size={15} className="text-primary" />
                Số lượng khách <span className="text-danger">*</span>
              </label>
              <select
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                required
                className={`${inputCls} ${validated && !formData.capacity ? 'border-danger focus:ring-danger/40 focus:border-danger' : ''}`}
              >
                <option value="">-- Chọn số lượng --</option>
                <option value="2">2 khách</option>
                <option value="4">4 khách</option>
                <option value="6">6 khách</option>
                <option value="8">8 khách</option>
              </select>
              {validated && !formData.capacity && (
                <p className="text-xs text-danger mt-1.5 font-medium">Vui lòng chọn số lượng khách.</p>
              )}
            </div>

            {/* Note */}
            <div>
              <label className={labelCls}>
                <StickyNote size={15} className="text-primary" />
                Ghi chú
                <span className="ml-1 text-xs font-normal text-gray-400">(tuỳ chọn)</span>
              </label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                rows={3}
                placeholder="Ví dụ: Có trẻ em, dị ứng hải sản, cần ghế cao..."
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Info hint */}
            <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 text-xs text-primary/80 font-medium flex items-start gap-2">
              <span className="text-base leading-none">💡</span>
              <span>Đặt bàn sẽ được giữ trong 30 phút kể từ giờ nhận bàn. Vui lòng đến đúng giờ.</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-bold text-white text-base bg-primary hover:bg-primary-active transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <SpinnerComp className="w-5 h-5 border-2" />
              ) : (
                <>
                  <Calendar size={18} />
                  Xác nhận đặt bàn
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Login Required Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-8 border border-gray-100 dark:border-gray-800">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-warning/10 text-warning mb-3">
                <AlertCircle size={28} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Yêu cầu đăng nhập</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              Vui lòng{" "}
              <Link
                to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                className="font-bold text-primary hover:text-primary-active underline"
              >
                đăng nhập
              </Link>
              {" "}để thực hiện đặt bàn.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Đóng
              </button>
              <Link
                to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white text-center bg-primary hover:bg-primary-active transition shadow-lg shadow-primary/20"
              >
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TableBookingForm;
