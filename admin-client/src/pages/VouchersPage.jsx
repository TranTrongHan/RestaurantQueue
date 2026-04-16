import React, { useState, useEffect } from 'react';
import { authApis, endpoints } from '../configs/Apis';
import useAuthStore from '../store/useAuthStore';
import { Ticket, Plus, Trash2, Search, Filter, Calendar, Tag, ChevronDown, CheckCircle2, Clock, Percent, Banknote, Globe, UtensilsCrossed, Shield, User, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

const VouchersPage = () => {
    const [vouchers, setVouchers] = useState([]);
    const [tiers, setTiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedVoucherId, setSelectedVoucherId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const initialFormState = {
        voucherCode: '',
        voucherName: '',
        voucherType: 'PERCENTAGE', // PERCENTAGE / FIXED
        discountValue: 0,
        maxDiscountAmount: 0,
        minOrderValue: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        targetTierId: '',
        isNewMemberVoucher: false,
        isLevelUpReward: false,
        pointsRequired: 0,
        applyType: 'BOTH', // ONLINE / DINE_IN / BOTH
        description: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleOpenCreateModal = () => {
        setFormData(initialFormState);
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (voucher) => {
        setFormData({
            ...voucher,
            targetTierId: voucher.targetTierId || '',
            startDate: voucher.startDate?.split('T')[0] || '',
            endDate: voucher.endDate?.split('T')[0] || '',
            // Ensure boolean fields are correctly set
            isNewMemberVoucher: !!voucher.isNewMemberVoucher,
            isLevelUpReward: !!voucher.isLevelUpReward
        });
        setSelectedVoucherId(voucher.id);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const CustomSelect = ({ label, value, options, onChange, placeholder = "Chọn một tùy chọn" }) => {
        const [isOpen, setIsOpen] = useState(false);
        const selectedOption = options.find(opt => opt.value === value);

        return (
            <div className="relative">
                {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
                <div 
                    className={`form-input-indigo flex items-center justify-between cursor-pointer group ${isOpen ? 'ring-4 ring-indigo-500/10 border-indigo-500 shadow-sm' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <div className="flex items-center gap-3">
                        {selectedOption?.icon && <selectedOption.icon size={16} className="text-indigo-500" />}
                        <span className={selectedOption ? "text-slate-700 font-bold" : "text-slate-400 font-medium"}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                    </div>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)}></div>
                        <div className="absolute z-[70] w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="max-h-60 overflow-y-auto">
                                {options.map((opt) => (
                                    <div 
                                        key={opt.value}
                                        className={`px-4 py-3 hover:bg-slate-50 flex items-center gap-3 cursor-pointer transition-all border-l-4 ${value === opt.value ? 'bg-indigo-50/50 border-indigo-500 text-indigo-700' : 'border-transparent text-slate-600 hover:border-slate-200'}`}
                                        onClick={() => {
                                            onChange(opt.value);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <div className={`p-2 rounded-lg ${value === opt.value ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                            {opt.icon && <opt.icon size={14} />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm leading-none mb-1">{opt.label}</span>
                                            {opt.description && <span className="text-[10px] opacity-60 font-medium">{opt.description}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [voucherRes, tierRes] = await Promise.all([
                authApis(token).get(endpoints.admin_vouchers),
                authApis(token).get(endpoints.admin_tiers)
            ]);
            setVouchers(voucherRes.data?.result || []);
            setTiers(tierRes.data?.result || []);
        } catch (error) {
            toast.error("Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Configuration Validation based on Documentation
        if (formData.isNewMemberVoucher && formData.isLevelUpReward) {
            return toast.error("Không thể vừa là Voucher thành viên mới vừa là Thưởng thăng hạng");
        }
        if (formData.isLevelUpReward && !formData.targetTierId) {
            return toast.error("Thưởng thăng hạng yêu cầu chọn Hạng thành viên áp dụng");
        }
        if (formData.isNewMemberVoucher && formData.targetTierId) {
            return toast.error("Voucher thành viên mới không thể giới hạn Hạng thành viên");
        }

        try {
            const payload = {
                ...formData,
                targetTierId: formData.targetTierId ? parseInt(formData.targetTierId) : null,
                startDate: formData.startDate + "T00:00:00",
                endDate: formData.endDate + "T23:59:59"
            };

            if (isEditMode) {
                await authApis(token).put(`${endpoints.admin_vouchers}/${selectedVoucherId}`, payload);
                toast.success("Cập nhật voucher thành công");
            } else {
                await authApis(token).post(endpoints.admin_vouchers, payload);
                toast.success("Tạo voucher thành công");
            }
            
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Thao tác thất bại");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Xóa voucher này sẽ làm nó biến mất khỏi ví của khách hàng chưa sử dụng. Tiếp tục?")) return;
        try {
            await authApis(token).delete(`${endpoints.admin_vouchers}/${id}`);
            toast.success("Đã xóa voucher");
            fetchData();
        } catch (error) {
            toast.error("Xóa thất bại");
        }
    };

    const isExpired = (endDate) => new Date(endDate) < new Date();
    const isUpcoming = (startDate) => new Date(startDate) > new Date();

    const filteredVouchers = vouchers.filter(v => 
        v.voucherCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.voucherName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Quản lý Mã giảm giá</h1>
                    <p className="text-slate-500 text-sm">Tạo và quản lý các chương trình ưu đãi, khuyến mãi</p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-200 font-medium"
                >
                    <Plus size={18} /> Tạo Voucher mới
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm theo mã hoặc tên voucher..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium">
                        <Filter size={16} /> Lọc trạng thái
                    </button>
                </div>
            </div>

            {/* Vouchers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVouchers.map((voucher) => (
                    <div key={voucher.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex group">
                        {/* Voucher Left Side (Decorative) */}
                        <div className={`w-24 flex flex-col items-center justify-center text-white relative ${isExpired(voucher.endDate) ? 'bg-slate-400' : 'bg-indigo-500'}`}>
                            <div className="absolute -left-2 top-0 bottom-0 w-4 flex flex-col justify-around py-2">
                                {[...Array(8)].map((_, i) => <div key={i} className="w-4 h-4 rounded-full bg-slate-50 -ml-2"></div>)}
                            </div>
                            <Ticket size={32} className="mb-2 opacity-80" />
                            <span className="text-[10px] font-bold uppercase tracking-wider vertical-text">VOUCHER</span>
                        </div>

                        {/* Voucher Right Side */}
                        <div className="flex-1 p-5 relative">
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                                    isExpired(voucher.endDate) ? 'bg-red-50 text-red-500' : 
                                    isUpcoming(voucher.startDate) ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'
                                }`}>
                                    {isExpired(voucher.endDate) ? 'Hết hạn' : isUpcoming(voucher.startDate) ? 'Sắp tới' : 'Đang chạy'}
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenEditModal(voucher)} className="text-slate-300 hover:text-indigo-500 transition-colors">
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(voucher.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{voucher.voucherName}</h3>
                            <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">{voucher.voucherCode}</code>
                            
                            <div className="mt-4 space-y-2 text-xs text-slate-500">
                                <div className="flex items-center gap-2">
                                    <Tag size={14} className="text-indigo-400" />
                                    <span>Giảm: <strong>{voucher.voucherType === 'PERCENTAGE' ? `${voucher.discountValue}%` : `${voucher.discountValue.toLocaleString()}đ`}</strong></span>
                                    {voucher.maxDiscountAmount > 0 && <span> (Tối đa {voucher.maxDiscountAmount.toLocaleString()}đ)</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-indigo-400" />
                                    <span>{new Date(voucher.startDate).toLocaleDateString()} - {new Date(voucher.endDate).toLocaleDateString()}</span>
                                </div>
                                {voucher.targetTierName && (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={14} className="text-amber-500" />
                                        <span>Dành cho: <strong className="text-amber-600">{voucher.targetTierName}</strong></span>
                                    </div>
                                )}
                                {voucher.pointsRequired > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-blue-400" />
                                        <span>Đổi bằng: <strong>{voucher.pointsRequired} điểm</strong></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Voucher Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {isEditMode ? <Pencil size={20} /> : <Plus />} 
                                {isEditMode ? 'Cập nhật Voucher' : 'Thiết lập Voucher mới'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform"><Plus className="rotate-45" /></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Thông tin cơ bản</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Mã Voucher {isEditMode && '(Không thể thay đổi)'}</label>
                                        <input type="text" required disabled={isEditMode} className={`form-input-indigo w-full ${isEditMode ? 'bg-slate-50 cursor-not-allowed opacity-70' : ''}`} placeholder="VD: TET2024" 
                                            value={formData.voucherCode} onChange={e => setFormData({...formData, voucherCode: e.target.value.toUpperCase()})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Tên chương trình *</label>
                                        <input type="text" required className="form-input-indigo w-full" placeholder="VD: Khuyến mãi Tết Giáp Thìn"
                                            value={formData.voucherName} onChange={e => setFormData({...formData, voucherName: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả chi tiết</label>
                                        <textarea className="form-input-indigo w-full h-20 resize-none" placeholder="Quy định áp dụng..."
                                            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                    </div>
                                </div>

                                {/* Discount Config */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Cấu hình giảm giá</h4>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                    <CustomSelect 
                                        label="Loại giảm"
                                        value={formData.voucherType}
                                        onChange={val => setFormData({...formData, voucherType: val})}
                                        options={[
                                            { value: 'PERCENTAGE', label: 'Phần trăm', description: 'Giảm theo % tổng đơn', icon: Percent },
                                            { value: 'FIXED', label: 'Cố định', description: 'Trừ thẳng vào hóa đơn', icon: Banknote }
                                        ]}
                                    />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Giá trị giảm *</label>
                                            <input type="number" required className="form-input-indigo w-full" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Giảm tối đa (đ)</label>
                                            <input type="number" className="form-input-indigo w-full" value={formData.maxDiscountAmount} onChange={e => setFormData({...formData, maxDiscountAmount: e.target.value})} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Đơn tối thiểu (đ)</label>
                                            <input type="number" className="form-input-indigo w-full" value={formData.minOrderValue} onChange={e => setFormData({...formData, minOrderValue: e.target.value})} />
                                        </div>
                                    </div>
                                    <CustomSelect 
                                        label="Loại đơn áp dụng"
                                        value={formData.applyType}
                                        onChange={val => setFormData({...formData, applyType: val})}
                                        options={[
                                            { value: 'BOTH', label: 'Tất cả đơn hàng', description: 'Áp dụng cho mọi hình thức', icon: Globe },
                                            { value: 'ONLINE', label: 'Chỉ đặt Online', description: 'Áp dụng cho đơn qua web/app', icon: Globe },
                                            { value: 'DINE_IN', label: 'Chỉ tại chỗ', description: 'Áp dụng cho đơn tại quán', icon: UtensilsCrossed }
                                        ]}
                                    />
                                </div>

                                {/* Rules & Targets */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Đối tượng & Thời gian</h4>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Bắt đầu</label>
                                            <input type="date" className="form-input-indigo w-full" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Kết thúc</label>
                                            <input type="date" required className="form-input-indigo w-full" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                                        </div>
                                    </div>
                                    <CustomSelect 
                                        label="Hạng thành viên áp dụng"
                                        value={formData.targetTierId}
                                        onChange={val => setFormData({...formData, targetTierId: val})}
                                        placeholder="-- Tất cả các hạng --"
                                        options={[
                                            { value: '', label: 'Tất cả các hạng', description: 'Ai cũng có thể sử dụng', icon: User },
                                            ...tiers.map(t => ({
                                                value: t.id,
                                                label: t.tierName,
                                                description: `Tối thiểu ${t.minSpend?.toLocaleString()}đ chi tiêu`,
                                                icon: Shield
                                            }))
                                        ]}
                                    />
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Điểm yêu cầu đổi (0 nếu cho không)</label>
                                        <input type="number" className="form-input-indigo w-full text-blue-600 font-bold" value={formData.pointsRequired} onChange={e => setFormData({...formData, pointsRequired: e.target.value})} />
                                    </div>
                                </div>

                                {/* Special Logic */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Tính năng nâng cao</h4>
                                    <div className="space-y-3 pt-2">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input type="checkbox" className="sr-only peer" checked={formData.isNewMemberVoucher} onChange={e => setFormData({...formData, isNewMemberVoucher: e.target.checked})} />
                                                <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors"></div>
                                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">Voucher cho thành viên mới</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input type="checkbox" className="sr-only peer" checked={formData.isLevelUpReward} onChange={e => setFormData({...formData, isLevelUpReward: e.target.checked})} />
                                                <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors"></div>
                                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                            </div>
                                            <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">Thưởng khi thăng hạng</span>
                                        </label>
                                    </div>
                                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 mt-4">
                                        <p className="text-[10px] text-amber-700 font-medium">
                                            * Lưu ý: "Thưởng thăng hạng" yêu cầu chọn cụ thể Hạng áp dụng. Hệ thống sẽ tự động gửi Voucher này khi khách đạt mốc chi tiêu.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors">Hủy bỏ</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                    {isEditMode ? 'Lưu thay đổi' : 'Kích hoạt Voucher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .form-input-indigo {
                    @apply px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all bg-white text-sm font-medium text-slate-700;
                }
                .vertical-text {
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                }
            `}</style>
        </div>
    );
};

export default VouchersPage;
