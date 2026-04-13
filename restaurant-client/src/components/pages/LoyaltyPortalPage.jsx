import React, { useState, useEffect } from 'react';
import { authApis, endpoints } from '../configs/Apis';
import { useCookies } from 'react-cookie';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import SpinnerComp from '../common/SpinnerComp';
import { Award, Wallet, ShoppingBag, History, ChevronRight, Star, Info, Ticket, TrendingUp, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const LoyaltyPortalPage = () => {
    const [cookies] = useCookies(['token']);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('card');
    
    // Data states
    const [status, setStatus] = useState(null);
    const [myVouchers, setMyVouchers] = useState([]);
    const [redeemable, setRedeemable] = useState([]);
    const [history, setHistory] = useState([]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statusRes, walletRes, exchangeRes, historyRes] = await Promise.all([
                authApis(cookies.token).get(endpoints.membership_status),
                authApis(cookies.token).get(endpoints.my_vouchers),
                authApis(cookies.token).get(endpoints.exchangeable_vouchers),
                authApis(cookies.token).get(endpoints.points_history)
            ]);
            setStatus(statusRes.data.result);
            setMyVouchers(walletRes.data.result);
            setRedeemable(exchangeRes.data.result);
            setHistory(historyRes.data.result);
        } catch (error) {
            toast.error("Không thể tải thông tin thành viên");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (cookies.token) fetchData();
    }, [cookies.token]);

    const handleRedeem = async (voucherId) => {
        try {
            await authApis(cookies.token).post(`${endpoints.redeem_voucher}/${voucherId}`);
            toast.success("Đổi voucher thành công! Đã thêm vào ví của bạn.");
            fetchData();
            setActiveTab('wallet');
        } catch (error) {
            toast.error(error.response?.data?.message || "Đổi voucher thất bại");
        }
    };

    const getTierGradient = (tierName) => {
        const name = tierName?.toLowerCase() || '';
        if (name.includes('gold')) return 'from-amber-400 via-amber-500 to-yellow-600';
        if (name.includes('silver')) return 'from-slate-300 via-slate-400 to-slate-500';
        return 'from-blue-500 via-indigo-500 to-purple-600';
    };

    if (loading) return <div className="min-h-screen flex flex-col"><Header /><div className="flex-1 flex items-center justify-center"><SpinnerComp /></div><Footer /></div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
            <Header />
            
            <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
                {/* Hero Section / Card */}
                <div className="mb-10">
                    <div className={`relative overflow-hidden rounded-[2rem] p-8 text-white shadow-2xl bg-gradient-to-br ${getTierGradient(status?.tierName)}`}>
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold border border-white/30">
                                    <Award size={18} /> {status?.tierName || 'Thành viên mới'}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-2">
                                    {status?.loyaltyPoints?.toLocaleString() || 0} <span className="text-2xl font-medium opacity-80">Điểm</span>
                                </h1>
                                <p className="text-white/80 font-medium">Tổng chi tiêu: {status?.totalSpending?.toLocaleString()} VNĐ</p>
                            </div>
                            
                            {status?.nextTierMinSpending && (
                                <div className="bg-black/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 w-full md:w-80">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Tiến trình lên hạng</span>
                                        <span className="text-xs font-bold">{Math.round((status.totalSpending / status.nextTierMinSpending) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-white/20 h-2.5 rounded-full mb-4 overflow-hidden">
                                        <div 
                                            className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (status.totalSpending / status.nextTierMinSpending) * 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm font-medium leading-tight">
                                        Chi tiêu thêm <span className="font-black underline">{status.spendingToNextTier?.toLocaleString()}đ</span> để thăng hạng!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    {[
                        { id: 'card', label: 'Tổng quan', icon: Award },
                        { id: 'wallet', label: 'Ví Voucher', icon: Wallet, count: myVouchers.filter(v => !v.isUsed).length },
                        { id: 'shop', label: 'Đổi thưởng', icon: ShoppingBag },
                        { id: 'history', label: 'Lịch sử', icon: History }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                                activeTab === tab.id 
                                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                            {tab.count > 0 && <span className="ml-1 bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full">{tab.count}</span>}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                    {activeTab === 'card' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold flex items-center gap-2"><Star className="text-amber-500" /> Đặc quyền hiện tại</h3>
                                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed italic">
                                        "{status?.tierDescription || 'Bạn đang hưởng những ưu đãi cơ bản dành cho thành viên mới.'}"
                                    </p>
                                    <div className="mt-6 flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-700 dark:text-blue-300">
                                        <TrendingUp className="shrink-0" />
                                        <p className="text-sm font-medium">Bạn đang tích lũy {status?.pointEarningRate} điểm cho mỗi 1,000đ chi tiêu.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold flex items-center gap-2"><Info className="text-blue-500" /> Mẹo tích điểm</h3>
                                <div className="space-y-3">
                                    {[
                                        "Đặt bàn Online nhận thêm mã giảm giá độc quyền.",
                                        "Mời bạn bè đăng ký để nhận quà tặng Welcome.",
                                        "Thanh toán qua ví điện tử VNPay nhanh chóng & tích điểm tức thì."
                                    ].map((tip, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">{i+1}</div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{tip}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'wallet' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {myVouchers.length === 0 ? (
                                <div className="col-span-full py-20 text-center space-y-4">
                                    <div className="inline-flex p-6 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-300 dark:text-gray-600"><Ticket size={48} /></div>
                                    <h4 className="text-lg font-bold text-gray-400">Ví của bạn hiện đang trống</h4>
                                    <button onClick={() => setActiveTab('shop')} className="text-primary font-bold hover:underline">Khám phá kho đổi thưởng ngay →</button>
                                </div>
                            ) : myVouchers.map((uv) => (
                                <div key={uv.id} className={`group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 flex gap-6 overflow-hidden transition-all ${uv.isUsed ? 'opacity-60 saturate-0' : 'hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 cursor-default'}`}>
                                    {uv.isUsed && <div className="absolute top-4 right-4 bg-gray-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full rotate-12 z-10">ĐÃ DÙNG</div>}
                                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 text-white ${uv.isUsed ? 'bg-gray-400' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                                        <Ticket size={32} />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg leading-tight">{uv.voucher.voucherName}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono font-bold text-gray-600 dark:text-gray-400">CODE: {uv.voucher.voucherCode}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-2">{uv.voucher.description || 'Sử dụng mã này khi thanh toán để nhận ưu đãi.'}</p>
                                        <div className="pt-2 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                            <Calendar size={12} /> HSD: {new Date(uv.voucher.endDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'shop' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {redeemable.map((voucher) => (
                                <div key={voucher.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 flex flex-col items-center text-center space-y-4 hover:shadow-xl transition-all border-b-4 border-b-blue-500">
                                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center">
                                        <ShoppingBag size={32} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-gray-100">{voucher.voucherName}</h4>
                                        <p className="text-xs text-gray-500 mt-1">{voucher.description || 'Đổi ngay lấy voucher đặc quyền'}</p>
                                    </div>
                                    <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-blue-200">
                                        {voucher.pointsRequired} ĐIỂM
                                    </div>
                                    <button 
                                        disabled={status?.loyaltyPoints < voucher.pointsRequired}
                                        onClick={() => handleRedeem(voucher.id)}
                                        className="w-full py-3 rounded-2xl text-sm font-bold transition-all bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {status?.loyaltyPoints < voucher.pointsRequired ? 'Chưa đủ điểm' : 'Đổi ngay'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-800">
                                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Thời gian</th>
                                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Nội dung</th>
                                            <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Biến động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                        {history.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="px-6 py-4 text-xs text-gray-500">
                                                    {new Date(tx.createdAt).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{tx.description}</p>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{tx.transactionType}</span>
                                                </td>
                                                <td className={`px-6 py-4 text-sm font-black text-right ${tx.amount > 0 ? 'text-green-500' : 'text-danger'}`}>
                                                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default LoyaltyPortalPage;
