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
                setOnlineOrders(res.data.result.data || []);
                setError(null);
                if (showToast) toast.success("Đã tải lại danh sách");
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
    const getTotalAmount = (orderItems) => orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);

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
                {/* Page Header */}
                <div className="text-center mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary to-orange-600 text-white shadow-lg shadow-primary/30">
                    <h2 className="text-2xl font-extrabold">Đơn Hàng Của Tôi</h2>
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
                        <div key={order.onlineOrderId} className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                            {/* Order Header */}
                            <div className="bg-gradient-to-r from-primary to-orange-600 text-white px-6 py-5 flex justify-between items-center">
                                <div>
                                    <h5 className="font-extrabold text-lg">Đơn hàng #{order.orderId}</h5>
                                    <small className="opacity-90 text-sm">Đặt lúc: {formatDate(order.createdAt)}</small>
                                </div>
                                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-4 py-1.5 rounded-full">
                                    Đã thanh toán
                                </span>
                            </div>

                            <div className="p-6">
                                {/* Order Items */}
                                <h6 className="font-bold text-gray-700 dark:text-gray-300 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">Chi tiết món ăn</h6>
                                <div className="space-y-3 mb-6">
                                    {order.orderItems.map((item) => (
                                        <div key={item.orderItemId} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                            <img
                                                src={item.image}
                                                alt="Món ăn"
                                                className="w-20 h-20 object-cover rounded-xl border-2 border-white shadow-md shrink-0"
                                            />
                                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Đơn giá</span>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(item.price)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Số lượng</span>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{item.quantity}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Trạng thái</span>
                                                    <p>
                                                        <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${item.orderItemStatus === 'DONE' ? 'bg-primary/10 text-primary' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                            {item.orderItemStatus === 'DONE' ? 'Hoàn thành' : 'Đang xử lý'}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-gray-500">Thành tiền</span>
                                                    <p className="font-bold text-primary">{formatPrice(item.price * item.quantity)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Customer Info & Total */}
                                <div className="flex flex-col md:flex-row gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                                    <div className="flex-1">
                                        <h6 className="font-bold text-gray-700 dark:text-gray-300 mb-3">Thông tin khách hàng</h6>
                                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                            <div><strong className="text-gray-900 dark:text-gray-200">Họ tên:</strong> {order.customer.fullName}</div>
                                            <div><strong className="text-gray-900 dark:text-gray-200">Email:</strong> {order.customer.email}</div>
                                            <div><strong className="text-gray-900 dark:text-gray-200">SĐT:</strong> {order.customer.phone}</div>
                                            <div><strong className="text-gray-900 dark:text-gray-200">Địa chỉ:</strong> {order.deliveryAddress}</div>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow text-center md:text-right border border-gray-100 dark:border-gray-800 min-w-[160px]">
                                        <div className="text-sm text-gray-500 mb-1">Tổng tiền</div>
                                        <div className="text-2xl font-extrabold text-green-600">
                                            {formatPrice(getTotalAmount(order.orderItems))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Refresh Button */}
                {onlineOrders.length > 0 && (
                    <div className="text-center mt-8">
                        <button
                            onClick={() => fetchMyOnlineOrder(true)}
                            disabled={loading}
                            className="px-8 py-3 rounded-full font-bold text-primary border-2 border-primary hover:bg-primary hover:text-white transition disabled:opacity-70"
                        >
                            {loading ? 'Đang tải...' : '↻ Tải lại danh sách'}
                        </button>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default MyOnlineOrderPage;