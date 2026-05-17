import React, { useState, useEffect, useCallback, useRef } from "react";
import { useCookies } from "react-cookie";
import {
    ShoppingBag,
    Clock,
    Receipt,
    Plus,
    Minus,
    Trash2,
    UtensilsCrossed,
    Info,
    CheckCircle2,
    AlertCircle,
    X,
    User,
    Search,
    Flame,
    Soup,
    Coffee,
    IceCream,
    Beef,
    Fish,
    Utensils,
    Sparkles,
    MessageSquare,
    Bot
} from "lucide-react";
import toast from "react-hot-toast";
import { db } from "../../firebase";
import { collection, onSnapshot, query, where, doc } from "firebase/firestore";
import axios from "axios";
import SpinnerComp from "../common/SpinnerComp";
import FloatingChatButton from "../common/FloatingChatButton";
import ChatbotDrawer from "../common/ChatbotDrawer";
import useUserStore from "../../store/useUserStore";
import useCartStore from "../../store/useCartStore";
import Apis, { authApis, endpoints } from "../configs/Apis";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TableOrderingPage = () => {
    const tableId = localStorage.getItem("rq-table-id") || "5"; // Fallback to Table 5
    const [cookies, setCookie, removeCookie] = useCookies(["token"]);
    const { user, setUser, logout } = useUserStore();
    const { setCart: setGlobalCart } = useCartStore();

    // Session States
    const [token, setToken] = useState(
        cookies.token && cookies.token !== "undefined" && cookies.token !== "null" ? cookies.token : null
    );
    const tokenRef = useRef(token);
    tokenRef.current = token;

    const [sessionId, setSessionId] = useState(localStorage.getItem("rq-active-session-id") || null);
    const [sessionToken, setSessionToken] = useState(localStorage.getItem("rq-active-session-token") || null);
    const [sessionInfo, setSessionInfo] = useState(null);

    // UI States
    const [loadingSession, setLoadingSession] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const [activeTab, setActiveTab] = useState("menu"); // menu, tracking, bill
    const [showCart, setShowCart] = useState(false);

    // Data States
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [reservationRealtime, setReservationRealtime] = useState(null);
    const [orderItemsRealtime, setOrderItemsRealtime] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Chatbot States
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [isTypingChat, setIsTypingChat] = useState(false);
    const [chatInputValue, setChatInputValue] = useState("");

    const hasLoadedDocRef = useRef(false);

    // 1. Firestore Listener to detect Table Session activation and checkout
    useEffect(() => {
        if (!tableId) return;

        const q = query(
            collection(db, "activeReservations"),
            where("tableId", "==", parseInt(tableId))
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            if (!snapshot.empty) {
                // Table is OCCUPIED
                const activeRes = snapshot.docs[0].data();
                const reservationId = activeRes.reservationId;

                const currentResId = localStorage.getItem("rq-active-reservation-id");
                const hasValidToken = tokenRef.current && tokenRef.current !== "undefined" && tokenRef.current !== "null";
                if (!hasValidToken || currentResId !== String(reservationId)) {
                    try {
                        setLoadingSession(true);
                        // Fetch active session
                        const resSession = await axios.get(`${BASE_URL}/order_session/active-session?tableId=${tableId}`);
                        if (resSession.status === 200 && resSession.data.result?.valid) {
                            const { sessionToken: sToken } = resSession.data.result.reservationResponse;

                            // Exchange for customerJwt
                            const resJoin = await axios.get(`${BASE_URL}/order_session/join?token=${sToken}`);
                            if (resJoin.status === 200) {
                                const data = resJoin.data.result;
                                const jwt = data.reservationResponse?.customerJwt || data.customerJwt;
                                const sId = data.reservationResponse?.sessionId || data.sessionId;

                                setCookie("token", jwt, { path: "/" });
                                setToken(jwt);
                                setSessionId(sId);
                                setSessionToken(sToken);

                                // Fetch shadow profile
                                const resProfile = await axios.create({
                                    baseURL: BASE_URL,
                                    headers: { Authorization: `Bearer ${jwt}` }
                                }).get(endpoints.profile);

                                if (resProfile.status === 200) {
                                    setUser(resProfile.data.result);
                                }

                                localStorage.setItem("rq-active-reservation-id", String(reservationId));
                                localStorage.setItem("rq-active-session-id", String(sId));
                                localStorage.setItem("rq-active-session-token", sToken);
                                localStorage.setItem("rq-active-table-name", data.reservationResponse?.tableResponse?.tableName || `Bàn ${tableId}`);

                                hasLoadedDocRef.current = false;
                                toast.success("Bàn ăn đã được kích hoạt thành công!");
                            }
                        }
                    } catch (err) {
                        console.error("Auto-activation error:", err);
                        toast.error("Không thể kết nối bàn ăn tự động.");
                    } finally {
                        setLoadingSession(false);
                    }
                }
            } else {
                // Table is AVAILABLE (checked out / empty)
                if (cookies.token || localStorage.getItem("rq-active-reservation-id")) {
                    removeCookie("token", { path: "/" });
                    logout();
                    setToken(null);
                    setSessionId(null);
                    setSessionToken(null);
                    setSessionInfo(null);
                    setReservationRealtime(null);
                    setOrderItemsRealtime([]);
                    setCart([]);
                    setGlobalCart([]);

                    localStorage.removeItem("rq-active-reservation-id");
                    localStorage.removeItem("rq-active-session-id");
                    localStorage.removeItem("rq-active-session-token");
                    localStorage.removeItem("rq-active-table-name");

                    hasLoadedDocRef.current = false;
                    toast.success("Bàn ăn đã được đóng và reset.");
                }
            }
        });

        return () => unsubscribe();
    }, [tableId]);

    // 2. Fetch Categories and Active Session info
    const fetchData = useCallback(async () => {
        if (!token || !sessionToken) {
            setInitialLoading(false);
            return;
        }
        try {
            setInitialLoading(true);
            setLoading(true);
            const sessionRes = await axios.get(`${BASE_URL}/order_session/validate?token=${sessionToken}`);
            if (sessionRes.status === 200) {
                setSessionInfo(sessionRes.data.result.reservationResponse);
            }

            const cateRes = await axios.get(`${BASE_URL}/categories`);
            if (cateRes.status === 200) {
                setCategories(cateRes.data.result);
                if (cateRes.data.result.length > 0) setActiveCategory(cateRes.data.result[0].categoryId);
            }
        } catch (err) {
            console.error("Fetch data error:", err);
            toast.error("Không thể tải thông tin thực đơn");
        } finally {
            setLoading(false);
            setInitialLoading(false);
        }
    }, [token, sessionToken]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // 3. Fetch Menu Items by Category
    const fetchItems = useCallback(async () => {
        if (!activeCategory) return;
        try {
            const res = await axios.get(`${BASE_URL}/menu_items?cateId=${activeCategory}`);
            if (res.status === 200) setMenuItems(res.data.result);
        } catch (err) {
            toast.error("Lỗi tải món ăn");
        }
    }, [activeCategory]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    // 4. Firestore Real-time listener for current Reservation and Placed Items
    useEffect(() => {
        const idToUse = sessionInfo?.reservationId || localStorage.getItem("rq-active-reservation-id");
        if (!idToUse) return;

        const resRef = doc(db, "activeReservations", idToUse.toString());
        const unsubRes = onSnapshot(resRef, (docSnap) => {
            if (docSnap.exists()) {
                hasLoadedDocRef.current = true;
                setReservationRealtime(docSnap.data());
            } else {
                if (hasLoadedDocRef.current) {
                    setReservationRealtime({ status: "FINISHED_AND_CLOSED" });
                    toast.success("Cảm ơn quý khách! Hóa đơn đã được thanh toán.", { duration: 5000 });
                } else {
                    setReservationRealtime({ status: "WAITING_FOR_DOC" });
                }
            }
        });

        const itemsRef = collection(db, "activeReservations", idToUse.toString(), "orderItems");
        const q = query(itemsRef);

        const unsubItems = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            items.sort((a, b) => (a.orderedAt?.seconds || 0) - (b.orderedAt?.seconds || 0));
            setOrderItemsRealtime(items);
        });

        return () => {
            unsubRes();
            unsubItems();
        };
    }, [sessionId, sessionInfo?.reservationId]);

    // 5. Search with Debounce
    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (searchTerm.trim().length > 0) {
                try {
                    setIsSearching(true);
                    const res = await axios.get(`${BASE_URL}/menu_items/search?q=${searchTerm}`);
                    if (res.status === 200) setSearchResults(res.data.result);
                } catch (err) {
                    console.error("Search error:", err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delaySearch);
    }, [searchTerm]);

    // Cart Logic
    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(i => i.menuItemId === item.menuItemId);
            if (existing) {
                return prev.map(i => i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
        toast.success(`Đã thêm ${item.name}`);
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(i => {
            if (i.menuItemId === id) {
                const newQty = Math.max(0, i.quantity + delta);
                return { ...i, quantity: newQty };
            }
            return i;
        }).filter(i => i.quantity > 0));
    };

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const placeOrder = async () => {
        if (cart.length === 0) return;
        if (reservationRealtime?.paymentStatus === "REQUESTED" || reservationRealtime?.status === "REQUEST_PAYMENT") {
            toast.error("Bàn đã bị khóa do đang yêu cầu thanh toán!");
            return;
        }
        try {
            setLoading(true);
            const items = cart.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity }));
            const res = await axios.create({
                baseURL: BASE_URL,
                headers: { Authorization: `Bearer ${token}` }
            }).post(`${BASE_URL}/order_item/${sessionId}`, {
                menuItemRequestList: items
            });
            if (res.status === 200) {
                toast.success("Đặt món thành công!");
                setCart([]);
                setShowCart(false);
                setActiveTab("tracking");
            }
        } catch (err) {
            if (err.response?.data?.code === 3005) {
                toast.error("Bàn đã bị khóa do đang yêu cầu thanh toán!");
            } else {
                toast.error(err.response?.data?.message || "Lỗi khi đặt món");
            }
        } finally {
            setLoading(false);
        }
    };

    const requestPayment = async () => {
        const hasUnfinished = orderItemsRealtime.some(item => {
            return item.status === "PENDING" || item.status === "COOKING";
        });

        if (hasUnfinished) {
            toast.error("Vui lòng đợi nhà bếp hoàn tất các món (Đang chờ/Đang chế biến) trước khi yêu cầu thanh toán");
            return;
        }

        setShowConfirmModal(true);
    };

    const handleConfirmPayment = async () => {
        try {
            setLoading(true);
            setShowConfirmModal(false);
            const res = await axios.create({
                baseURL: BASE_URL,
                headers: { Authorization: `Bearer ${token}` }
            }).post(`${BASE_URL}/order_session/request-payment/${sessionId}`);
            if (res.status === 200) {
                toast.success("Yêu cầu thanh toán đã được gửi!");
                setActiveTab("bill");
            }
        } catch (err) {
            console.error("Payment Request Error:", err);
            toast.error(err.response?.data?.message || "Lỗi yêu cầu thanh toán");
        } finally {
            setLoading(false);
        }
    };

    // Chatbot Logic
    const handleSendChatMessage = async (text) => {
        if (!text.trim()) return;

        const userMessage = { role: "user", content: text };
        setChatMessages(prev => [...prev, userMessage]);
        setChatInputValue("");
        setIsTypingChat(true);

        try {
            const res = await axios.post(`${BASE_URL}/chat`, {
                userMessage: text,
                sessionToken: sessionToken
            });

            if (res.status === 200) {
                const botMessage = { role: "bot", content: res.data.aiMessage };
                setChatMessages(prev => [...prev, botMessage]);
            }
        } catch (err) {
            console.error("Chat error:", err);
            setChatMessages(prev => [...prev, {
                role: "bot",
                content: "Xin lỗi, tôi đang gặp chút sự cố kết nối. Vui lòng thử lại sau nhé!"
            }]);
        } finally {
            setIsTypingChat(false);
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

    const getCategoryIcon = (name) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes("lẩu")) return <Soup size={20} />;
        if (lowerName.includes("nướng") || lowerName.includes("heo") || lowerName.includes("bò")) return <Beef size={20} />;
        if (lowerName.includes("hải sản")) return <Fish size={20} />;
        if (lowerName.includes("uống") || lowerName.includes("nước")) return <Coffee size={20} />;
        if (lowerName.includes("tráng miệng")) return <IceCream size={20} />;
        return <Utensils size={20} />;
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case "PENDING":
                return {
                    label: "Đang chờ",
                    icon: <Clock size={16} />,
                    color: "bg-amber-100 text-amber-600 border-amber-200",
                    step: 1,
                    progressColor: "bg-amber-500"
                };
            case "COOKING":
                return {
                    label: "Đang chế biến",
                    icon: <Flame size={16} />,
                    color: "bg-blue-100 text-blue-600 border-blue-200",
                    step: 2,
                    progressColor: "bg-blue-500"
                };
            case "READY":
                return {
                    label: "Sẵn sàng",
                    icon: <Soup size={16} />,
                    color: "bg-cyan-100 text-cyan-600 border-cyan-200",
                    step: 3,
                    progressColor: "bg-cyan-500"
                };
            case "SERVED":
            case "DONE":
                return {
                    label: "Đã xong",
                    icon: <CheckCircle2 size={18} />,
                    color: "bg-green-600 text-white border-green-700",
                    step: 4,
                    progressColor: "bg-green-500",
                    isProminent: true
                };
            case "CANCELLED":
                return {
                    label: "Đã hủy",
                    icon: <X size={16} />,
                    color: "bg-red-100 text-red-600 border-red-200",
                    step: 0,
                    progressColor: "bg-red-500"
                };
            default:
                return {
                    label: status,
                    icon: <Info size={16} />,
                    color: "bg-slate-100 text-slate-600 border-slate-200",
                    step: 0,
                    progressColor: "bg-slate-500"
                };
        }
    };

    // 6. Welcome Standby Screen when table is not active
    if (!token || !sessionId) {
        return (
            <div className="h-screen w-full bg-[#090d16] flex flex-col items-center justify-center text-white relative overflow-hidden select-none">
                {/* Glowing decorative background bubbles */}
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse [animation-delay:2s]"></div>

                <div className="z-10 flex flex-col items-center max-w-2xl px-6 text-center space-y-8 animate-in fade-in zoom-in duration-1000">
                    {/* Glowing Logo Circle */}
                    <div className="relative w-28 h-28 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.3)] ring-4 ring-white/10 animate-bounce-slow">
                        <UtensilsCrossed size={52} className="text-white" strokeWidth={1.5} />
                        <div className="absolute -top-1 -right-1 bg-amber-400 p-2 rounded-full shadow-md">
                            <Sparkles size={14} className="text-slate-900" fill="currentColor" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                            Restaurant<span className="text-blue-500">App</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-300 font-semibold max-w-lg mx-auto">
                            Xin kính chào quý khách!
                        </p>
                        <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-md mx-auto">
                            Vui lòng đợi nhân viên phục vụ mở bàn để bắt đầu khám phá thực đơn gọi món trực tiếp.
                        </p>
                    </div>

                    {/* Animated Pulsing Loader */}
                    <div className="flex flex-col items-center space-y-3">
                        <div className="flex gap-2">
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                        </div>
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Chờ kích hoạt</span>
                    </div>

                    {/* Floating Tablet Info Badge */}
                    <div className="pt-8 border-t border-white/5 w-full flex justify-center">
                        <span className="px-5 py-2.5 bg-slate-900/60 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 shadow-xl backdrop-blur-md">
                            📍 Máy tính bảng cố định tại Bàn {tableId}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    if (loadingSession || initialLoading || !reservationRealtime || reservationRealtime.status === "WAITING_FOR_DOC") {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
                <SpinnerComp className="w-12 h-12 border-blue-600 border-t-transparent" />
                <p className="mt-4 text-slate-500 font-medium animate-pulse">
                    {loadingSession ? "Đang kết nối bàn ăn tự động..." : initialLoading ? "Đang tải dữ liệu từ máy chủ..." : "Đang đồng bộ trạng thái thực tế..."}
                </p>
            </div>
        );
    }

    const showTrackingAlert = orderItemsRealtime.some(item => item.status === "READY");
    const activeTableName = localStorage.getItem("rq-active-table-name") || `Bàn ${tableId}`;

    return (
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden select-none relative">
            {/* Lock UI Overlay when Payment Requested */}
            {(reservationRealtime?.paymentStatus === "REQUESTED" || reservationRealtime?.status === "REQUEST_PAYMENT") && (
                <div className="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex flex-col items-center justify-center text-center p-10 animate-in fade-in duration-500">
                    <div className="w-32 h-32 bg-white rounded-[48px] flex items-center justify-center mb-8 rotate-3 shadow-2xl animate-bounce-slow">
                        <Receipt size={64} className="text-blue-600" />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight mb-4">Đang Chờ Thanh Toán</h2>
                    <p className="text-slate-300 text-lg max-w-md leading-relaxed font-medium">
                        Yêu cầu thanh toán của bạn đã được gửi. Vui lòng đợi nhân viên phục vụ đến bàn để hoàn tất thủ tục.
                    </p>
                    <div className="mt-12 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-3 px-6 py-3 bg-white/10 rounded-2xl border border-white/10 text-white font-bold">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                            Nhân viên phục vụ đang mang hóa đơn đến...
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                        <UtensilsCrossed size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">E-Menu Tablet</h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Đặt món thông minh tại bàn</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-black rounded-xl shadow-sm flex items-center gap-2">
                        📍 {activeTableName}
                    </span>

                    <button
                        onClick={() => setShowCart(true)}
                        className="relative w-12 h-12 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-700 transition-all active:scale-95 border border-slate-200"
                    >
                        <ShoppingBag size={20} />
                        {cart.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-600 text-white text-[11px] font-black rounded-full flex items-center justify-center ring-2 ring-white animate-bounce-slow">
                                {cart.reduce((sum, i) => sum + i.quantity, 0)}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            {/* Main Area */}
            <main className="flex-1 min-h-0 flex flex-col md:flex-row">
                {activeTab === "menu" && (
                    <>
                        {/* Sidebar Categories */}
                        <div className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-row md:flex-col overflow-x-auto md:overflow-y-auto shrink-0 scrollbar-hide md:p-4 gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.categoryId}
                                    onClick={() => setActiveCategory(cat.categoryId)}
                                    className={`px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center gap-3 shrink-0 md:w-full
                                        ${activeCategory === cat.categoryId
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                                >
                                    {getCategoryIcon(cat.name)}
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* Menu Grid */}
                        <div className="flex-1 min-h-0 flex flex-col p-6 overflow-y-auto scrollbar-thin">
                            {/* Search bar */}
                            <div className="relative group max-w-md mb-6 shrink-0">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Tìm món ăn nhanh..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400 font-semibold"
                                />
                            </div>

                            {isSearching ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <SpinnerComp className="w-8 h-8 border-blue-600 border-t-transparent" />
                                </div>
                            ) : searchTerm.trim().length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {searchResults.map((item) => (
                                        <div key={item.menuItemId} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                            <div className="h-44 relative overflow-hidden">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                            <div className="p-4 flex flex-col flex-1">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h3 className="font-bold text-slate-800 line-clamp-2 text-sm">{item.name}</h3>
                                                    <span className="text-blue-600 font-black text-sm shrink-0">{formatPrice(item.price)}</span>
                                                </div>
                                                <button
                                                    onClick={() => addToCart(item)}
                                                    className="w-full mt-auto py-2.5 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                                >
                                                    <Plus size={14} /> Thêm vào giỏ
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {menuItems.map((item) => (
                                        <div key={item.menuItemId} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                            <div className="h-44 relative overflow-hidden">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                            <div className="p-4 flex flex-col flex-1">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h3 className="font-bold text-slate-800 line-clamp-2 text-sm">{item.name}</h3>
                                                    <span className="text-blue-600 font-black text-sm shrink-0">{formatPrice(item.price)}</span>
                                                </div>
                                                <button
                                                    onClick={() => addToCart(item)}
                                                    className="w-full mt-auto py-2.5 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                                >
                                                    <Plus size={14} /> Thêm vào giỏ
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === "tracking" && (
                    <div className="flex-1 min-h-0 overflow-y-auto p-6 scrollbar-thin">
                        <div className="max-w-3xl mx-auto space-y-6">
                            <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Clock size={20} className="text-blue-600" /> Trạng thái làm món của bếp
                                </h2>
                                {orderItemsRealtime.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400 font-medium">Bàn chưa đặt món ăn nào. Vui lòng đặt món!</div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {orderItemsRealtime.map((item) => {
                                            const cfg = getStatusConfig(item.status);
                                            return (
                                                <div key={item.orderItemId} className="py-5 flex items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-slate-800">{item.name}</h4>
                                                        <p className="text-xs text-slate-500 mt-1">Số lượng: {item.quantity} | Giá: {formatPrice(item.price)}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${cfg.color}`}>
                                                            {cfg.icon} {cfg.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "bill" && (
                    <div className="flex-1 min-h-0 overflow-y-auto p-6 scrollbar-thin">
                        <div className="max-w-2xl mx-auto p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Receipt size={20} className="text-blue-600" /> Hóa đơn tạm tính
                            </h2>
                            {orderItemsRealtime.length === 0 ? (
                                <div className="py-12 text-center text-slate-400 font-medium">Chưa có món ăn nào được đặt để xuất hóa đơn.</div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="divide-y divide-slate-100">
                                        {orderItemsRealtime.map((item) => (
                                            <div key={item.orderItemId} className="py-4 flex justify-between gap-4">
                                                <div>
                                                    <span className="font-bold text-slate-800">{item.name}</span>
                                                    <span className="text-xs text-slate-500 block mt-1">Số lượng: {item.quantity} x {formatPrice(item.price)}</span>
                                                </div>
                                                <span className="font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t border-slate-200 pt-6 flex justify-between items-center">
                                        <span className="text-base font-bold text-slate-800">Tổng cộng</span>
                                        <span className="text-2xl font-black text-blue-600">
                                            {formatPrice(orderItemsRealtime.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                                        </span>
                                    </div>

                                    {(reservationRealtime?.status === "REQUEST_PAYMENT" || reservationRealtime?.paymentStatus === "REQUESTED") ? (
                                        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-2xl text-center animate-pulse">
                                            Đã gửi yêu cầu thanh toán. Thu ngân đang xử lý!
                                        </div>
                                    ) : (
                                        <button
                                            onClick={requestPayment}
                                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all"
                                        >
                                            Yêu cầu thanh toán
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <footer className="bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-around shadow-sm shrink-0">
                <button
                    onClick={() => setActiveTab("menu")}
                    className={`flex flex-col items-center gap-1 py-1.5 px-6 rounded-2xl transition-all duration-200 ${activeTab === "menu" ? "text-blue-600 bg-blue-50 font-bold" : "text-slate-500 hover:text-slate-800"}`}
                >
                    <Utensils size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Thực đơn</span>
                </button>

                <button
                    onClick={() => setActiveTab("tracking")}
                    className={`relative flex flex-col items-center gap-1 py-1.5 px-6 rounded-2xl transition-all duration-200 ${activeTab === "tracking" ? "text-blue-600 bg-blue-50 font-bold" : "text-slate-500 hover:text-slate-800"}`}
                >
                    <Clock size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Theo dõi món</span>
                    {showTrackingAlert && (
                        <span className="absolute top-1.5 right-6 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab("bill")}
                    className={`flex flex-col items-center gap-1 py-1.5 px-6 rounded-2xl transition-all duration-200 ${activeTab === "bill" ? "text-blue-600 bg-blue-50 font-bold" : "text-slate-500 hover:text-slate-800"}`}
                >
                    <Receipt size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Hóa đơn</span>
                </button>
            </footer>

            {/* Shopping Cart Drawer Modal */}
            {showCart && (
                <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCart(false)}></div>
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                        <header className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h3 className="text-lg font-black text-slate-900">Giỏ hàng món chọn</h3>
                            <button onClick={() => setShowCart(false)} className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center text-slate-500 transition-all"><X size={20} /></button>
                        </header>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm font-semibold">Chưa chọn món nào.</div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.menuItemId} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                                            <span className="text-xs text-blue-600 font-bold mt-1 block">{formatPrice(item.price)}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <button onClick={() => updateQuantity(item.menuItemId, -1)} className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all"><Minus size={14} /></button>
                                            <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.menuItemId, 1)} className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center hover:bg-slate-100 active:scale-90 transition-all"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {cart.length > 0 && (
                            <footer className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-600">Tổng tạm tính</span>
                                    <span className="text-xl font-black text-blue-600">{formatPrice(totalAmount)}</span>
                                </div>
                                <button
                                    onClick={placeOrder}
                                    disabled={loading}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all"
                                >
                                    Xác nhận gửi đặt món
                                </button>
                            </footer>
                        )}
                    </div>
                </div>
            )}

            {/* AI Chatbot Drawer & Toggle */}
            <FloatingChatButton onClick={() => setIsChatOpen(true)} isOpen={isChatOpen} />
            <ChatbotDrawer
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={chatMessages}
                onSendMessage={handleSendChatMessage}
                isTyping={isTypingChat}
                inputValue={chatInputValue}
                onInputChange={setChatInputValue}
            />

            {/* Confirm Payment Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
                    <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 flex flex-col items-center text-center space-y-5 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                            <AlertCircle size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Xác nhận yêu cầu thanh toán?</h3>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Sau khi gửi yêu cầu, bàn của quý khách sẽ tạm khóa và phục vụ sẽ mang hóa đơn tới bàn của bạn ngay.</p>
                        </div>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all">Hủy</button>
                            <button onClick={handleConfirmPayment} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/10">Xác nhận</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableOrderingPage;
