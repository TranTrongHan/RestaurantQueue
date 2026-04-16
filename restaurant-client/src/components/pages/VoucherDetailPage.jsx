import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useCookies } from 'react-cookie';

import {
    Ticket,
    Calendar,
    Info,
    ChevronLeft,
    Copy,
    CheckCircle2,
    Clock,
    AlertCircle,
    ShoppingBag,
    Tag,
    ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

import Header from '../layout/Header';
import SpinnerComp from '../common/SpinnerComp';
import Footer from '../layout/Footer';
import { authApis, endpoints } from '../configs/Apis';

const VoucherDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [cookies] = useCookies(['token']);
    const [loading, setLoading] = useState(true);
    const [voucherData, setVoucherData] = useState(null);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setLoading(true);
                const res = await authApis(cookies.token).get(`${endpoints.user_voucher_detail}/${id}`);
                setVoucherData(res.data.result);
            } catch (error) {
                console.error(error);
                toast.error("Không thể tải thông tin voucher");
                navigate('/loyalty');
            } finally {
                setLoading(false);
            }
        };

        if (cookies.token && id) fetchDetail();
    }, [id, cookies.token, navigate]);

    const copyCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.success("Đã sao chép mã voucher!");
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <Header />
            <div className="flex-1 flex items-center justify-center">
                <SpinnerComp />
            </div>
            <Footer />
        </div>
    );

    if (!voucherData) return null;

    const { voucher, isUsed, usedAt } = voucherData;

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                {/* Back Link */}
                <button
                    onClick={() => navigate('/loyalty')}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors mb-8 group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold text-sm uppercase tracking-wider">Quay lại ví voucher</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left: Main Card Visualization */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className={`relative overflow-hidden rounded-[2.5rem] aspect-square p-8 text-white shadow-2xl transition-all ${isUsed ? 'bg-slate-400 grayscale' : 'bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500'}`}>
                            {/* Decorative bubbles */}
                            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-black/10 rounded-full blur-2xl"></div>

                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30">
                                        <Ticket size={28} />
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${isUsed ? 'bg-white/10 border-white/20' : 'bg-emerald-500/20 border-emerald-400/30'}`}>
                                        {isUsed ? 'Đã sử dụng' : 'Khả dụng'}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h2 className="text-3xl font-black leading-tight">
                                        {voucher.voucherType === 'PERCENTAGE'
                                            ? `Giảm ${voucher.discountValue}%`
                                            : `Giảm ${formatCurrency(voucher.discountValue)}`}
                                    </h2>
                                    <div className="space-y-1">
                                        <p className="text-white/70 text-sm font-medium">Mã ưu đãi</p>
                                        <div className="flex items-center gap-2 bg-black/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 group cursor-pointer" onClick={() => copyCode(voucher.voucherCode)}>
                                            <span className="font-mono text-xl font-black tracking-widest">{voucher.voucherCode}</span>
                                            <Copy size={16} className="ml-auto opacity-50 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Message */}
                        {isUsed && (
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center space-y-3">
                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400">
                                    <CheckCircle2 size={32} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-400">Bạn đã sử dụng ưu đãi này vào</p>
                                    <p className="text-base font-black text-slate-900 dark:text-slate-100 italic">
                                        {new Date(usedAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Detailed Info */}
                    <div className="lg:col-span-3 space-y-8">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-2">{voucher.voucherName}</h1>
                            <p className="text-slate-500 dark:text-slate-400 leading-relaxed italic">{voucher.description || 'Ưu đãi đặc quyền dành cho thành viên thân thiết của nhà hàng.'}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Conditions card */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Info size={16} className="text-blue-500" /> Điều kiện áp dụng
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex gap-4">
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                            <ShoppingBag size={14} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Đơn hàng tối thiểu</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(voucher.minOrderValue || 0)}</p>
                                        </div>
                                    </li>
                                    {voucher.maxDiscountAmount && (
                                        <li className="flex gap-4">
                                            <div className="shrink-0 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                                <AlertCircle size={14} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase">Giảm tối đa</p>
                                                <p className="text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(voucher.maxDiscountAmount)}</p>
                                            </div>
                                        </li>
                                    )}
                                    <li className="flex gap-4">
                                        <div className="shrink-0 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                            <Tag size={14} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Loại đơn hàng</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                                                {voucher.applyType === 'BOTH' ? 'Tất cả đơn hàng' : (voucher.applyType === 'ONLINE' ? 'Đặt Online / Giao hàng' : 'Ăn tại nhà hàng')}
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            {/* Timeline Card */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar size={16} className="text-emerald-500" /> Thời gian hiệu lực
                                </h3>
                                <div className="space-y-6 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-px before:bg-slate-100 dark:before:bg-slate-800">
                                    <div className="relative pl-10">
                                        <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-950"></div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Bắt đầu từ</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">{new Date(voucher.startDate).toLocaleString()}</p>
                                    </div>
                                    <div className="relative pl-10">
                                        <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-rose-500 border-4 border-white dark:border-slate-950"></div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Kết thúc vào</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-slate-100">{new Date(voucher.endDate).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-600 dark:text-amber-400">
                                        <Clock size={16} className="shrink-0" />
                                        <span className="text-[11px] font-bold">Hãy sử dụng trước ngày hết hạn để không bỏ lỡ ưu đãi!</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA / Quick Actions */}
                        {!isUsed && (
                            <div className="p-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] flex items-center gap-4 shadow-sm">
                                <button
                                    onClick={() => navigate('/menu')}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white py-4 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-primary/20"
                                >
                                    Sử dụng ngay
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default VoucherDetailPage;
