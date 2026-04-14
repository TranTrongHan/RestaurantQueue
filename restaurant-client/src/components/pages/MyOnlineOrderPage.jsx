import { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { authApis, endpoints } from "../configs/Apis";
import SpinnerComp from "../common/SpinnerComp";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import toast from 'react-hot-toast';

const MyOnlineOrderPage = () => {
    const [onlineOrders, setOnlineOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cookies,] = useCookies(["token"]);

    const fetchMyOnlineOrder = async (showToast = false) => {
        try {
            setLoading(true);
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['online_order']}/my`;
            let res = await authApis(cookies.token).get(url);
            if (res.status === 200) {
                // Fix: Backend returns a list directly in res.data.result
                setOnlineOrders(res.data.result || []);
                setError(null);
                if (showToast) toast.success("Đã cập nhật danh sách");
            }
        } catch (error) {
            const errorMsg = error.response ? "Không thể tải danh sách đơn hàng" : "Lỗi kết nối mạng";
            setError(errorMsg);
            if (showToast) toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMyOnlineOrder(); }, []);

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    const formatDate = (dateString) => new Date(dateString).toLocaleString('vi-VN');
    const getTotalAmount = (orderItems) => (orderItems || []).reduce((total, item) => total + (item.price * item.quantity), 0);

    if (loading) return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex-1 flex items-center justify-center"><SpinnerComp /></div>
            <Footer />
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl">
                {/* Page Header - Clean & Minimalist */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                        Lịch sử đơn hàng
                    </h1>
                    <div className="h-1 w-20 bg-primary mx-auto rounded-full opacity-60"></div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-5 py-4 rounded-xl text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                {onlineOrders.length === 0 && !loading && (
                    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-100 dark:border-gray-800">
                        <div className="text-5xl mb-4">🛒</div>
                        <h4 className="text-lg font-bold text-gray-400 mb-2">Chưa có đơn hàng nào</h4>
                        <p className="text-gray-400 text-sm">Hãy đặt món ngon đầu tiên của bạn!</p>
                    </div>
                )}

                {/* Orders List */}
                <div className="space-y-6">
                    {onlineOrders.map((order) => (
                        <div key={order.onlineOrderId} className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 dark:border-slate-800 overflow-hidden group">
                            {/* Order Header - Premium Simple */}
                            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                                        #{order.orderId || order.onlineOrderId}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white text-lg">Đơn hàng trực tuyến</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{formatDate(order.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="px-4 py-1.5 rounded-full bg-success/10 text-success text-[10px] font-black uppercase tracking-wider border border-success/10">
                                        {order.status || 'Đã xác nhận'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-8">
                                {/* Order Items */}
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Danh sách món ăn</h4>
                                </div>
                                
                                <div className="space-y-4 mb-10">
                                    {(order.orderItems || []).map((item) => (
                                        <div key={item.orderItemId} className="flex items-center gap-6 p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-transparent hover:border-primary/10 hover:bg-white dark:hover:bg-slate-800 transition-all group/item">
                                            <div className="relative shrink-0">
                                                <img
                                                    src={item.image}
                                                    alt={item.menuItemName || 'Món ăn'}
                                                    className="w-24 h-24 object-cover rounded-[1.5rem] shadow-lg group-hover/item:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-black w-7 h-7 rounded-lg flex items-center justify-center shadow-lg">
                                                    x{item.quantity}
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h5 className="font-black text-slate-800 dark:text-slate-100 mb-1">{item.menuItemName}</h5>
                                                        <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                            {item.orderItemStatus === 'DONE' ? 'Hoàn thành' : 'Đang xử lý'}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Thành tiền</p>
                                                        <p className="font-black text-primary text-lg leading-none">{formatPrice(item.price * item.quantity)}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                                                    <span className="flex items-center gap-1">Đơn giá: {formatPrice(item.price)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Order Footer Section */}
                                <div className="grid md:grid-cols-2 gap-6 p-6 bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
                                    
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-1 h-3 bg-primary rounded-full"></div>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin giao hàng</h4>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <p className="flex justify-between border-b border-white/5 pb-2">
                                                <span className="text-slate-400 font-bold">Người nhận:</span>
                                                <span className="font-black">{order.customer?.fullName || 'N/A'}</span>
                                            </p>
                                            <p className="flex justify-between border-b border-white/5 pb-2">
                                                <span className="text-slate-400 font-bold">Điện thoại:</span>
                                                <span className="font-black">{order.customer?.phone || 'N/A'}</span>
                                            </p>
                                            <p className="flex flex-col gap-1">
                                                <span className="text-slate-400 font-bold">Địa chỉ:</span>
                                                <span className="font-bold text-xs text-slate-300 leading-relaxed">{order.deliveryAddress || 'N/A'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex flex-col justify-end items-end text-right">
                                        <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 w-full md:w-auto min-w-[240px]">
                                            <div className="space-y-2 mb-4 border-b border-white/10 pb-4">
                                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <span>Tạm tính:</span>
                                                    <span>{(order.subTotal !== undefined && order.subTotal !== null) ? formatPrice(order.subTotal) : formatPrice(getTotalAmount(order.orderItems))}</span>
                                                </div>
                                                {(order.discountAmount > 0) && (
                                                    <div className="flex justify-between items-center text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                                                        <span>Giảm giá:</span>
                                                        <span>-{formatPrice(order.discountAmount)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Tổng tiền thanh toán</p>
                                            <p className="text-3xl font-black text-white tracking-tighter mb-3">
                                                {(order.totalAmount !== undefined && order.totalAmount !== null) ? formatPrice(order.totalAmount) : formatPrice(getTotalAmount(order.orderItems))}
                                            </p>
                                            <div className="inline-block px-3 py-1 bg-success/20 text-success text-[10px] font-black rounded-full border border-success/20">
                                                Thanh toán thành công
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Refresh Button */}
                {onlineOrders.length > 0 && (
                    <div className="text-center mt-12 pb-10">
                        <button
                            onClick={() => fetchMyOnlineOrder(true)}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] text-primary border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
                        >
                            {loading ? <SpinnerComp className="w-4 h-4" /> : '↻ Tải lại danh sách'}
                        </button>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default MyOnlineOrderPage;