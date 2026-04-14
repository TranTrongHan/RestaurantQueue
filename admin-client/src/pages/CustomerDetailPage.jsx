import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authApis, endpoints } from '../configs/Apis';
import useAuthStore from '../store/useAuthStore';
import { 
    Users, Mail, Phone, X, Save, Clock, ArrowLeft,
    ShoppingBag, Utensils
} from 'lucide-react';
import toast from 'react-hot-toast';

const CustomerDetailPage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuthStore();
    
    const [customer, setCustomer] = useState(null);
    const [orderHistory, setOrderHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'history'
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [historyFilter, setHistoryFilter] = useState('ALL'); // 'ALL' | 'ONLINE' | 'DINE_IN'

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [customerRes, historyRes] = await Promise.all([
                    authApis(token).get(`${endpoints.admin_customers}/${userId}`),
                    authApis(token).get(`${endpoints.admin_customers}/${userId}/orders`)
                ]);
                setCustomer(customerRes.data.result);
                setOrderHistory(historyRes.data.result || []);
            } catch (error) {
                toast.error("Không thể tải thông tin khách hàng");
                navigate('/customers');
            } finally {
                setLoading(false);
            }
        };

        if (userId) fetchAllData();
    }, [userId, token, navigate]);

    const handleUpdateCustomer = async (e) => {
        e.preventDefault();
        try {
            setIsUpdating(true);
            await authApis(token).put(`${endpoints.admin_customers}/${userId}`, customer);
            toast.success("Cập nhật thông tin thành công");
        } catch (error) {
            toast.error("Cập nhật thất bại");
        } finally {
            setIsUpdating(false);
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    const formatDate = (dateString) => new Date(dateString).toLocaleString('vi-VN');

    if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (!customer) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => navigate('/customers')}
                        className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-500/20 overflow-hidden">
                            {customer.image ? <img src={customer.image} className="w-full h-full object-cover" /> : customer.fullName?.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{customer.fullName}</h1>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-lg">#{customer.userId}</span>
                            </div>
                            <p className="text-slate-500 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Khách hàng đang hoạt động
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
                {/* Navigation Tabs */}
                <div className="px-10 flex gap-10 border-b border-slate-50 bg-slate-50/30">
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`py-6 text-xs font-black uppercase tracking-[0.2em] border-b-4 transition-all ${activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <Users size={14} className="inline mr-2" /> Thông tin hồ sơ
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`py-6 text-xs font-black uppercase tracking-[0.2em] border-b-4 transition-all ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <Clock size={14} className="inline mr-2" /> Lịch sử giao dịch
                    </button>
                </div>

                <div className="p-10">
                    {activeTab === 'profile' ? (
                        <form onSubmit={handleUpdateCustomer} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <div className="lg:col-span-2 space-y-10">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Thông tin chi tiết</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Họ và tên</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                                value={customer.fullName || ''}
                                                onChange={(e) => setCustomer({...customer, fullName: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Số điện thoại</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                                value={customer.phone || ''}
                                                onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Địa chỉ Email</label>
                                            <input 
                                                type="email" 
                                                className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800"
                                                value={customer.email || ''}
                                                onChange={(e) => setCustomer({...customer, email: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Địa chỉ thường trú</label>
                                            <textarea 
                                                className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-slate-800 h-32 resize-none"
                                                value={customer.address || ''}
                                                onChange={(e) => setCustomer({...customer, address: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-amber-400 rounded-full"></div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thẻ thành viên</h4>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Hạng hiện tại</p>
                                                <p className="text-2xl font-black text-amber-400">{customer.membershipTier || 'Hạng Đồng'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Điểm tích lũy</p>
                                                <p className="text-2xl font-black text-white">{(customer.loyaltyPoints || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-white/10">
                                            <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed">
                                                * Khách hàng đủ điều kiện nhận ưu đãi giảm giá 5% cho đơn hàng tiếp theo.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleUpdateCustomer}
                                    disabled={isUpdating}
                                    className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    {isUpdating ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><Save size={18} /> Lưu thay đổi</>}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                                        <ShoppingBag size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Tổng số giao dịch</p>
                                        <p className="text-lg font-black text-slate-900">{orderHistory.length} đơn hàng</p>
                                    </div>
                                </div>
                                <div className="flex bg-slate-200/50 p-1 rounded-2xl self-stretch md:self-auto">
                                    <button 
                                        onClick={() => setHistoryFilter('ALL')}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${historyFilter === 'ALL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Tất cả
                                    </button>
                                    <button 
                                        onClick={() => setHistoryFilter('ONLINE')}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${historyFilter === 'ONLINE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Online
                                    </button>
                                    <button 
                                        onClick={() => setHistoryFilter('DINE_IN')}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${historyFilter === 'DINE_IN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Tại bàn
                                    </button>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Tổng chi tiêu</p>
                                    <p className="text-lg font-black text-blue-600">{formatPrice(orderHistory.reduce((sum, o) => sum + o.totalAmount, 0))}</p>
                                </div>
                            </div>

                            {orderHistory.filter(o => historyFilter === 'ALL' || o.orderType === historyFilter).length === 0 ? (
                                <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                                    <p className="text-slate-400 font-bold italic">Không tìm thấy đơn hàng nào</p>
                                </div>
                            ) : (
                                <div className="relative pl-12 space-y-12 before:absolute before:left-[1.35rem] before:top-2 before:bottom-2 before:w-1 before:bg-slate-100 before:rounded-full">
                                    {orderHistory
                                        .filter(o => historyFilter === 'ALL' || o.orderType === historyFilter)
                                        .map((order, idx) => (
                                        <div key={idx} className="relative group">
                                            <div className={`absolute -left-[1.35rem] -translate-x-1/2 top-4 w-11 h-11 rounded-2xl flex items-center justify-center z-10 shadow-lg ${order.orderType === 'ONLINE' ? 'bg-indigo-600' : 'bg-emerald-600'} group-hover:scale-110 transition-all duration-300 ring-4 ring-white`}>
                                                {order.orderType === 'ONLINE' ? <ShoppingBag size={18} className="text-white" /> : <Utensils size={18} className="text-white" />}
                                            </div>
                                            
                                            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 hover:shadow-xl hover:border-blue-100 transition-all duration-500">
                                                <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 border-b border-slate-50 pb-8">
                                                    <div className="space-y-3">
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase">#{order.orderId}</span>
                                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${order.orderType === 'ONLINE' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                                {order.orderType === 'ONLINE' ? 'Đặt Online' : 'Tại chỗ'}
                                                            </span>
                                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${order.isPaid ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                {order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-400 text-xs font-bold leading-relaxed">
                                                            {order.orderType === 'ONLINE' ? 'Giao hàng tại: ' : 'Phục vụ tại: '} 
                                                            <span className="text-slate-900">
                                                                {order.orderType === 'ONLINE' 
                                                                    ? (order.metadata?.deliveryAddress || 'N/A') 
                                                                    : (order.metadata?.tableName || 'N/A')}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <div className="md:text-right">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian giao dịch</p>
                                                        <p className="text-sm font-black text-slate-800">{formatDate(order.createdAt)}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-white transition-colors border border-transparent hover:border-slate-100">
                                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs shrink-0 overflow-hidden shadow-sm">
                                                                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : item.quantity + 'x'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-black text-slate-800 truncate">{item.menuItemName}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{item.quantity} x {formatPrice(item.price)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex justify-between items-center bg-slate-900 p-6 rounded-[2rem] text-white">
                                                    <div className="flex gap-10">
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Tạm tính</p>
                                                            <p className="text-sm font-black">{formatPrice(order.subTotal)}</p>
                                                        </div>
                                                        {order.discountAmount > 0 && (
                                                            <div>
                                                                <p className="text-[10px] font-black text-rose-400 uppercase mb-1 tracking-widest">Giảm giá</p>
                                                                <p className="text-sm font-black text-rose-400">-{formatPrice(order.discountAmount)}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Thanh toán</p>
                                                        <p className="text-2xl font-black text-white">{formatPrice(order.totalAmount)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerDetailPage;
