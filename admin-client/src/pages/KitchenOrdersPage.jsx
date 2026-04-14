import React, { useEffect, useState } from "react";
import { authApis, endpoints } from "../configs/Apis";
import useAuthStore from "../store/useAuthStore";
import moment from "moment";
import SpinnerComp from "../components/common/SpinnerComp";
import { 
  Soup, 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  LayoutGrid, 
  ListOrdered,
  AlertCircle,
  Hash
} from "lucide-react";
import toast from 'react-hot-toast';
import { db } from "../configs/firebase";
import { collectionGroup, onSnapshot, query, where, orderBy } from "firebase/firestore";

const KitchenOrdersPage = () => {
    const [orderItems, setOrderItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [viewMode, setViewMode] = useState("QUEUE"); // "QUEUE" or "TABLE"
    const { token } = useAuthStore();

    useEffect(() => {
        setLoading(true);
        // collectionGroup query to get all orderItems with PENDING or COOKING status
        const q = query(
            collectionGroup(db, "orderItems"),
            where("status", "in", ["PENDING", "COOKING"]),
            orderBy("orderedAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(docSnap => ({
                id: docSnap.id,
                ref: docSnap.ref, // Keep ref in case we need it, though we update via API
                ...docSnap.data()
            }));
            setOrderItems(items);
            setLoading(false);
        }, (error) => {
            console.error("Firestore Error:", error);
            if (error.code === 'failed-precondition') {
                toast.error("Thiếu index Firestore. Vui lòng kiểm tra console log để tạo index.");
            } else {
                toast.error("Lỗi khi tải dữ liệu từ Firestore.");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleUpdateStatus = async (item, newStatus) => {
        try {
            setActionLoading(item.id);
            // The new API endpoint is /api/admin/order_item/{orderItemId}/status
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.admin_order_item}/${item.id}/status`;
            await authApis(token).put(url, null, {
                params: { status: newStatus }
            });
            toast.success(newStatus === "COOKING" ? "Bắt đầu chế biến!" : "Đã xong món ăn!");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Lỗi cập nhật trạng thái!");
        } finally {
            setActionLoading(null);
        }
    };

    const getTimeElapsed = (orderedAt) => {
        if (!orderedAt) return "";
        const now = moment();
        const orderedTime = moment(orderedAt.toDate());
        const minutes = now.diff(orderedTime, 'minutes');
        return minutes;
    };

    const getTimerColor = (minutes) => {
        if (minutes < 10) return "bg-emerald-50 text-emerald-600 border-emerald-100";
        if (minutes < 20) return "bg-amber-50 text-amber-600 border-amber-100";
        return "bg-red-50 text-red-600 border-red-100 animate-pulse";
    };

    // Grouping logic for Table View
    const groupedItemsByTable = orderItems.reduce((acc, item) => {
        const table = item.tableName || "Không xác định";
        if (!acc[table]) acc[table] = [];
        acc[table].push(item);
        return acc;
    }, {});

    const renderItemCard = (item) => {
        const minutes = getTimeElapsed(item.orderedAt);
        
        return (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full">
                {/* Header: Item name and Timer */}
                <div className="p-4 border-b border-slate-50 flex justify-between items-start gap-3 min-h-[95px]">
                    <div className="flex items-start gap-3 flex-1 overflow-hidden">
                        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold ${item.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            {item.status === 'PENDING' ? <Clock size={20} /> : <ChefHat size={20} />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-slate-800 leading-tight line-clamp-2 min-h-[2.5rem]">
                                {item.name}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">Số lượng: <span className="font-bold text-slate-700">{item.quantity}</span></p>
                        </div>
                    </div>
                    <div className={`px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider shrink-0 mt-1 ${getTimerColor(minutes)}`}>
                        {minutes} phút
                    </div>
                </div>

                {/* Body: Note and Table info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Hash size={14} className="text-slate-400" />
                            <span>Bàn: <span className="font-bold text-slate-700">{item.tableName}</span></span>
                        </div>

                        {item.note ? (
                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex gap-2">
                                <AlertCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-slate-600 leading-relaxed italic line-clamp-3">"{item.note}"</p>
                            </div>
                        ) : (
                            <div className="h-10 invisible"></div> // Placeholder for consistent height if no note
                        )}
                    </div>
                </div>

                {/* Action Button: Always pushed to the bottom */}
                <div className="p-3 bg-slate-50/50 border-t border-slate-100 mt-auto">
                    {item.status === "PENDING" ? (
                        <button 
                            onClick={() => handleUpdateStatus(item, "COOKING")}
                            disabled={actionLoading === item.id}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                        >
                            {actionLoading === item.id ? <SpinnerComp className="w-4 h-4 border-white" /> : <ChefHat size={14} />}
                            Bắt đầu nấu
                        </button>
                    ) : (
                        <button 
                            onClick={() => handleUpdateStatus(item, "DONE")}
                            disabled={actionLoading === item.id}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                        >
                            {actionLoading === item.id ? <SpinnerComp className="w-4 h-4 border-white" /> : <CheckCircle2 size={14} />}
                            Đã xong
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <Soup className="text-blue-600" size={28} />
                        Màn hình Bếp (Kitchen)
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý và điều phối chế biến món ăn thời gian thực</p>
                </div>
                
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                    <button 
                        onClick={() => setViewMode("QUEUE")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === "QUEUE" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        <ListOrdered size={16} />
                        HÀNG ĐỢI
                    </button>
                    <button 
                        onClick={() => setViewMode("TABLE")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === "TABLE" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        <LayoutGrid size={16} />
                        THEO BÀN
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[32px] border border-slate-100 shadow-sm">
                    <SpinnerComp className="w-12 h-12 border-blue-600 border-t-transparent" />
                    <p className="mt-4 text-slate-400 text-sm font-medium animate-pulse tracking-widest uppercase">Đang nhận order từ khách...</p>
                </div>
            ) : orderItems.length === 0 ? (
                <div className="flex-1 bg-white rounded-[32px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-10">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[28px] flex items-center justify-center mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sạch bóng Record!</h3>
                    <p className="text-slate-400 max-w-sm mx-auto mt-2 italic">Hiện tại không có món nào đang chờ chế biến. Hãy nghỉ ngơi một lát!</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-none">
                    {viewMode === "QUEUE" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                            {orderItems.map(item => renderItemCard(item))}
                        </div>
                    ) : (
                        <div className="space-y-10 pb-10">
                            {Object.entries(groupedItemsByTable).map(([tableName, items]) => (
                                <div key={tableName} className="space-y-4">
                                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                                        <div className="h-1 flex-1 bg-slate-100 rounded-full"></div>
                                        <span>Bàn {tableName} ({items.length})</span>
                                        <div className="h-1 flex-1 bg-slate-100 rounded-full"></div>
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {items.map(item => renderItemCard(item))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default KitchenOrdersPage;
