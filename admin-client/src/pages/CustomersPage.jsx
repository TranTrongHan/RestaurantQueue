import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApis, endpoints } from '../configs/Apis';
import useAuthStore from '../store/useAuthStore';
import { 
    Users, Search, Mail, Phone
} from 'lucide-react';
import toast from 'react-hot-toast';

const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const { token } = useAuthStore();
    const navigate = useNavigate();

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const res = await authApis(token).get(`${endpoints.admin_customers}?page=${page}&size=8&search=${searchTerm}`);
            setCustomers(res.data.result.data || []);
            setTotalPages(res.data.result.totalPages || 0);
        } catch (error) {
            toast.error("Không thể tải danh sách khách hàng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setPage(1);
            fetchCustomers();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        fetchCustomers();
    }, [page]);

    const handleViewDetail = (userId) => {
        navigate(`/customers/${userId}`);
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản lý Khách hàng</h1>
                    <p className="text-slate-500 font-medium">Theo dõi hoạt động và quản lý hồ sơ thực khách</p>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm theo Tên, Số điện thoại hoặc Email..." 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none text-sm font-medium transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Khách hàng</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Liên hệ</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Hạng thẻ</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Điểm tích lũy</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-8 py-6 h-20 bg-slate-50/20"></td>
                                    </tr>
                                ))
                            ) : customers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center">
                                                <Users size={32} className="text-slate-200" />
                                            </div>
                                            <p className="text-slate-400 font-bold">Không tìm thấy khách hàng nào</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : customers.map((customer) => (
                                <tr key={customer.userId} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-black shadow-sm group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                                                {customer.image ? (
                                                    <img src={customer.image} className="w-full h-full object-cover" />
                                                ) : customer.fullName?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 leading-none mb-1.5">{customer.fullName}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ID: #{customer.userId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-slate-600 flex items-center gap-2"><Mail size={12} className="text-slate-300" /> {customer.email}</p>
                                            <p className="text-sm font-bold text-slate-600 flex items-center gap-2"><Phone size={12} className="text-slate-300" /> {customer.phone}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider border border-amber-100 shadow-sm">
                                            {customer.membershipTier || 'Hạng đồng'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-black text-blue-600">{(customer.loyaltyPoints || 0).toLocaleString()} <span className="text-[10px] uppercase ml-1">đã tích lũy</span></p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => handleViewDetail(customer.userId)}
                                            className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-black hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                                        >
                                            Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-6 border-t border-slate-50 flex justify-between items-center bg-slate-50/20">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trang {page} / {totalPages}</p>
                    <div className="flex gap-2">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-black hover:bg-white disabled:opacity-40 transition-all"
                        >
                            Trước
                        </button>
                        <button 
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-blue-600 disabled:opacity-40 transition-all"
                        >
                            Sau
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomersPage;
