import { useCallback, useEffect, useRef, useState } from "react";
import { useCookies } from "react-cookie";
import { useLocation, useNavigate } from "react-router-dom";
import SpinnerComp from "../../common/SpinnerComp";
import AlertComp from "../../common/AlertComp";
import { Badge, Button, ButtonGroup, Card, Col, Container, Row } from "react-bootstrap";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import LeftPanel from "./LeftPanel";
import CartContent from "./RightPanel/CartContent";
import TrackingContent from "./RightPanel/TrackingContent";
import BillContent from "./RightPanel/BillContent";
const SessionPage = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cateId, setCateId] = useState(1);
    const fetchMenuItems = async (categoryId) => {
        if (!categoryId) {
            console.warn("fetchMenuItems skipped, invalid categoryId:", categoryId);
            return;
        }
        try {
            const url = `${endpoints['menu_items']}?cateId=${categoryId}`;
            const res = await Apis.get(url);

            if (res.data.code === 200) {
                setMenuItems(res.data.result);
            }
        } catch (error) {
            if (error.response) {
                console.error("Backend error:", error.response.data);
            } else {
                console.error("Axios error:", error.message);
            }
        }
    };

    const fetchCategories = async () => {
        try {
            const url = `${endpoints['categories']}`;
            const res = await Apis.get(url);
            if (res.data.code === 200) {
                const fetchedCategories = res.data.result;
                setCategories(fetchedCategories);
                if (fetchedCategories.length > 0) {
                    setCateId(fetchedCategories[0].categoryId);
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const sessionToken = params.get("token") || null;
    const sessionId = params.get("sessionId") || null;
    const [customerJwt, setCustomerJwt] = useState(null);
    window.addEventListener("message", (event) => {
        if (event.origin !== window.location.origin) return;
        let customerJwtEvent = event.data;
        if (customerJwtEvent) {
            console.log("has customer jwt event", customerJwtEvent);
            setCustomerJwt(customerJwtEvent || null);
            sessionStorage.setItem("customerJwt", customerJwtEvent)
        }
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [customerInfo, setCustomerInfo] = useState({
        name: "",
        isVIP: ""
    });
    const nav = useNavigate();
    const validateToken = async () => {
        try {
            setLoading(true);
            const url = `${endpoints.order_session}/validate?token=${sessionToken}`;
            console.log("get url: ", url);
            let res = await Apis.get(url);
            if (res.status === 200) {
                const result = res.data.result;
                if (!result.valid) {
                    console.warn("Token không hợp lệ!");
                    setError("Phiên làm việc đã hết hạn hoặc không hợp lệ.");
                    alert("Token không hợp lệ. Tự động chuyển về trang chủ sau 3 giây nữa");
                    return;
                }
                setCustomerInfo({
                    name: result.reservationResponse.customerResponse.fullName,
                    isVIP: result.reservationResponse.customerResponse.isVIP != null ? true : false
                });

                console.log("Xác thực sessionToken thành công!");
                console.log("customerJWT: ", customerJwt);

            }

        } catch (error) {
            if (error.response) {
                console.error("Backend error:", error.response.data);
                setError("Lỗi từ máy chủ: " + error.response.data.message);
            } else {
                console.error("Axios error:", error.message);
                setError("Lỗi kết nối mạng. Vui lòng thử lại sau.");
            }

        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                nav("/");
            }, 5000)
            return () => clearTimeout(timer);
        }
    }, [error])
    useEffect(() => {
        validateToken();
    }, [])
    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (cateId !== null) {
            fetchMenuItems(cateId);
        }
    }, [cateId]);

    const [activeCategory, setActiveCategory] = useState('appetizers');
    let [cart, setCart] = useState([]);
    const [activeTab, setActiveTab] = useState('cart');
    const primaryColor = '#912910';
    const lightColor = '#f8f9fa';
    const whiteColor = '#ffffff';
    const [showPaymentButton, setShowPaymentButton] = useState(false);
    const addToCart = (item) => {
        if (activeTab != 'cart') {
            setActiveTab('cart');
        }
        setCart(prev => {
            const exist = prev.find(cartItem => cartItem.menuItemId === item.menuItemId);
            let updatedCart;
            if (exist) {
                updatedCart = prev.map(cartItem =>
                    cartItem.menuItemId === item.menuItemId
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            } else {
                updatedCart = [...prev, { menuItemId: item.menuItemId, quantity: 1, name: item.name, price: item.price }];
            }
            console.log("Updated cart:", updatedCart);
            return updatedCart;
        });


        console.log(cart);

    };

    const removeFromCart = (item) => {
        const itemCart = cart.find(cartItem => cartItem.menuItemId === item.menuItemId);

        if (itemCart) {
            if (itemCart.quantity > 1) {
                const updatedCart = cart.map(cartItem =>
                    cartItem.menuItemId === itemCart.menuItemId
                        ? { ...cartItem, quantity: cartItem.quantity - 1 }
                        : cartItem
                );
                console.log("Updated cart:", updatedCart);
                setCart(updatedCart);
            } else {
                const filteredCart = cart.filter(cartItem => cartItem.menuItemId !== item.menuItemId);
                console.log("Updated cart (after remove item):", filteredCart);
                setCart(filteredCart);
            }

        }
    };

    const clearCart = () => {
        setCart([]);
    };
    const [orderId, setOrderId] = useState(null);
    const sendOrder = async () => {
        if (cart.length > 0) {
            clearCart();
        }
        try {
            setLoading(true);
            const menuItemRequestList = cart.map(item => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity
            }))
            const payload = {
                menuItemRequestList: menuItemRequestList
            }
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.order_session}/${sessionId}/orderitems`;
            console.log("fetching url: ", url);
            console.log("Payload being sent:", payload);
            console.log("customer_jwt: ", customerJwt)
            let response = await authApis(customerJwt).post(url, payload);
            if (response.status === 200) {
                console.log("orderId: ", response.data.result[0].orderId);
                setOrderId(response.data.result[0].orderId);
                setShowPaymentButton(true);
            }

        } catch (error) {
            if (error.response) {
                console.error("Backend error:", error.response.data);
                setError("Lỗi từ máy chủ: " + error.response.data.message);
            } else {
                console.error("Axios error:", error.message);
                setError("Lỗi kết nối mạng. Vui lòng thử lại sau.");
            }

        } finally {
            setLoading(false);
        }
    };
    const [items, setItems] = useState([]);
    useEffect(() => {
        if (!orderId) return;

        const colRef = collection(db, "orders", String(orderId), "orderItems");

        const unsubscribe = onSnapshot(colRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setItems(data);
        });

        return () => unsubscribe();
    }, [orderId]);
    // BillContent
    const [billItems, setBillItems] = useState([]);
    useEffect(() => {
        const colRef = collection(db, "orderBills", String(orderId), "billItems");
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setBillItems(data);
        });

        return () => unsubscribe();
    }, [orderId])
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
    };
    const [success, setSuccess] = useState(null);
    const [showModalPay, setShowModalPay] = useState(false);


    const handleCancelOrderItem = async (orderItemId) => {
        try {
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints.order_session}/${orderItemId}`;
            console.log("delete url: ", url);
            let res = await authApis(customerJwt).delete(url);
            if (res.status === 200) {
                alert("Xóa món thành công")
            }
        } catch (error) {
            if (error.response) {
                console.error("Backend error:", error.response.data);
                setError("Lỗi từ máy chủ: " + error.response.data.message);
            } else {
                console.error("Axios error:", error.message);
                setError("Lỗi kết nối mạng. Vui lòng thử lại sau.");
            }
        }
    }
    const handlePayment = async () => {
        if (billItems.length === 0) {
            alert("Vui lòng order món để thanh toán!");
            return;
        }
        const pendingItems = items.filter(item => item.status == "PENDING");
        const cookingItems = items.filter(item => item.status == "COOKING");
        if (pendingItems.length > 0 || cookingItems.length > 0) {
            setShowModalPay(true);
            return;
        }

        try {
            setLoading(true);
            const returnUrl = window.location.href;
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['order_session']}/createPayment/${sessionId}?returnUrl=${returnUrl}`;

            console.log("posting url: ", url)
            let res = await authApis(customerJwt).post(url);
            if (res.status === 200 && res.data.result) {
                console.log("Thanh toán thành công");
                const paymentUrl = res.data.result;
                console.log("Redirecting to VNPAY:", paymentUrl);
                window.location.href = paymentUrl
            }
        } catch (error) {
            if (error.response) {
                console.error("Backend error:", error.response.data);
            } else {
                console.error("Axios error:", error.message);
            }
        } finally {
            setLoading(false);
        }
    }
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [bill, setBill] = useState(null);
    const hasCalled = useRef(false);
    const [showModal, setShowModal] = useState(false);
    const handleVnPayReturn = async () => {
        const searchParams = new URLSearchParams(location.search);
        if (hasCalled.current) return;
        hasCalled.current = true;
        
        const vnpParams = new URLSearchParams();
        searchParams.forEach((value, key) => {
            if (key.startsWith("vnp_")) {
                vnpParams.append(key, value);
            }
        });
        if (![...vnpParams.keys()].some(k => k.startsWith("vnp_"))) return;
        try {
            console.log("customerjwt: ", sessionStorage.getItem("customerJwt"));
            console.log("get return url: ", `${import.meta.env.VITE_API_BASE_URL}${endpoints['order_session']}/vnpayReturn?${vnpParams.toString()}`)
            const res = await authApis(sessionStorage.getItem("customerJwt")).get(
                `${import.meta.env.VITE_API_BASE_URL}${endpoints['order_session']}/vnpayReturn?${vnpParams.toString()}`,
            );

            setPaymentStatus("success");
            setBill(res.data.result);
            setShowModal(true);
        } catch (err) {
            console.error("Payment verify error:", err);
            setPaymentStatus("failed");
            setShowModal(true);
        }
    };
    const closeModal = () => {
        setShowModal(false);
    };
    useEffect(() => {
        if (paymentStatus) {
            const timer = setTimeout(() => {
                nav("/");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [paymentStatus]);
    useEffect(() => {
        handleVnPayReturn();
    }, [location])
    return (
        <>
            {error ? (<AlertComp variant="danger" lable={error} />) : (loading ? (<SpinnerComp />) : (
                <>
                    {/* Modal Overlay */}
                    {showModal && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000
                        }}>
                            {/* Modal Content */}
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '30px',
                                maxWidth: '400px',
                                width: '90%',
                                textAlign: 'center',
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                                transform: showModal ? 'scale(1)' : 'scale(0.9)',
                                transition: 'transform 0.3s ease'
                            }}>
                                {paymentStatus === "success" && (
                                    <>
                                        <div style={{
                                            fontSize: '60px',
                                            marginBottom: '20px'
                                        }}></div>
                                        <h2 style={{
                                            color: '#28a745',
                                            margin: '0 0 15px 0',
                                            fontSize: '24px',
                                            fontWeight: 'bold'
                                        }}>
                                            Thanh toán thành công!
                                        </h2>
                                        <p style={{
                                            color: '#666',
                                            margin: '0 0 25px 0',
                                            fontSize: '16px'
                                        }}>
                                            Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đã được xử lý thành công.
                                        </p>
                                    </>
                                )}

                                {paymentStatus === "failed" && (
                                    <>
                                        <div style={{
                                            fontSize: '60px',
                                            marginBottom: '20px'
                                        }}></div>
                                        <h2 style={{
                                            color: '#dc3545',
                                            margin: '0 0 15px 0',
                                            fontSize: '24px',
                                            fontWeight: 'bold'
                                        }}>
                                            Thanh toán thất bại!
                                        </h2>
                                        <p style={{
                                            color: '#666',
                                            margin: '0 0 25px 0',
                                            fontSize: '16px'
                                        }}>
                                            Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại.
                                        </p>
                                    </>
                                )}

                                {/* Close Button */}
                                <button
                                    onClick={closeModal}
                                    style={{
                                        backgroundColor: paymentStatus === "success" ? '#28a745' : '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        padding: '12px 24px',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.3s ease',
                                        minWidth: '100px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = paymentStatus === "success" ? '#218838' : '#c82333';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = paymentStatus === "success" ? '#28a745' : '#dc3545';
                                    }}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    )}
                    {success && <AlertComp variant="success" lable={success} />}
                    <Container fluid style={{
                        height: '100vh',
                        backgroundColor: lightColor,
                        padding: '15px',
                        overflow: 'hidden'
                    }}>
                        {/* Header */}
                        <Row className="mb-3">
                            <Col xs={12}>
                                <Card style={{
                                    backgroundColor: primaryColor,
                                    border: 'none',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                }}>
                                    <Card.Body style={{ padding: '20px', textAlign: 'center' }}>
                                        <h3 style={{
                                            color: whiteColor,
                                            margin: 0,
                                            fontWeight: 'bold'
                                        }}>
                                            Order Tablet - {customerInfo.name}  {customerInfo.isVIP ? ("- Khách VIP") : (null)}
                                        </h3>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>

                        <Row style={{ height: 'calc(100vh - 120px)' }}>
                            {/* Left Panel - Menu */}
                            <LeftPanel cateId={cateId} setCateId={setCateId} activeCategory={activeCategory} setActiveCategory={setActiveCategory}
                                categories={categories} menuItems={menuItems} formatPrice={formatPrice} addToCart={addToCart} />

                            {/* Right Panel - Cart */}
                            <Col lg={4} md={5} style={{ height: '100%' }}>
                                <Card style={{
                                    height: '100%',
                                    border: 'none',
                                    boxShadow: '0 2px 15px rgba(0,0,0,0.08)',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    {/* Cart Header */}
                                    <Card.Header style={{
                                        backgroundColor: lightColor,
                                        borderBottom: `2px solid #dee2e6`,
                                        padding: '20px'
                                    }}>
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                            <Button
                                                variant={activeTab === 'cart' ? 'primary' : 'outline-primary'}
                                                onClick={() => setActiveTab('cart')}
                                                style={{
                                                    backgroundColor: activeTab === 'cart' ? primaryColor : 'transparent',
                                                    borderColor: primaryColor,
                                                    color: activeTab === 'cart' ? whiteColor : primaryColor,
                                                    fontWeight: '600',
                                                    flex: 1,
                                                    padding: '10px',
                                                    border: `2px solid ${primaryColor}`
                                                }}
                                            >
                                                Đơn món
                                                <Badge bg="secondary" style={{
                                                    backgroundColor: whiteColor,
                                                    color: primaryColor,
                                                    marginLeft: '8px'
                                                }}>
                                                    {cart.reduce((total, item) => total + item.quantity, 0)}
                                                </Badge>
                                            </Button>
                                            <Button
                                                variant={activeTab === 'tracking' ? 'primary' : 'outline-primary'}
                                                onClick={() => setActiveTab('tracking')}
                                                style={{
                                                    backgroundColor: activeTab === 'tracking' ? primaryColor : 'transparent',
                                                    borderColor: primaryColor,
                                                    color: activeTab === 'tracking' ? whiteColor : primaryColor,
                                                    fontWeight: '600',
                                                    flex: 1,
                                                    padding: '10px',
                                                    border: `2px solid ${primaryColor}`
                                                }}
                                            >
                                                Theo dõi món ăn
                                            </Button>
                                            <Button
                                                variant={activeTab === 'bill' ? 'primary' : 'outline-primary'}
                                                onClick={() => setActiveTab('bill')}
                                                style={{
                                                    backgroundColor: activeTab === 'bill' ? primaryColor : 'transparent',
                                                    borderColor: primaryColor,
                                                    color: activeTab === 'bill' ? whiteColor : primaryColor,
                                                    fontWeight: '600',
                                                    flex: 1,
                                                    padding: '10px',
                                                    border: `2px solid ${primaryColor}`
                                                }}
                                            >
                                                Hóa đơn tạm tính
                                            </Button>
                                        </div>
                                    </Card.Header>

                                    {/* Cart Items */}
                                    <Card.Body style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        padding: '20px'
                                    }}>
                                        {/* Cart Content */}
                                        {activeTab === 'cart' && (<CartContent cart={cart} formatPrice={formatPrice} removeFromCart={removeFromCart}
                                            addToCart={addToCart}
                                        />)}
                                        {activeTab === 'tracking' && (
                                            <TrackingContent items={items}
                                                primaryColor={primaryColor} handleCancelOrderItem={handleCancelOrderItem} />
                                        )}

                                        {/* Bill Content */}
                                        {activeTab === 'bill' && (
                                            <BillContent formatPrice={formatPrice} billItems={billItems} showModalPay={showModalPay} setShowModalPay={setShowModalPay} />
                                        )}
                                    </Card.Body>

                                    {/* Cart Footer */}
                                    {activeTab === 'cart' && cart.length > 0 && (
                                        <Card.Footer style={{
                                            backgroundColor: lightColor,
                                            borderTop: `2px solid #dee2e6`,
                                            padding: '20px'
                                        }}>
                                            <Button
                                                disabled={loading}
                                                size="lg"
                                                onClick={sendOrder}
                                                style={{
                                                    backgroundColor: '#198754',
                                                    borderColor: '#198754',
                                                    width: '100%',
                                                    fontWeight: 'bold',
                                                    fontSize: '1.2rem',
                                                    padding: '15px'
                                                }}
                                            >
                                                {loading ? <SpinnerComp /> : "Gửi đơn"}
                                            </Button>
                                        </Card.Footer>
                                    )}
                                    {activeTab === 'bill' && showPaymentButton && (
                                        <Card.Footer style={{
                                            backgroundColor: lightColor,
                                            borderTop: `2px solid #dee2e6`,
                                            padding: '20px'
                                        }}>
                                            <Button
                                                disabled={loading}
                                                size="lg"
                                                onClick={handlePayment}
                                                style={{
                                                    backgroundColor: '#bd4d20ff',
                                                    width: '100%',
                                                    fontWeight: 'bold',
                                                    fontSize: '1.2rem',
                                                    padding: '15px'
                                                }}
                                            >
                                                {loading ? (<SpinnerComp />) : ("Thanh toán")}
                                            </Button>
                                        </Card.Footer>
                                    )}
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </>
            ))}

        </>
    )
}

export default SessionPage;