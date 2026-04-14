import React, { useState, useEffect } from 'react';
import { authApis, endpoints } from '../configs/Apis';
import useAuthStore from '../store/useAuthStore';
import { History, TrendingUp, TrendingDown, UserPlus, Search, Calendar, Filter, User, ArrowUpRight, ArrowDownRight, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

const PointsReportPage = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuthStore();
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    
    const [adjustData, setAdjustData] = useState({
        userId: '',
        points: 0,
        reason: ''
    });

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await authApis(token).get(endpoints.admin_points_report);
            setTransactions(res.data?.result || []);
        } catch (error) {
            toast.error("Không thể tải lịch sử giao dịch");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleAdjust = async (e) => {
        e.preventDefault();
        try {
            await authApis(token).post(endpoints.admin_points_adjust, adjustData);
            toast.success("Điều chỉnh điểm thành công");
            setIsAdjustModalOpen(false);
            setAdjustData({ userId: '', points: 0, reason: '' });
            fetchTransactions();
        } catch (error) {
            toast.error(error.response?.data?.message || "Thao tác thất bại");
        }
    };

    const getTypeStyles = (type) => {
        switch (type) {
            case 'EARN': return 'bg-green-50 text-green-600 border-green-100';
            case 'REDEEM': return 'bg-red-50 text-red-600 border-red-100';
            case 'ADJUST': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'EARN': return <ArrowUpRight size={14} />;
            case 'REDEEM': return <ArrowDownRight size={14} />;
            case 'ADJUST': return <Edit3 size={14} />;
            default: return null;
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Báo cáo & Điều chỉnh điểm</h1>
                    <p className="text-slate-500 text-sm">Theo dõi minh bạch lịch sử tích/tiêu điểm toàn khách hàng</p>
                </div>
                <button
                    onClick={() => setIsAdjustModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-slate-200 font-medium"
                >
                    <UserPlus size={18} /> Điều chỉnh điểm thủ công
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm mb-1">Tổng điểm đã cấp</p>
                        <h4 className="text-2xl font-bold text-green-600">
                            +{transactions.filter(t => t.amount > 0).reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
                        </h4>
                    </div>
                    <div className="p-3 bg-green-50 text-green-500 rounded-xl"><TrendingUp /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm mb-1">Tổng điểm đã tiêu/đổi</p>
                        <h4 className="text-2xl font-bold text-red-600">
                            {transactions.filter(t => t.amount < 0).reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
                        </h4>
                    </div>
                    <div className="p-3 bg-red-50 text-red-500 rounded-xl"><TrendingDown /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-sm mb-1">Giao dịch gần đây</p>
                        <h4 className="text-2xl font-bold text-slate-800">{transactions.length}</h4>
                    </div>
                    <div className="p-3 bg-slate-50 text-slate-500 rounded-xl"><History /></div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Tìm theo Username hoặc Bill ID..." className="w-full pl-10 pr-4 py-2 border-none bg-white rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm ring-1 ring-slate-200" />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white ring-1 ring-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm"><Calendar size={16}/> Tuần này</button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white ring-1 ring-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm"><Filter size={16}/> Loại</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Thời gian</th>
                                <th className="px-6 py-4">Khách hàng</th>
                                <th className="px-6 py-4">Loại</th>
                                <th className="px-6 py-4 text-right">Biến động</th>
                                <th className="px-6 py-4">Lý do / Nội dung</th>
                                <th className="px-6 py-4">Liên kết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(tx.createdAt).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold uppercase">
                                                {tx.user?.username?.substring(0,2) || 'US'}
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700">{tx.user?.username || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getTypeStyles(tx.transactionType)}`}>
                                            {getTypeIcon(tx.transactionType)}
                                            {tx.transactionType}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-slate-600 max-w-xs truncate" title={tx.description}>{tx.description}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {tx.bill && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono">Bill #{tx.bill.billId}</span>}
                                        {tx.userVoucher && <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-1 rounded">Voucher</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Adjustment Modal */}
            {isAdjustModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-800 text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2"><UserPlus /> Điều chỉnh điểm</h2>
                            <button onClick={() => setIsAdjustModalOpen(false)} className="hover:opacity-70 transition-opacity text-white text-2xl">×</button>
                        </div>
                        <form onSubmit={handleAdjust} className="p-6 space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-blue-700 border border-blue-100 text-sm">
                                <User className="shrink-0" />
                                <p>Nhập <b>UserID</b> của khách hàng để thực hiện điều chỉnh. Điểm cộng/trừ sẽ ảnh hưởng trực tiếp đến thứ hạng.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">User ID *</label>
                                <input 
                                    type="text" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="Nhập UserID khách hàng..."
                                    value={adjustData.userId} onChange={e => setAdjustData({...adjustData, userId: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Số điểm thay đổi (+ hoặc -)</label>
                                <input 
                                    type="number" required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg"
                                    placeholder="VD: 50 hoặc -50"
                                    value={adjustData.points} onChange={e => setAdjustData({...adjustData, points: parseInt(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Lý do điều chỉnh *</label>
                                <textarea 
                                    required className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                                    placeholder="Nội dung điều chỉnh cho khách hàng thấy..."
                                    value={adjustData.reason} onChange={e => setAdjustData({...adjustData, reason: e.target.value})}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">Hủy</button>
                                <button type="submit" className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-lg">Xác nhận thay đổi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PointsReportPage;
