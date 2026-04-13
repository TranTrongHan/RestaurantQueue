import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    ShoppingBag,
    Clock,
    Receipt,
    ChevronRight,
    Plus,
    Minus,
    Trash2,
    UtensilsCrossed,
    Info,
    CheckCircle2,
    AlertCircle,
    X,
    User,
    Hash,
    Search,
    Flame,
    Soup,
    Coffee,
    IceCream,
    Beef,
    Fish,
    Utensils
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "../components/common/ConfirmModal";
import { db } from "../configs/firebase";
import { collection, onSnapshot, query, where, doc } from "firebase/firestore";
import axios from "axios";
import SpinnerComp from "../components/common/SpinnerComp";
import FloatingChatButton from "../components/common/FloatingChatButton";
import ChatbotDrawer from "../components/common/ChatbotDrawer";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// API Helpers for Customer (using the provided customerJwt)
const customerApis = (token) => axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` }
});

const CustomerOrderingPage = () => {
    const location = useLocation();
    const nav = useNavigate();
    const params = new URLSearchParams(location.search);

    // Auth State
    const [token, setToken] = useState(params.get("token") || sessionStorage.getItem("customerJwt"));
    const [sessionId] = useState(params.get("sessionId"));
    const [sessionToken] = useState(params.get("sessionToken"));

    // UI State
    const [loading, setLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [activeCategory, setActiveCategory] = useState(null);
    const [activeTab, setActiveTab] = useState("menu"); // menu, tracking, bill
    const [showCart, setShowCart] = useState(false);

    // Data State
    const [categories, setCategories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [reservationRealtime, setReservationRealtime] = useState(null); // Real-time reservation data
    const [orderItemsRealtime, setOrderItemsRealtime] = useState([]); // Real-time order items from Firebase
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Chatbot State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [isTypingChat, setIsTypingChat] = useState(false);
    const [chatInputValue, setChatInputValue] = useState("");

    // Initialize & Persist Token
    useEffect(() => {
        const urlToken = params.get("token");
        if (urlToken) {
            sessionStorage.setItem("customerJwt", urlToken);
            setToken(urlToken);
        }
    }, [params]);

    // Fetch Initial Session & Categories
    const fetchData = useCallback(async () => {
        if (!token || !sessionToken) return;
        try {
            setLoading(true);
            // 1. Validate Session & Get Info
            const sessionRes = await axios.get(`${BASE_URL}/order_session/validate?token=${sessionToken}`);
            if (sessionRes.status === 200) {
                setSessionInfo(sessionRes.data.result.reservationResponse);
            }

            // 2. Fetch Categories
            const cateRes = await axios.get(`${BASE_URL}/categories`);
            if (cateRes.status === 200) {
                setCategories(cateRes.data.result);
                if (cateRes.data.result.length > 0) setActiveCategory(cateRes.data.result[0].categoryId);
            }
        } catch (err) {
            console.error("Fetch initial data error:", err);
            toast.error("Không thể tải thông tin thực đơn");
        } finally {
            setLoading(false);
        }
    }, [token, sessionToken]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Fetch Menu Items when Category changes
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

    // Handle Search with Debounce
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

    const hasLoadedDocRef = useRef(false);

    // Firebase Real-time Tracking
    useEffect(() => {
        const idToUse = sessionInfo?.reservationId || sessionId;
        if (!idToUse) return;

        // 1. Listen to the parent reservation document
        const resRef = doc(db, "activeReservations", idToUse.toString());
        const unsubRes = onSnapshot(resRef, (docSnap) => {
            if (docSnap.exists()) {
                hasLoadedDocRef.current = true;
                setReservationRealtime(docSnap.data());
            } else {
                // If it was loaded before but now it's gone -> Session finalized
                if (hasLoadedDocRef.current) {
                    setReservationRealtime({ status: "FINISHED_AND_CLOSED" });
                    toast.success("Cảm ơn quý khách! Hóa đơn đã được thanh toán.", { duration: 5000 });

                    // Show "Thank You" UI then close
                    setTimeout(() => {
                        window.close();
                    }, 5000);
                } else {
                    // It doesn't exist yet (initial load delay)
                    console.warn("Reservation document not found (waiting...)");
                    setReservationRealtime({ status: "WAITING_FOR_DOC" });
                }
            }
        });

        // 2. Listen to the sub-collection orderItems
        const itemsRef = collection(db, "activeReservations", idToUse.toString(), "orderItems");
        const q = query(itemsRef);

        const unsubItems = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort by orderedAt ASC
            items.sort((a, b) => (a.orderedAt?.seconds || 0) - (b.orderedAt?.seconds || 0));
            setOrderItemsRealtime(items);
        });

        return () => {
            unsubRes();
            unsubItems();
        };
    }, [sessionId, sessionInfo?.reservationId]);

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
            const res = await customerApis(token).post(`${BASE_URL}/order_item/${sessionId}`, {
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
        console.log("requestPayment function called");
        // Check for non-served items
        const hasUnfinished = orderItemsRealtime.some(item => {
            console.log("Checking item status:", item.name, item.status);
            return item.status === "PENDING" || item.status === "COOKING";
        });

        if (hasUnfinished) {
            console.log("Blocking request: Has unfinished items");
            toast.error("Vui lòng đợi nhà bếp hoàn tất các món (Đang chờ/Đang chế biến) trước khi yêu cầu thanh toán");
            return;
        }

        console.log("Opening custom confirmation modal");
        setShowConfirmModal(true);
    };

    const handleConfirmPayment = async () => {
        try {
            setLoading(true);
            setShowConfirmModal(false);
            const res = await customerApis(token).post(`${BASE_URL}/order_session/request-payment/${sessionId}`);
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

    // Icon mapping for categories
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
                return {
                    label: "Đã phục vụ",
                    icon: <CheckCircle2 size={16} />,
                    color: "bg-emerald-100 text-emerald-600 border-emerald-200",
                    step: 4,
                    progressColor: "bg-emerald-500"
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

    if (!token) return <div className="p-20 text-center font-bold text-slate-400">Thiếu token xác thực.</div>;

    // Full Screen Loading State
    if (loading || !reservationRealtime || reservationRealtime.status === "WAITING_FOR_DOC") {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
                <SpinnerComp className="w-12 h-12 border-blue-600 border-t-transparent" />
                <p className="mt-4 text-slate-500 font-medium animate-pulse">
                    {loading ? "Đang tải dữ liệu từ máy chủ..." : "Đang đồng bộ trạng thái thực tế..."}
                </p>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex bg-slate-50 overflow-hidden font-sans text-slate-800 relative">
            {/* Checkout Success Screen */}
            {(reservationRealtime?.status === "CHECKEDOUT" || reservationRealtime?.status === "FINISHED_AND_CLOSED") && (
                <div className="absolute inset-0 z-[110] bg-white flex flex-col items-center justify-center text-center p-10 animate-in fade-in zoom-in duration-500">
                    <div className="w-40 h-40 bg-emerald-50 text-emerald-500 rounded-[56px] flex items-center justify-center mb-10 shadow-2xl shadow-emerald-100 ring-1 ring-emerald-100">
                        <CheckCircle2 size={96} strokeWidth={1.5} className="animate-in zoom-in duration-700 delay-300" />
                    </div>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-6">Xin Cảm Ơn Quý Khách!</h2>
                    <p className="text-slate-500 text-xl max-w-lg leading-relaxed font-medium">
                        Hy vọng quý khách đã có một trải nghiệm tuyệt vời tại nhà hàng.
                        Hẹn gặp lại quý khách vào lần tới!
                    </p>
                    <button
                        onClick={() => {
                            sessionStorage.clear();
                            nav("/");
                        }}
                        className="mt-16 px-10 py-5 bg-blue-600 text-white rounded-full font-black text-lg uppercase tracking-widest hover:bg-blue-700 shadow-3xl shadow-blue-500/30 transition-all active:scale-95"
                    >
                        Trở về màn hình chính
                    </button>
                </div>
            )}

            {/* Lock UI Overlay when Payment Requested */}
            {(reservationRealtime?.paymentStatus === "REQUESTED" || reservationRealtime?.status === "REQUEST_PAYMENT") && (
                <div className="absolute inset-0 z-[100] bg-slate-900/80 backdrop-blur-xl flex flex-col items-center justify-center text-center p-10 animate-in fade-in duration-500">
                    <div className="w-32 h-32 bg-white rounded-[48px] flex items-center justify-center mb-8 rotate-3 shadow-2xl animate-bounce-slow">
                        <Receipt size={64} className="text-blue-600" />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight mb-4">Đang Chờ Thanh Toán</h2>
                    <p className="text-slate-300 text-lg max-w-md leading-relaxed font-medium">
                        Yêu cầu thanh toán của bạn đã được gửi. Vui lòng đợi nhân viên Lễ tân đến bàn để hoàn tất thủ tục.
                    </p>
                    <div className="mt-12 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-3 px-6 py-3 bg-white/10 rounded-2xl border border-white/10 text-white font-bold">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                            Nhân viên đang được điều phối...
                        </div>
                    </div>
                </div>
            )}
            {/* Sidebar Categories - "Soft Glass" Design */}
            <aside className="w-24 md:w-32 bg-white border-r border-slate-200 flex flex-col shadow-xl z-20 transition-all">
                <div className="p-8 flex items-center justify-center border-b border-slate-50">
                    <div className="w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 rotate-3 animate-bounce-slow">
                        <Flame size={28} />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto py-8 scrollbar-hide space-y-4">
                    {categories.map(cat => (
                        <button
                            key={cat.categoryId}
                            onClick={() => { setActiveCategory(cat.categoryId); setActiveTab("menu"); }}
                            className={`w-full flex flex-col items-center gap-3 py-6 px-2 transition-all relative group
                                ${activeCategory === cat.categoryId
                                    ? "text-blue-600"
                                    : "text-slate-400 hover:text-slate-600"}
                            `}
                        >
                            {activeCategory === cat.categoryId && (
                                <div className="absolute right-0 top-2 bottom-2 w-1.5 bg-blue-500 rounded-l-2xl shadow-md shadow-blue-500/50 animate-in fade-in zoom-in duration-500"></div>
                            )}
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 
                                ${activeCategory === cat.categoryId
                                    ? "bg-blue-600 text-white shadow-2xl shadow-blue-500/40 -translate-y-1"
                                    : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"}
                            `}>
                                {getCategoryIcon(cat.name)}
                            </div>
                            <div className={`text-[10px] md:text-[11px] text-center leading-tight uppercase font-black tracking-widest px-2 transition-all duration-300
                                ${activeCategory === cat.categoryId ? "scale-105" : "text-slate-400"}
                            `}>{cat.name}</div>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Header */}
                <header className="h-24 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">E-Menu Tablet</h1>
                            <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-lg shadow-lg shadow-emerald-500/20 uppercase">Live Simulation</span>
                        </div>
                        {sessionInfo && (
                            <div className="flex items-center gap-4 mt-1.5">
                                <div className="flex items-center gap-1.5 text-blue-600 font-bold text-sm bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                    <Hash size={14} />
                                    <span>{sessionInfo.tableResponse.tableName}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                                    <User size={14} className="text-slate-400" />
                                    <span className="font-medium">{sessionInfo.customerResponse.fullName}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Search Bar */}
                    <div className="hidden md:flex items-center flex-1 max-w-sm px-4">
                        <div className="relative w-full group">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm món ăn..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-100 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <nav className="hidden lg:flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 relative group">
                            {[
                                { id: "menu", label: "Menu", icon: UtensilsCrossed },
                                { id: "tracking", label: "Theo dõi", icon: Clock },
                                { id: "bill", label: "Tạm tính", icon: Receipt },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 md:gap-3 px-6 py-3 rounded-xl text-sm font-black transition-all relative z-10
                                        ${activeTab === tab.id
                                            ? "text-slate-900 drop-shadow-sm"
                                            : "text-slate-400 hover:text-slate-600"}
                                    `}
                                >
                                    {activeTab === tab.id && (
                                        <div className="absolute inset-0 bg-white rounded-xl shadow-[0_10px_20px_-10px_rgba(0,0,0,0.1)] ring-1 ring-slate-100 animate-in fade-in zoom-in-95 duration-300 -z-10"></div>
                                    )}
                                    <tab.icon size={18} className={activeTab === tab.id ? "text-blue-600 scale-110" : "text-slate-400"} />
                                    {tab.label}
                                </button>
                            ))}
                        </nav>

                        <button
                            onClick={() => setShowCart(true)}
                            className="group relative w-14 h-14 bg-blue-600 text-white rounded-[20px] flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-500/20"
                        >
                            <ShoppingBag size={24} className="group-hover:rotate-6 transition-transform" />
                            {cart.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10">
                                    {cart.reduce((a, b) => a + b.quantity, 0)}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                {/* Content Sections */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    {activeTab === "menu" && (
                        <>
                            {searchTerm.trim().length > 0 && (
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-xl font-black text-slate-900">
                                        Kết quả tìm kiếm cho "{searchTerm}"
                                        <span className="ml-3 text-sm font-bold text-slate-400">{searchResults.length} món</span>
                                    </h2>
                                    <button onClick={() => setSearchTerm("")} className="text-sm font-bold text-blue-600 hover:underline">Xóa tìm kiếm</button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                {(searchTerm.trim().length > 0 ? searchResults : menuItems).map(item => (
                                    <div key={item.menuItemId} className="group bg-white rounded-[32px] overflow-hidden border border-slate-200 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col">
                                        <div className="aspect-[1.1] bg-slate-100 relative overflow-hidden">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-xl px-4 py-1.5 rounded-2xl text-blue-600 font-black text-sm shadow-xl border border-white/50">
                                                {formatPrice(item.price)}
                                            </div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <h3 className="font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">{item.name}</h3>
                                            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mb-6 flex-1">{item.description}</p>
                                            <button
                                                onClick={() => addToCart(item)}
                                                className="w-full py-4 bg-slate-50 text-slate-600 rounded-[20px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-[0.98] ring-1 ring-slate-100 hover:ring-blue-400 group-hover:shadow-lg group-hover:shadow-blue-500/20"
                                            >
                                                <Plus size={18} />
                                                Thêm vào giỏ
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {searchTerm.trim().length > 0 && searchResults.length === 0 && !isSearching && (
                                    <div className="col-span-full py-20 text-center flex flex-col items-center">
                                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300 mb-4">
                                            <Search size={40} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800">Không tìm thấy món "{searchTerm}"</h3>
                                        <p className="text-slate-500 mt-2">Vui lòng thử tìm kiếm với từ khóa khác.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === "tracking" && (
                        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="p-10 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-slate-900">Món ăn đang xử lý</h2>
                                            <p className="text-sm text-slate-400">Trạng thái thời gian thực từ nhà bếp</p>
                                        </div>
                                    </div>
                                    <span className="px-4 py-1.5 bg-blue-600 text-white text-xs font-black rounded-full shadow-lg shadow-blue-500/20 uppercase tracking-widest">
                                        Live Status
                                    </span>
                                </div>

                                {orderItemsRealtime.length === 0 ? (
                                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                                        <UtensilsCrossed size={64} strokeWidth={1} className="mb-6" />
                                        <p className="text-lg font-bold">Chưa có món nào được đặt</p>
                                        <p className="text-sm">Hãy chọn món tại Menu và gửi đi!</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {orderItemsRealtime.map(item => {
                                            const config = getStatusConfig(item.status);
                                            const steps = ["PENDING", "COOKING", "READY", "SERVED"];
                                            const currentStepIdx = steps.indexOf(item.status);

                                            return (
                                                <div key={item.id} className="group bg-slate-50 rounded-[32px] p-8 border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 relative overflow-hidden">
                                                    {/* Side indicator */}
                                                    <div className={`absolute top-0 left-0 w-1.5 h-full ${config.progressColor} opacity-50`}></div>

                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                                        <div className="flex items-center gap-5">
                                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${config.color} shadow-lg ring-4 ring-white`}>
                                                                {config.icon}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.name}</h4>
                                                                <div className="flex items-center gap-3 mt-1.5">
                                                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                                        <Hash size={12} /> Số lượng: {item.quantity}
                                                                    </span>
                                                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                                        <Clock size={12} /> {item.orderedAt ? new Date(item.orderedAt?.seconds * 1000).toLocaleTimeString() : "..."}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`px-5 py-2 rounded-2xl ${config.color} text-[10px] font-black uppercase tracking-widest shadow-sm`}>
                                                            {config.label}
                                                        </div>
                                                    </div>

                                                    {/* Visual Stepper */}
                                                    <div className="relative px-2">
                                                        {item.status !== "CANCELLED" ? (
                                                            <div className="flex items-center justify-between">
                                                                {steps.map((s, idx) => {
                                                                    const isActive = idx <= currentStepIdx;
                                                                    const isCurrent = idx === currentStepIdx;
                                                                    const sDefault = getStatusConfig(s);
                                                                    return (
                                                                        <React.Fragment key={s}>
                                                                            <div className="flex flex-col items-center gap-3 relative z-10">
                                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-700 
                                                                                    ${isActive
                                                                                        ? `${sDefault.progressColor} text-white shadow-lg ${isCurrent ? "scale-125 ring-4 ring-white" : "scale-100"}`
                                                                                        : "bg-white text-slate-300 border-2 border-slate-100"}
                                                                                `}>
                                                                                    {isActive ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 bg-slate-200 rounded-full"></div>}
                                                                                </div>
                                                                                <span className={`text-[9px] font-black uppercase tracking-tight 
                                                                                    ${isActive ? "text-slate-900" : "text-slate-300"}
                                                                                `}>{sDefault.label}</span>
                                                                            </div>
                                                                            {idx < steps.length - 1 && (
                                                                                <div className="flex-1 h-1 mx-4 bg-slate-200 rounded-full overflow-hidden">
                                                                                    <div
                                                                                        className={`h-full ${config.progressColor} transition-all duration-1000 ease-out`}
                                                                                        style={{ width: idx < currentStepIdx ? "100%" : (idx === currentStepIdx ? "50%" : "0%") }}
                                                                                    ></div>
                                                                                </div>
                                                                            )}
                                                                        </React.Fragment>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="py-4 px-6 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-500 font-bold text-sm">
                                                                <AlertCircle size={18} />
                                                                Món ăn này đã được hủy bời nhà bếp hoặc phục vụ.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "bill" && (
                        <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden relative">
                                <div className="absolute top-0 left-0 w-full h-2 bg-slate-900"></div>
                                <div className="p-10 pt-12">
                                    <div className="text-center mb-10">
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">HÓA ĐƠN TẠM TÍNH</h2>
                                        <p className="text-slate-400 text-sm mt-2 font-bold uppercase tracking-[0.2em]">{sessionInfo.tableResponse.tableName} • #{sessionId}</p>
                                    </div>

                                    <div className="space-y-6 mb-10">
                                        <div className="flex justify-between text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100 pb-3">
                                            <span>Tên món</span>
                                            <span>Thành tiền</span>
                                        </div>
                                        {orderItemsRealtime.length > 0 ? (
                                            orderItemsRealtime.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center group">
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                                        <p className="text-[10px] text-slate-400">x{item.quantity}</p>
                                                    </div>
                                                    <span className="font-black text-slate-900 text-sm">{formatPrice(item.price * item.quantity)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center py-10 text-slate-300 italic text-sm">Cần thực hiện gọi món xon xuôi</p>
                                        )}
                                    </div>

                                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-900 font-bold">Tổng cộng</span>
                                            <span className="text-3xl font-black text-blue-600">
                                                {formatPrice(reservationRealtime?.totalAmount || orderItemsRealtime.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                                            </span>
                                        </div>
                                    </div>

                                    {reservationRealtime?.paymentStatus !== "REQUESTED" && reservationRealtime?.status !== "REQUEST_PAYMENT" && orderItemsRealtime.length > 0 && (
                                        <button
                                            onClick={() => {
                                                console.log("Request payment clicked");
                                                requestPayment();
                                            }}
                                            className="w-full mt-8 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                                        >
                                            <Receipt size={20} />
                                            Yêu cầu thanh toán
                                        </button>
                                    )}

                                    <p className="text-center text-[10px] text-slate-300 italic mt-8 border-t border-slate-100 pt-6">
                                        *Đây chỉ là hóa đơn tạm tính để đối soát, không dùng để thanh toán cuối cùng.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tablet Nav (Bottom Floating - visible on small screens) */}
                <div className="lg:hidden fixed bottom-8 left-1/2 -translate-x-1/2 h-20 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[30px] shadow-2xl z-20 flex items-center px-4 py-2 gap-2 min-w-[320px]">
                    {[
                        { id: "menu", label: "Menu", icon: UtensilsCrossed },
                        { id: "tracking", label: "Theo dõi", icon: Clock },
                        { id: "bill", label: "Hóa đơn", icon: Receipt },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex flex-col items-center justify-center py-2 rounded-2xl transition-all
                                ${activeTab === tab.id ? "bg-white text-slate-900 font-black shadow-lg shadow-white/10" : "text-white/40 hover:text-white/70"}
                            `}
                        >
                            <tab.icon size={22} />
                            <span className="text-[10px] mt-1 font-bold uppercase tracking-tighter">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </main>

            {/* Reusable Confirm Modal for Payment */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmPayment}
                title="Yêu cầu thanh toán?"
                message="Xác nhận gửi yêu cầu thanh toán tới bộ phận Lễ tân. Sau khi xác nhận, hệ thống sẽ khóa chức năng đặt thêm món để chốt hóa đơn."
                confirmText="XÁC NHẬN GỬI"
                cancelText="KIỂM TRA LẠI"
                type="info"
                isLoading={loading}
            />

            {/* Cart Overlay Drawer */}
            {showCart && (
                <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowCart(false)}></div>
                    <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white text-blue-600 rounded-2xl flex items-center justify-center font-black shadow-lg shadow-blue-100 ring-1 ring-blue-50">
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Giỏ hàng</h2>
                                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-none mt-1">
                                        {cart.length} món đã chọn
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowCart(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-hide">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-40 h-40 bg-slate-50 rounded-[48px] flex items-center justify-center mb-8 rotate-3 shadow-inner">
                                        <ShoppingBag size={80} strokeWidth={1} className="text-slate-200" />
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 tracking-tight">Đang chờ bạn gọi món!</p>
                                    <p className="text-sm max-w-[240px] mt-4 leading-relaxed font-medium text-slate-400">Dịch vụ chu đáo, món ngon nóng hổi đang chờ phục vụ.</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.menuItemId} className="flex gap-5 items-center animate-in fade-in slide-in-from-left duration-300 bg-white p-3 rounded-[28px] border border-slate-100 shadow-lg shadow-slate-200/5 relative overflow-hidden group">
                                        <div className="w-20 h-20 rounded-[22px] overflow-hidden bg-slate-100 shrink-0 shadow-md border border-white">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-base text-slate-900 truncate tracking-tight mb-0.5">{item.name}</h4>
                                            <p className="text-blue-600 font-black text-sm">{formatPrice(item.price)}</p>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 p-0.5 bg-slate-50 rounded-xl border border-slate-100">
                                            <button
                                                onClick={() => updateQuantity(item.menuItemId, 1)}
                                                className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-600 hover:text-blue-600 shadow-sm outline-none transition-all active:scale-90"
                                            >
                                                <Plus size={14} />
                                            </button>
                                            <span className="text-sm font-black text-slate-900 tabular-nums px-1.5">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.menuItemId, -1)}
                                                className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-600 hover:text-red-600 shadow-sm outline-none transition-all active:scale-90"
                                            >
                                                <Minus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-6 bg-white border-t border-slate-50 shadow-[0_-20px_50px_rgba(0,0,0,0.04)]">
                                <button
                                    onClick={placeOrder}
                                    disabled={loading}
                                    className="w-full h-18 bg-blue-600 text-white rounded-full font-black text-base uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-blue-700 shadow-3xl shadow-blue-500/40 active:scale-[0.97] transition-all disabled:opacity-50 group py-5 h-auto"
                                >
                                    {loading ? (
                                        <div className="w-full flex justify-center py-1"><SpinnerComp className="w-6 h-6 border-white border-t-transparent" /></div>
                                    ) : (
                                        <>
                                            <span className="font-black text-sm tracking-widest">GỬI ĐƠN BẾP NGAY</span>
                                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-all">
                                                <ChevronRight size={18} />
                                            </div>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Chatbot Interface */}
            <FloatingChatButton
                onClick={() => setIsChatOpen(true)}
                isOpen={isChatOpen}
            />

            <ChatbotDrawer
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={chatMessages}
                onSendMessage={handleSendChatMessage}
                isTyping={isTypingChat}
                inputValue={chatInputValue}
                onInputChange={setChatInputValue}
            />
        </div>
    );
};

export default CustomerOrderingPage;
