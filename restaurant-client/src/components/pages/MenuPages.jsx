import { useEffect, useState } from "react";
import Apis, { authApis, endpoints } from "../configs/Apis";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { useCookies } from "react-cookie";
import SpinnerComp from "../common/SpinnerComp";
import useUserStore from "../../store/useUserStore";
import useCartStore from "../../store/useCartStore";
import { Link } from "react-router-dom";
import { ShoppingCart, Plus, UtensilsCrossed } from "lucide-react";
import TableOrderingPage from "./TableOrderingPage";

// Synchronously parse and setup Table Mode if accessed via Table Mode setup link
const queryParams = new URLSearchParams(window.location.search);
const urlTableMode = queryParams.get("tableMode");
const urlTableId = queryParams.get("tableId");

if (urlTableMode === "true" && urlTableId) {
    localStorage.setItem("rq-table-mode", "true");
    localStorage.setItem("rq-table-id", urlTableId);
    window.history.replaceState({}, document.title, window.location.pathname);
}

const MenuPages = () => {
    const isTableMode = localStorage.getItem("rq-table-mode") === "true";
    const [cookies, setCookie] = useCookies(["token"]);
    const { setUser } = useUserStore();
    const [joiningSession, setJoiningSession] = useState(false);

    const queryParams = new URLSearchParams(window.location.search);
    const urlToken = queryParams.get("token");

    useEffect(() => {
        if (!urlToken) return;

        const joinTableSession = async () => {
            try {
                setJoiningSession(true);
                const resJoin = await Apis.get(`/order_session/join?token=${urlToken}`);
                if (resJoin.status === 200) {
                    const data = resJoin.data.result;
                    const jwt = data.reservationResponse?.customerJwt || data.customerJwt;
                    const sId = data.reservationResponse?.sessionId || data.sessionId;
                    const reservationId = data.reservationResponse?.reservationId;
                    const sToken = urlToken;

                    setCookie("token", jwt, { path: "/" });
                    localStorage.setItem("rq-table-mode", "true");
                    localStorage.setItem("rq-table-id", String(data.reservationResponse?.tableResponse?.tableId || ""));
                    localStorage.setItem("rq-active-reservation-id", String(reservationId));
                    localStorage.setItem("rq-active-session-id", String(sId));
                    localStorage.setItem("rq-active-session-token", sToken);
                    localStorage.setItem("rq-active-table-name", data.reservationResponse?.tableResponse?.tableName || `Bàn`);

                    // Fetch shadow profile
                    const resProfile = await axios.create({
                        baseURL: import.meta.env.VITE_API_BASE_URL,
                        headers: { Authorization: `Bearer ${jwt}` }
                    }).get(endpoints.profile);

                    if (resProfile.status === 200) {
                        setUser(resProfile.data.result);
                    }

                    window.history.replaceState({}, document.title, window.location.pathname);
                    window.location.reload();
                }
            } catch (err) {
                console.error("BYOD Join Error:", err);
            } finally {
                setJoiningSession(false);
            }
        };

        joinTableSession();
    }, [urlToken]);

    if (joiningSession) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#090d16] text-white">
                <SpinnerComp className="w-12 h-12 border-blue-600 border-t-transparent" />
                <p className="mt-4 text-slate-450 font-semibold animate-pulse">
                    Đang kết nối bàn ăn tự động...
                </p>
            </div>
        );
    }

    if (isTableMode) {
        return <TableOrderingPage />;
    }

    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cateId, setCateId] = useState(null);
    const { user } = useUserStore();
    const { cart, addItem, updateItemId } = useCartStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const formatPrice = (price) =>
        price.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    const fetchMenuItems = async (categoryId) => {
        if (!categoryId) return;
        try {
            const url = `${endpoints['menu_items']}?cateId=${categoryId}`;
            const res = await Apis.get(url);
            if (res.data.code === 200) setMenuItems(res.data.result);
        } catch (error) {
            console.error("Error fetching menu items:", error.message);
        }
    };

    const fetchCategories = async () => {
        try {
            const url = `${endpoints['categories']}`;
            const res = await Apis.get(url);
            if (res.data.code === 200) {
                const cats = res.data.result;
                setCategories(cats);
                if (cats.length > 0) setCateId(cats[0].categoryId);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => { fetchCategories(); }, []);
    useEffect(() => { if (cateId !== null) fetchMenuItems(cateId); }, [cateId]);

    const handleAddFoodToCart = async (item) => {
        if (!user) { setShowLoginModal(true); return; }

        addItem({ name: item.name, menuItemId: item.menuItemId, quantity: 1, price: item.price, image: item.image });

        try {
            setLoading(true);
            const payload = { items: [{ menuItemId: item.menuItemId, quantity: 1 }] };
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['cart']}/add`;
            let res = await authApis(cookies.token).post(url, payload);
            if (res.status === 200) {
                res.data.result.items?.forEach(cartItem => {
                    if (cartItem.menuItemId === item.menuItemId) {
                        updateItemId({ menuItemId: cartItem.menuItemId, cartItemId: cartItem.cartItemId });
                    }
                });
            }
        } catch (error) {
            setError("Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    const cartTotal = cart.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-950">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
                {/* Category & Cart Bar */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card border border-gray-200 dark:border-gray-800 p-5 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                            <h5 className="text-sm font-bold text-primary uppercase tracking-wider mb-3">
                                Danh mục món ăn
                            </h5>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(category => (
                                    <button
                                        key={category.categoryId}
                                        onClick={() => {
                                            setCateId(category.categoryId);
                                            fetchMenuItems(category.categoryId);
                                        }}
                                        className={`px-5 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-200 ${cateId === category.categoryId
                                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30 -translate-y-0.5'
                                            : 'border-primary text-primary bg-transparent hover:bg-primary/10'
                                            }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {user?.role === "CUSTOMER" && (
                            <Link
                                to="/cart"
                                className="relative flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary text-primary font-bold text-sm bg-transparent hover:bg-primary hover:text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 shrink-0"
                            >
                                <ShoppingCart size={18} />
                                <span>Giỏ hàng</span>
                                {cartTotal > 0 && (
                                    <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] bg-danger text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-md px-1">
                                        {cartTotal > 99 ? '99+' : cartTotal}
                                    </span>
                                )}
                            </Link>
                        )}
                    </div>
                </div>

                {/* Menu Items Grid */}
                {menuItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {menuItems.map(item => (
                            <div
                                key={item.menuItemId}
                                className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-card border border-gray-100 dark:border-gray-800 flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/15"
                            >
                                {/* Food Image */}
                                <div className="relative overflow-hidden h-52 shrink-0">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {/* Gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>

                                {/* Card Body */}
                                <div className="flex flex-col flex-1 p-5">
                                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 text-center mb-3 leading-snug line-clamp-2">
                                        {item.name}
                                    </h3>

                                    <div className="text-center mb-4">
                                        <span className="inline-block text-gray-500 font-extrabold text-lg border-2 border-primary/20 bg-primary/5 px-4 py-1 rounded-full">
                                            {formatPrice(item.price)}
                                        </span>
                                    </div>

                                    {(user === null || user.role === "CUSTOMER") && (
                                        <button
                                            onClick={() => handleAddFoodToCart(item)}
                                            disabled={loading}
                                            className="mt-auto w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary-active transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {loading ? (
                                                <SpinnerComp className="w-4 h-4 border-2" />
                                            ) : (
                                                <>
                                                    <Plus size={16} strokeWidth={2.5} />
                                                    Thêm vào giỏ
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-card">
                        <UtensilsCrossed size={56} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500 mb-2">
                            Không có món ăn trong danh mục này
                        </h3>
                        <p className="text-sm text-gray-400">
                            Hãy thử chọn danh mục khác để xem thêm món ăn ngon!
                        </p>
                    </div>
                )}
            </main>

            <Footer />

            {/* Login Required Modal */}
            {/* {showLoginModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowLoginModal(false)}
                    />
                    <div className="relative z-10 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm mx-4 p-8 border border-gray-100 dark:border-gray-800">
                        <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-3">
                            🔒 Yêu cầu đăng nhập
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            Vui lòng{" "}
                            <Link
                                to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                                className="font-bold text-primary hover:text-primary-active transition-colors underline"
                            >
                                đăng nhập
                            </Link>
                            {" "}để thực hiện đặt món.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                            >
                                Đóng
                            </button>
                            <Link
                                to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
                                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-active transition shadow-lg shadow-brand/20"
                            >
                                Đăng nhập ngay
                            </Link>
                        </div>
                    </div>
                </div>
            )} */}
        </div>
    );
};

export default MenuPages;