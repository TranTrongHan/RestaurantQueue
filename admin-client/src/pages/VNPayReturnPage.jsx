import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApis } from "../configs/Apis";
import useAuthStore from "../store/useAuthStore";
import { CheckCircle2, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import SpinnerComp from "../components/common/SpinnerComp";

const VNPayReturnPage = () => {
    const location = useLocation();
    const nav = useNavigate();
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null); // 'success' | 'error'
    const [billData, setBillData] = useState(null);

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                setLoading(true);
                // Forward all query parameters to the backend
                const queryParams = location.search;
                const res = await authApis(token).get(`/order_session/vnpayReturn${queryParams}`);
                
                if (res.status === 200) {
                    setStatus("success");
                    setBillData(res.data.result);
                    toast.success("Thanh toán thành công!");
                }
            } catch (err) {
                console.error("Payment verification error:", err);
                setStatus("error");
                toast.error(err.response?.data?.message || "Thanh toán thất bại hoặc có lỗi xảy ra!");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            verifyPayment();
        }
    }, [location.search, token]);

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
                <SpinnerComp className="w-12 h-12 border-blue-600 border-t-transparent" />
                <p className="mt-4 text-slate-500 font-medium animate-pulse uppercase tracking-widest text-xs">Đang xác thực giao dịch với VNPay...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in duration-500">
                {status === "success" ? (
                    <>
                        <div className="bg-emerald-500 p-10 flex flex-col items-center text-white text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-white/10">
                                <CheckCircle2 size={48} />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight mb-2 uppercase">Thành công!</h1>
                            <p className="text-emerald-50 text-sm font-medium opacity-90">Hóa đơn đã được chốt và Firestore đã được dọn dẹp.</p>
                        </div>
                        
                        <div className="p-10 flex flex-col items-center w-full">
                            <div className="w-full space-y-4 mb-8">
                                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-4">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Mã hóa đơn</span>
                                    <span className="text-slate-900 font-black">#{billData?.billId || "N/A"}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-4">
                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Phương thức</span>
                                    <span className="text-blue-600 font-black">VNPay QR / Thẻ</span>
                                </div>
                                <div className="flex justify-between items-center py-4 bg-slate-50 px-6 rounded-2xl border border-slate-100">
                                    <span className="text-slate-900 font-bold">Tổng tiền</span>
                                    <span className="text-2xl font-black text-emerald-600">{formatPrice(billData?.totalAmount || 0)}</span>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => nav("/reservations")}
                                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl active:scale-95 group"
                            >
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                QUAY VỀ ĐIỀU PHỐI BÀN
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="bg-red-500 p-10 flex flex-col items-center text-white text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-white/10">
                                <AlertCircle size={48} />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight mb-2 uppercase">Thất bại!</h1>
                            <p className="text-red-50 text-sm font-medium opacity-90">Có thể giao dịch của bạn đã bị hủy hoặc gặp lỗi xác thực.</p>
                        </div>
                        
                        <div className="p-10 flex flex-col items-center w-full">
                            <div className="text-center mb-10">
                                <p className="text-slate-400 text-sm font-medium leading-relaxed italic">
                                    "Đừng lo lắng, phiên gọi món tại bàn vẫn được giữ nguyên. Vui lòng thử lại hoặc chọn phương thức thanh toán khác."
                                </p>
                            </div>
                            
                            <button
                                onClick={() => nav("/reservations")}
                                className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl active:scale-95 group"
                            >
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                THỬ LẠI / QUAY VỀ
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VNPayReturnPage;
