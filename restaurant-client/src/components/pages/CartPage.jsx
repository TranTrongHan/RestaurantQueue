import React, { useContext, useEffect, useRef, useState } from "react";
import useCartStore from "../../store/useCartStore";
import { authApis, endpoints } from "../configs/Apis";
import { useCookies } from "react-cookie";
import { Link, useLocation } from "react-router-dom";
import SpinnerComp from "../common/SpinnerComp";
import { ShoppingCart, Trash2, ArrowLeft, CheckCircle, XCircle, Minus, Plus, ShoppingBag, Tag } from "lucide-react";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import toast from 'react-hot-toast';

const CartPage = () => {
    const { cart, addItem, removeItem: storeRemoveItem, clearCart: storeClearCart, updateItemId } = useCartStore();
    const [cookies] = useCookies(["token"]);
    const [loading, setLoading] = useState(false);
    // const [error, setError] = useState(null);
    const [discount, setDiscount] = useState("");
    const [discountError, setDiscountError] = useState(null);
    const [discountAmount] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [bill, setBill] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const hasCalled = useRef(false);
    const location = useLocation();

    const formatPrice = (price) =>
        price.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

    // --- Handlers ---
    const updateQuantity = async (itemId, delta) => {
        addItem({ menuItemId: itemId, quantity: delta });
        try {
            if (delta > 0) {
                const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['cart']}/add`;
                const res = await authApis(cookies.token).post(url, { items: [{ menuItemId: itemId, quantity: 1 }] });
                if (res.status === 200) {
                    res.data.results?.items?.forEach(item => {
                        if (item.menuItemId === itemId) {
                            updateItemId({ menuItemId: item.menuItemId, cartItemId: item.cartItemId });
                        }
                    });
                }
            } else {
                const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['cart']}/items/${itemId}`;
                await authApis(cookies.token).put(url);
            }
        } catch (err) {
            console.error("Update qty error:", err.message);
            toast.error("Lỗi cập nhật số lượng");
        }
    };

    const removeItem = async (item) => {
        storeRemoveItem(item.menuItemId);
        try {
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['cart']}/items/${item.cartItemId}`;
            await authApis(cookies.token).delete(url);
        } catch (err) {
            console.error("Remove item error:", err.message);
            toast.error("Lỗi xóa món ăn");
        }
    };

    const clearCart = async () => {
        storeClearCart();
        try {
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['cart']}/clear`;
            await authApis(cookies.token).delete(url);
        } catch (err) {
            console.error("Clear cart error:", err.message);
            toast.error("Lỗi xóa giỏ hàng");
        }
    };

    const handlePayment = async () => {
        try {
            setLoading(true);
            const returnUrl = window.location.href;
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['online_order']}/createPayment?returnUrl=${returnUrl}`;
            const res = await authApis(cookies.token).post(url);
            if (res.status === 200 && res.data.result) {
                window.location.href = res.data.result;
                clearCart();
            }
        } catch (err) {
            if (err.response) {
                if (Number(err.response.data.code) === 1030) {
                    // setError("Vui lòng cập nhật địa chỉ trước khi thanh toán");
                    toast.error("Vui lòng cập nhật địa chỉ trước khi thanh toán");
                } else {
                    // setError(err.response.data.message || "Có lỗi xảy ra");
                    toast.error(err.response.data.message || "Có lỗi xảy ra");
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVnPayReturn = async () => {
        const query = location.search;
        if (!query.includes("vnp_") || hasCalled.current) return;
        hasCalled.current = true;
        try {
            const res = await authApis(cookies.token).get(
                `${import.meta.env.VITE_API_BASE_URL}${endpoints['online_order']}/vnpayReturn${query}`
            );
            setPaymentStatus("success");
            setBill(res.data.result);
            setShowModal(true);
        } catch {
            setPaymentStatus("failed");
            setShowModal(true);
        }
    };

    useEffect(() => { handleVnPayReturn(); }, [location]);
    // useEffect(() => {
    //     if (error) { const t = setTimeout(() => setError(null), 3000); return () => clearTimeout(t); }
    // }, [error]);
    useEffect(() => {
        if (discountError) { const t = setTimeout(() => setDiscountError(null), 3000); return () => clearTimeout(t); }
    }, [discountError]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
                {/* Error Toast 
                {error && (
                    <div className="mb-6 flex items-center gap-3 bg-danger/10 border border-danger/30 text-danger px-5 py-4 rounded-2xl font-medium text-sm">
                        <XCircle size={18} className="shrink-0" />
                        {error}
                    </div>
                )}
                */}

                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                            <ShoppingCart size={26} className="text-primary" />
                            Giỏ hàng của bạn
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {cart.length} loại món · {totalQty} phần
                        </p>
                    </div>
                    <Link
                        to="/menu"
                        className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Tiếp tục mua
                    </Link>
                </div>

                {cart.length === 0 ? (
                    /* Empty Cart */
                    <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-3xl shadow-card border border-gray-100 dark:border-gray-800">
                        <ShoppingBag size={64} className="text-gray-200 dark:text-gray-700 mx-auto mb-5" />
                        <h3 className="text-xl font-bold text-gray-400 dark:text-gray-500 mb-2">Giỏ hàng của bạn đang trống</h3>
                        <p className="text-sm text-gray-400 mb-8">Hãy thêm một số món ăn ngon để bắt đầu!</p>
                        <Link
                            to="/menu"
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary hover:bg-primary-active text-white font-bold text-sm transition-all shadow-lg shadow-primary/20"
                        >
                            <ShoppingBag size={16} />
                            Xem thực đơn
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left: Cart Items */}
                        <div className="flex-1 bg-white dark:bg-gray-900 rounded-3xl shadow-card border border-gray-100 dark:border-gray-800 overflow-hidden">
                            {/* Header row */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                <h2 className="font-bold text-gray-900 dark:text-gray-100">Món đã chọn</h2>
                                <button
                                    onClick={clearCart}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-danger transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Xóa tất cả
                                </button>
                            </div>

                            {/* Item rows */}
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {cart.map((item) => (
                                    <div key={item.menuItemId} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                                        {/* Image */}
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                                        />

                                        {/* Name + Price */}
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-bold text-gray-900 dark:text-gray-100 truncate">{item.name}</h5>
                                            <p className="text-sm font-semibold text-primary">{formatPrice(item.price)}</p>
                                        </div>

                                        {/* Quantity Stepper */}
                                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1 shrink-0">
                                            <button
                                                onClick={() => updateQuantity(item.menuItemId, -1)}
                                                disabled={item.quantity <= 1}
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold transition-all bg-danger disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                                            >
                                                <Minus size={12} strokeWidth={3} />
                                            </button>
                                            <span className="w-6 text-center font-bold text-gray-900 dark:text-gray-100 text-sm">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.menuItemId, 1)}
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold transition-all bg-success"
                                            >
                                                <Plus size={12} strokeWidth={3} />
                                            </button>
                                        </div>

                                        {/* Subtotal + Remove */}
                                        <div className="text-right shrink-0 min-w-[90px]">
                                            <p className="font-extrabold text-gray-900 dark:text-gray-100 text-sm">
                                                {formatPrice(item.price * item.quantity)}
                                            </p>
                                            <button
                                                onClick={() => removeItem(item)}
                                                className="text-xs text-gray-400 hover:text-danger transition-colors mt-1 flex items-center gap-1 ml-auto"
                                            >
                                                <Trash2 size={11} /> Xóa
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Order Summary */}
                        <div className="lg:w-80 xl:w-96 shrink-0">
                            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-card border border-gray-100 dark:border-gray-800 p-6 sticky top-6">
                                <h4 className="font-extrabold text-gray-900 dark:text-gray-100 text-center mb-5">Tóm tắt đơn hàng</h4>

                                {/* Stats */}
                                <div className="space-y-2 pb-4 mb-4 border-b-2 border-dashed border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Số món:</span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{cart.length} món</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Tổng số lượng:</span>
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{totalQty} phần</span>
                                    </div>
                                </div>

                                {/* Discount Input */}
                                <div className="mb-4">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Tag size={12} /> Mã ưu đãi
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={discount}
                                            onChange={(e) => setDiscount(e.target.value)}
                                            name="discount"
                                            placeholder="Nhập mã giảm giá..."
                                            className="flex-1 px-3 py-2 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary transition"
                                        />
                                    </div>
                                    {discountError && (
                                        <p className="text-xs text-danger mt-1.5 font-medium">{discountError}</p>
                                    )}
                                </div>

                                {/* Total */}
                                <div className="flex items-center justify-between bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-2xl px-5 py-4 mb-5">
                                    <span className="font-bold text-gray-900 dark:text-gray-100">Tổng cộng:</span>
                                    <span className="text-xl font-extrabold text-primary">{formatPrice(total)}</span>
                                </div>

                                {/* CTA Buttons */}
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handlePayment}
                                        disabled={loading}
                                        className="w-full py-3.5 rounded-2xl font-bold text-white bg-success hover:bg-success-active transition-all shadow-lg shadow-success/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <SpinnerComp className="w-5 h-5 border-2" />
                                        ) : (
                                            <>
                                                <CheckCircle size={18} />
                                                Thanh toán ngay
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={clearCart}
                                        className="w-full py-3 rounded-2xl font-semibold text-sm text-danger border-2 border-danger/30 hover:bg-danger hover:text-white hover:border-danger transition-all"
                                    >
                                        Xóa toàn bộ giỏ hàng
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />

            {/* VNPay Return Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative z-10 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-8 border border-gray-100 dark:border-gray-800 text-center">
                        {paymentStatus === "success" ? (
                            <>
                                <CheckCircle size={64} className="text-success mx-auto mb-5 animate-bounce" />
                                <h2 className="text-2xl font-extrabold text-success mb-3">Thanh toán thành công!</h2>
                                <p className="text-sm text-gray-500 mb-6">
                                    Cảm ơn bạn đã thanh toán. Đơn hàng đã được xử lý thành công.
                                </p>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-full py-3 rounded-2xl font-bold text-white bg-success hover:bg-success-active transition shadow-lg shadow-success/20"
                                >
                                    Xác nhận
                                </button>
                            </>
                        ) : (
                            <>
                                <XCircle size={64} className="text-danger mx-auto mb-5" />
                                <h2 className="text-2xl font-extrabold text-danger mb-3">Thanh toán thất bại!</h2>
                                <p className="text-sm text-gray-500 mb-6">
                                    Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.
                                </p>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-full py-3 rounded-2xl font-bold text-white bg-danger hover:bg-danger-active transition shadow-lg shadow-danger/20"
                                >
                                    Đóng
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;