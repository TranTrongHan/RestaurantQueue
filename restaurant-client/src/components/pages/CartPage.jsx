// src/components/pages/CartPage.js
import React, { useContext, useEffect, useRef, useState } from "react";
import { Button, Container, Image, Card, Row, Col, InputGroup, Form, Alert } from "react-bootstrap";
import { MyCartContext } from "../configs/Context";
import { authApis, endpoints } from "../configs/Apis";
import { useCookies } from "react-cookie";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SpinnerComp from "../common/SpinnerComp";
import { FaCheck } from "react-icons/fa6";
import { useStripe } from "@stripe/react-stripe-js";
import { useElements } from "@stripe/react-stripe-js";

const CartPage = () => {
    const [cart, cartDispatch] = useContext(MyCartContext);
    const [cookies, setCookies] = useCookies(["token"]);
    const [loading, setLoading] = useState(false);
    const updateQuantity = async (itemId, delta) => {
        cartDispatch({
            type: "add",
            payload: { menuItemId: itemId, quantity: delta },
        });
        if (delta > 0) {
            try {
                let payload = {
                    "items": [
                        {
                            "menuItemId": itemId,
                            "quantity": 1
                        }
                    ]
                }
                const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['cart']}/add`;
                let res = await authApis(cookies.token).post(url, payload);
                if (res.status === 200) {
                    const updatedCart = res.data.results.items;
                    updatedCart.map(item => {
                        if (item.menuItemId == itemId) {
                            cartDispatch({
                                type: "updateId",
                                payload: {
                                    menuItemId: item.menuItemId,
                                    cartItemId: item.cartItemId
                                }
                            })
                        }
                    })

                }
            } catch (error) {
                if (error.response) {
                    console.error("Backend error:", error.response.data);
                } else {
                    console.error("Axios error:", error.message);
                }
            }
        } else if (delta < 0) {
            try {
                console.log("itemId: ", itemId);
                const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['cart']}/items/${itemId}`;
                let res = await authApis(cookies.token).put(url);
                if (res.status === 200) {
                    console.log("success delete")
                }
            } catch (error) {
                if (error.response) {
                    console.error("Backend error:", error.response.data);
                } else {
                    console.error("Axios error:", error.message);
                }
            }
        }
    };


    const removeItem = async (item) => {
        cartDispatch({ type: "remove", payload: { menuItemId: item.menuItemId } });
        try {
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['cart']}/items/${item.cartItemId}`
            let res = await authApis(cookies.token).delete(url);
            if (res.status === 200) {
                console.log("success delete")
            }

        } catch (error) {
            if (error.response) {
                console.error("Backend error:", error.response.data);
            } else {
                console.error("Axios error:", error.message);
            }
        }
    };

    const clearCart = async () => {
        cartDispatch({ type: "clear" });
        try {
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['cart']}/clear`
            let res = await authApis(cookies.token).delete(url);
            if (res.data.code === 200) {
                console.log("success delete all")
            }
        } catch (error) {
            if (error.response) {
                console.error("Backend error:", error.response.data);
            } else {
                console.error("Axios error:", error.message);
            }
        }
    };

    const total = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );
    const [discountAmount, setDiscountAmount] = useState(0);
    const [isValidDiscount, setIsValidDiscount] = useState(false);
    const [discountError, setDiscountError] = useState(null);
    const [discount, setDiscount] = useState("");
    const handleChange = (e) => {
        const { name, value } = e.target;

        setDiscount(value);


        console.log(`${name} : ${value}`);
    }
    useEffect(() => {
        if (discountError) {
            const timer = setTimeout(() => {
                setDiscountError(null);
            }, 3000)
            return () => clearTimeout(timer);
        }
    }, [discountError])
    const checkDiscount = () => {
        if (!discount) {
            setDiscountError("Vui lòng nhập mã");
        }

    }
    const handlePayment = async () => {
        try {

            setLoading(true);
            const returnUrl = window.location.href;
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['online_order']}/createPayment?returnUrl=${returnUrl}`;
            console.log("posting url: ", url)
            let res = await authApis(cookies.token).post(url);
            if (res.status === 200 && res.data.result) {
                console.log("Thanh toán thành công");
                const paymentUrl = res.data.result;
                console.log("Redirecting to VNPAY:", paymentUrl);
                window.location.href = paymentUrl;
                cartDispatch({ type: "clear" });
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
    const location = useLocation();
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [bill, setBill] = useState(null);
    const hasCalled = useRef(false);
    const [showModal, setShowModal] = useState(false);
    const handleVnPayReturn = async () => {
        const query = location.search;
        if (!query.includes("vnp_")) return;
        if (hasCalled.current) return;
        hasCalled.current = true;
        try {
            const res = await authApis(cookies.token).get(
                `${import.meta.env.VITE_API_BASE_URL}${endpoints['online_order']}/vnpayReturn${query}`,
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
        handleVnPayReturn();
    }, [location])
    
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #912910 0%, #b8401f 100%)',
            padding: '20px 0'
        }}>
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

            <Container style={{ maxWidth: '1200px' }}>
                <div style={{
                    textAlign: 'center',
                    marginBottom: '40px',
                    padding: '20px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <h1 style={{
                        color: 'white',
                        fontSize: '2.5rem',
                        fontWeight: '700',
                        marginBottom: '10px',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                    }}>
                        Giỏ hàng của bạn
                    </h1>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '1.1rem',
                        margin: 0
                    }}>
                        {cart.length} sản phẩm trong giỏ hàng
                    </p>
                </div>

                {cart.length === 0 ? (
                    <Card style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '20px',
                        border: 'none',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                        padding: '60px 40px',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ color: '#666', marginBottom: '20px' }}>Giỏ hàng của bạn đang trống</h3>
                        <p style={{ color: '#999', marginBottom: '30px' }}>Hãy thêm một số món ăn ngon để bắt đầu!</p>
                        <Link
                            to="/menu"
                            style={{
                                textDecoration: 'none',
                                background: 'linear-gradient(135deg, #912910 0%, #b8401f 100%)',
                                color: 'white',
                                padding: '12px 30px',
                                borderRadius: '25px',
                                fontWeight: '600',
                                display: 'inline-block',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(145, 41, 16, 0.4)'
                            }}
                        >
                            Xem thực đơn
                        </Link>
                    </Card>
                ) : (
                    <Row>
                        <Col lg={8}>
                            <Card style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '20px',
                                border: 'none',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                                overflow: 'hidden'
                            }}>
                                {cart.map((item, index) => (
                                    <div key={item.menuItemId} style={{
                                        padding: '20px',
                                        borderBottom: index < cart.length - 1 ? '1px solid #f0f0f0' : 'none',
                                        transition: 'all 0.3s ease'
                                    }}>
                                        <Row style={{ alignItems: 'center' }}>
                                            <Col xs={3} md={2}>
                                                <Image
                                                    src={item.image}
                                                    style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        borderRadius: '15px',
                                                        objectFit: 'cover',
                                                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                            </Col>
                                            <Col xs={5} md={4}>
                                                <h5 style={{
                                                    marginBottom: '5px',
                                                    fontWeight: '600',
                                                    color: '#333',
                                                    fontSize: '1.1rem'
                                                }}>
                                                    {item.name}
                                                </h5>
                                                <p style={{
                                                    color: '#912910',
                                                    fontWeight: '600',
                                                    fontSize: '1rem',
                                                    margin: 0
                                                }}>
                                                    {item.price.toLocaleString()}đ
                                                </p>
                                            </Col>
                                            <Col xs={4} md={3}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    background: '#f8f9fa',
                                                    borderRadius: '25px',
                                                    padding: '5px',
                                                    width: 'fit-content'
                                                }}>
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={() => updateQuantity(item.menuItemId, -1)}
                                                        disabled={item.quantity <= 1}
                                                        style={{
                                                            width: '30px',
                                                            height: '30px',
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            border: 'none',
                                                            background: item.quantity <= 1 ? '#e9ecef' : '#dc3545',
                                                            color: item.quantity <= 1 ? '#6c757d' : 'white',
                                                            fontSize: '16px',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        -
                                                    </Button>
                                                    <span style={{
                                                        margin: '0 15px',
                                                        fontWeight: '600',
                                                        fontSize: '1.1rem',
                                                        minWidth: '20px',
                                                        textAlign: 'center'
                                                    }}>
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        onClick={() => updateQuantity(item.menuItemId, 1)}
                                                        style={{
                                                            width: '30px',
                                                            height: '30px',
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            border: 'none',
                                                            background: '#28a745',
                                                            color: 'white',
                                                            fontSize: '16px',
                                                            fontWeight: 'bold'
                                                        }}
                                                    >
                                                        +
                                                    </Button>
                                                </div>
                                            </Col>
                                            <Col xs={12} md={2} style={{ textAlign: 'right' }}>
                                                <div style={{
                                                    fontSize: '1.2rem',
                                                    fontWeight: '700',
                                                    color: '#912910',
                                                    marginBottom: '10px'
                                                }}>
                                                    {(item.price * item.quantity).toLocaleString()}đ
                                                </div>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => removeItem(item)}
                                                    style={{
                                                        borderRadius: '15px',
                                                        fontSize: '12px',
                                                        padding: '5px 10px'
                                                    }}
                                                >
                                                    Xóa
                                                </Button>
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                            </Card>
                        </Col>

                        <Col lg={4}>
                            <Card style={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '20px',
                                border: 'none',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                                position: 'sticky',
                                top: '20px'
                            }}>
                                <div style={{ padding: '30px' }}>
                                    <h4 style={{
                                        marginBottom: '25px',
                                        fontWeight: '700',
                                        color: '#333',
                                        textAlign: 'center'
                                    }}>
                                        Tóm tắt đơn hàng
                                    </h4>

                                    <div style={{
                                        borderBottom: '2px dashed #e9ecef',
                                        paddingBottom: '20px',
                                        marginBottom: '20px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '10px'
                                        }}>
                                            <span style={{ color: '#666' }}>Số món:</span>
                                            <span style={{ fontWeight: '600' }}>{cart.length} món</span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '10px'
                                        }}>
                                            <span style={{ color: '#666' }}>Tổng số lượng:</span>
                                            <span style={{ fontWeight: '600' }}>
                                                {cart.reduce((sum, item) => sum + item.quantity, 0)} phần
                                            </span>
                                        </div>
                                    </div>
                                    <InputGroup className="mb-3">
                                        <Form.Control
                                            aria-label="Default"
                                            aria-describedby="inputGroup-sizing-default"
                                            value={discount}
                                            onChange={handleChange}
                                            name="discount"
                                        />
                                        <Button onClick={checkDiscount}>
                                            <FaCheck />
                                        </Button>
                                    </InputGroup>
                                    {discountError && (
                                        <Alert variant="danger" style={{
                                            marginTop: '5px',
                                            marginBottom: '5px',
                                            padding: '8px 12px',
                                            fontSize: '13px',
                                            borderRadius: '8px'
                                        }}>
                                            {discountError}
                                        </Alert>
                                    )}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        background: 'linear-gradient(135deg, #912910 0%, #b8401f 100%)',
                                        padding: '15px 20px',
                                        borderRadius: '15px',
                                        color: 'white',
                                        marginBottom: '25px'
                                    }}>
                                        <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                                            Tổng cộng:
                                        </span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                                            {total.toLocaleString()}đ
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <Button
                                            variant="success"
                                            size="lg"
                                            onClick={handlePayment}
                                            disabled={loading}
                                            style={{
                                                borderRadius: '15px',
                                                fontWeight: '600',
                                                fontSize: '1.1rem',
                                                padding: '12px',
                                                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                                border: 'none',
                                                boxShadow: '0 4px 15px rgba(40, 167, 69, 0.4)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.transform = 'translateY(-2px)';
                                                e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.6)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.transform = 'translateY(0)';
                                                e.target.style.boxShadow = '0 4px 15px rgba(40, 167, 69, 0.4)';
                                            }}
                                        >
                                            {loading ? (<SpinnerComp />) : ("Thanh toán ngay")}
                                        </Button>

                                        <Button
                                            variant="outline-danger"
                                            onClick={clearCart}
                                            style={{
                                                borderRadius: '15px',
                                                fontWeight: '600',
                                                borderColor: '#dc3545',
                                                color: '#dc3545',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.backgroundColor = '#dc3545';
                                                e.target.style.color = 'white';
                                                e.target.style.transform = 'translateY(-1px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.backgroundColor = 'transparent';
                                                e.target.style.color = '#dc3545';
                                                e.target.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            Xóa toàn bộ
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                )}

                <div style={{
                    textAlign: 'center',
                    marginTop: '40px',
                    padding: '20px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '15px',
                    backdropFilter: 'blur(10px)'
                }}>
                    <Link
                        to="/menu"
                        style={{
                            color: 'white',
                            textDecoration: 'none',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            padding: '10px 20px',
                            borderRadius: '25px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            display: 'inline-block',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                            e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                            e.target.style.transform = 'translateY(0)';
                        }}
                    >
                        Quay về thực đơn
                    </Link>
                </div>
            </Container>
        </div>
    );
};

export default CartPage;