import React, { useState, useEffect } from 'react';
import { authApis, endpoints } from '../configs/Apis';
import useAuthStore from '../store/useAuthStore';
import { Trophy, Edit2, Trash2, Plus, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const MembershipTiersPage = () => {
    const [tiers, setTiers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTier, setEditingTier] = useState(null);
    const [formData, setFormData] = useState({
        tierName: '',
        minSpending: 0,
        pointEarningRate: 1.0,
        description: ''
    });

    const fetchTiers = async () => {
        try {
            setLoading(true);
            const res = await authApis(token).get(endpoints.admin_tiers);
            setTiers(res.data.result);
        } catch (error) {
            toast.error("Không thể tải danh sách hạng thành viên");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTiers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTier) {
                await authApis(token).put(`${endpoints.admin_tiers}/${editingTier.id}`, formData);
                toast.success("Cập nhật thành công");
            } else {
                await authApis(token).post(endpoints.admin_tiers, formData);
                toast.success("Tạo mới thành công");
            }
            setIsModalOpen(false);
            fetchTiers();
        } catch (error) {
            toast.error("Thao tác thất bại");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa hạng thành viên này?")) return;
        try {
            await authApis(token).delete(`${endpoints.admin_tiers}/${id}`);
            toast.success("Đã xóa hạng thành viên");
            fetchTiers();
        } catch (error) {
            toast.error("Xóa thất bại");
        }
    };

    const openEdit = (tier) => {
        setEditingTier(tier);
        setFormData({
            tierName: tier.tierName,
            minSpending: tier.minSpending,
            pointEarningRate: tier.pointEarningRate,
            description: tier.description
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingTier(null);
        setFormData({ tierName: '', minSpending: 0, pointEarningRate: 1.0, description: '' });
    };

    const getTierColor = (name) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('gold')) return 'from-amber-400 to-amber-600 shadow-amber-200';
        if (lowerName.includes('silver')) return 'from-slate-300 to-slate-500 shadow-slate-200';
        return 'from-blue-400 to-blue-600 shadow-blue-200';
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Cấu hình Hạng thành viên</h1>
                    <p className="text-slate-500 text-sm">Quản lý các mốc thăng hạng và đặc quyền của khách hàng</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-200 font-medium"
                >
                    <Plus size={18} /> Thêm hạng mới
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tiers.map((tier) => (
                    <div key={tier.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                        <div className={`h-24 bg-gradient-to-br ${getTierColor(tier.tierName)} p-6 flex justify-between items-start`}>
                            <Trophy className="text-white/80" size={32} />
                            <div className="flex gap-2">
                                <button onClick={() => openEdit(tier)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(tier.id)} className="p-2 bg-white/20 hover:bg-red-500 rounded-lg text-white transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 -mt-8">
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-50">
                                <h3 className="text-xl font-bold text-slate-800">{tier.tierName}</h3>
                                <p className="text-slate-500 text-sm mt-1">{tier.description || "Chưa có mô tả"}</p>
                            </div>
                            
                            <div className="mt-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">Chi tiêu tối thiểu</span>
                                    <span className="font-bold text-slate-700">{tier.minSpending.toLocaleString()} VNĐ</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 text-sm">Tỷ lệ tích điểm</span>
                                    <span className="font-bold text-blue-600">x{tier.pointEarningRate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">{editingTier ? 'Chỉnh sửa hạng' : 'Thêm hạng mới'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên hạng</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.tierName}
                                    onChange={(e) => setFormData({ ...formData, tierName: e.target.value })}
                                    placeholder="Ví dụ: Gold Member"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mức chi tiêu tối thiểu (VNĐ)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.minSpending}
                                    onChange={(e) => setFormData({ ...formData, minSpending: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tỷ lệ tích điểm (Multiplier)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.pointEarningRate}
                                    onChange={(e) => setFormData({ ...formData, pointEarningRate: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Info size={12}/> Mặc định là 1.0 (1,000đ = 1đ)</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả đặc quyền</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-200"
                                >
                                    Lưu cấu hình
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipTiersPage;
