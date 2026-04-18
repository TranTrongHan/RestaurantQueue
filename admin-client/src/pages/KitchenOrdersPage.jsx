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
  Hash,
  Zap,
  Timer
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

    // Helper to safely convert Firestore Timestamp to Date/Moment
    const toDate = (timestamp) => {
        if (!timestamp) return null;
        if (timestamp.toDate) return timestamp.toDate();
        if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
        return new Date(timestamp);
    };

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
        const orderedTime = moment(toDate(orderedAt));
        const minutes = now.diff(orderedTime, 'minutes');
        return minutes;
    };

    const getDeadlineInfo = (deadlineTime) => {
        if (!deadlineTime) return null;
        const now = moment();
        const deadline = moment(toDate(deadlineTime));
        const minutesLeft = deadline.diff(now, 'minutes');
        return {
            time: deadline.format('HH:mm'),
            minutesLeft: minutesLeft,
            isOverdue: minutesLeft < 0
        };
    };

    const getDeadlineColor = (minutesLeft) => {
        if (minutesLeft === null) return "text-slate-400";
        if (minutesLeft < 0) return "bg-rose-100 text-rose-600 border-rose-200 animate-pulse";
        if (minutesLeft <= 5) return "bg-orange-100 text-orange-600 border-orange-200";
        return "bg-sky-50 text-sky-600 border-sky-100";
    };

    const getTimerColor = (minutes) => {
        if (minutes < 10) return "bg-emerald-50 text-emerald-600 border-emerald-100";
        if (minutes < 20) return "bg-amber-50 text-amber-600 border-amber-100";
        return "bg-red-50 text-red-600 border-red-100 animate-pulse";
    };

    const getPriorityConfig = (priority) => {
        switch(priority) {
            case 3: return { label: "GOLD", color: "bg-amber-100 text-amber-600 border-amber-200", icon: <Zap size={14} className="fill-current" /> };
            case 2: return { label: "SILVER", color: "bg-slate-200 text-slate-700 border-slate-300", icon: <Zap size={14} /> };
            default: return { label: "NEW", color: "bg-slate-50 text-slate-400 border-slate-100", icon: null };
        }
    };

    // Sorting logic
    const sortedItems = [...orderItems].sort((a, b) => {
        if (viewMode === "QUEUE") {
            return (a.orderedAt?.seconds || 0) - (b.orderedAt?.seconds || 0);
        }
        if (viewMode === "PRIORITY") {
            // Sort by priority DESC, then by time ASC
            if ((b.priority || 1) !== (a.priority || 1)) {
                return (b.priority || 1) - (a.priority || 1);
            }
            return (a.orderedAt?.seconds || 0) - (b.orderedAt?.seconds || 0);
        }
        return 0; // TABLE view handles grouping separately
    });

    // Grouping logic for Table View
    const groupedItemsByTable = orderItems.reduce((acc, item) => {
        const table = item.tableName || "Không xác định";
        if (!acc[table]) acc[table] = [];
        acc[table].push(item);
        return acc;
    }, {});

    // Grouping logic for Priority View
    const groupedItemsByPriority = orderItems.reduce((acc, item) => {
        const p = item.priority || 1;
        if (!acc[p]) acc[p] = [];
        acc[p].push(item);
        return acc;
    }, {});

    const renderItemCard = (item) => {
        const minutes = getTimeElapsed(item.orderedAt);
        const deadlineInfo = getDeadlineInfo(item.deadlineTime);
        const priorityConfig = getPriorityConfig(item.priority);
        
        return (
            <div key={item.id} className={`bg-white rounded-2xl border ${item.priority >= 2 ? 'border-amber-200' : 'border-slate-200'} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full relative`}>
                {item.priority >= 2 && (
                    <div className="absolute top-0 right-12 px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black rounded-b-lg shadow-sm z-10">
                        {priorityConfig.label}
                    </div>
                )}

                {/* Header: Item name and Timer */}
                <div className="p-4 border-b border-slate-50 flex justify-between items-start gap-3 min-h-[95px]">
                    <div className="flex items-start gap-3 flex-1 overflow-hidden">
                        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold ${item.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            {item.status === 'PENDING' ? <Clock size={20} /> : <ChefHat size={20} />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                                <h3 className="font-bold text-slate-800 leading-tight line-clamp-2 flex-1">
                                    {item.name}
                                </h3>
                                {priorityConfig.icon && (
                                    <div className={`${priorityConfig.color} p-1 rounded-md border shrink-0`}>
                                        {priorityConfig.icon}
                                    </div>
                                )}
                            </div>
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
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Hash size={14} className="text-slate-400" />
                                <span>Bàn: <span className="font-bold text-slate-700">{item.tableName}</span></span>
                            </div>
                            
                            {deadlineInfo && (
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${getDeadlineColor(deadlineInfo.minutesLeft)}`}>
                                    <Timer size={12} />
                                    <span>{deadlineInfo.isOverdue ? 'Quá hạn' : `${deadlineInfo.minutesLeft}m`} ({deadlineInfo.time})</span>
                                </div>
                            )}
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
                        onClick={() => setViewMode("PRIORITY")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${viewMode === "PRIORITY" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                    >
                        <Zap size={16} />
                        ƯU TIÊN
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
                            {sortedItems.map(item => renderItemCard(item))}
                        </div>
                    ) : viewMode === "PRIORITY" ? (
                        <div className="space-y-10 pb-10">
                            {[3, 2, 1].map(priorityLevel => {
                                const items = groupedItemsByPriority[priorityLevel] || [];
                                if (items.length === 0) return null;
                                const config = getPriorityConfig(priorityLevel);
                                
                                return (
                                    <div key={priorityLevel} className="space-y-4">
                                        <h2 className={`text-sm font-black uppercase tracking-widest flex items-center gap-3 ${config.label === 'GOLD' ? 'text-amber-500' : 'text-slate-400'}`}>
                                            <div className={`h-1 flex-1 rounded-full opacity-20 ${config.label === 'GOLD' ? 'bg-amber-500' : 'bg-slate-200'}`}></div>
                                            <span className="flex items-center gap-2">
                                                {config.icon}
                                                {config.label} MEMBER ({items.length})
                                            </span>
                                            <div className={`h-1 flex-1 rounded-full opacity-20 ${config.label === 'GOLD' ? 'bg-amber-500' : 'bg-slate-200'}`}></div>
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {items.sort((a, b) => (a.orderedAt?.seconds || 0) - (b.orderedAt?.seconds || 0)).map(item => renderItemCard(item))}
                                        </div>
                                    </div>
                                );
                            })}
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
