import { useState, useEffect } from "react"
import { useCookies } from "react-cookie";
import { authApis, endpoints } from "../configs/Apis";
import SpinnerComp from "../common/SpinnerComp";
import { Container, Row, Col, Card, Badge, Button, Image } from 'react-bootstrap';
import Header from "../layout/Header";
import Footer from "../layout/Footer";

const MyOnlineOrderPage = () => {
    const [onlineOrders, setOnlineOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [cookies,] = useCookies(["token"]);

    const fetchMyOnlineOrder = async () => {
        try {
            setLoading(true);
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['online_order']}/my`;
            console.log("fetching url :", url);
            let res = await authApis(cookies.token).get(url);
            if (res.status === 200) {
                setOnlineOrders(res.data.result);
            }
        } catch (error) {
            if (error.response) {
                console.error("Backend error:", error.response.data);
                setError("Không thể tải danh sách đơn hàng");
            } else {
                console.error("Axios error:", error.message);
                setError("Lỗi kết nối mạng");
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchMyOnlineOrder();
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const getTotalAmount = (orderItems) => {
        return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    if (loading) return <SpinnerComp />;

    return (
        <>
            <Header />
            <Container fluid style={{
                minHeight: '100vh',
                backgroundColor: '#f8f9fa',
                padding: '20px 0'
            }}>

                <Container>
                    {/* Header */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '30px',
                        padding: '20px',
                        background: 'linear-gradient(135deg, #912910 0%, #b8401f 100%)',
                        borderRadius: '15px',
                        color: 'white'
                    }}>
                        <h2 style={{ margin: 0, fontWeight: 'bold' }}>Đơn hàng của tôi</h2>
                        
                    </div>

                    {error && (
                        <div style={{
                            backgroundColor: '#f8d7da',
                            color: '#721c24',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    {onlineOrders.length === 0 && !loading && (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            backgroundColor: 'white',
                            borderRadius: '15px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ fontSize: '50px', marginBottom: '20px', color: '#912910' }}>Trống</div>
                            <h4 style={{ color: '#6c757d', marginBottom: '10px' }}>Chưa có đơn hàng nào</h4>
                            <p style={{ color: '#adb5bd' }}>Hãy đặt món ngon đầu tiên của bạn!</p>
                        </div>
                    )}

                    {/* Orders List */}
                    {onlineOrders.map((order, orderIndex) => (
                        <Card key={order.onlineOrderId} style={{
                            marginBottom: '25px',
                            border: 'none',
                            borderRadius: '15px',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                            overflow: 'hidden'
                        }}>
                            {/* Order Header */}
                            <div style={{
                                background: 'linear-gradient(135deg, #912910 0%, #b8401f 100%)',
                                color: 'white',
                                padding: '20px'
                            }}>
                                <Row className="align-items-center">
                                    <Col md={6}>
                                        <h5 style={{ margin: 0, fontWeight: 'bold' }}>
                                            Đơn hàng #{order.orderId}
                                        </h5>
                                        <small style={{ opacity: 0.9 }}>
                                            Đặt lúc: {formatDate(order.createdAt)}
                                        </small>
                                    </Col>
                                    <Col md={6} className="text-end">
                                        <Badge bg="" style={{
                                            fontSize: '14px',
                                            padding: '8px 15px',
                                            borderRadius: '20px',
                                            backgroundColor: '#dc6545',
                                            color: 'white'
                                        }}>
                                            Đã thanh toán
                                        </Badge>
                                    </Col>
                                </Row>
                            </div>

                            <Card.Body style={{ padding: '0' }}>
                                {/* Order Items */}
                                <div style={{ padding: '20px' }}>
                                    <h6 style={{
                                        marginBottom: '20px',
                                        color: '#495057',
                                        fontWeight: 'bold',
                                        borderBottom: '2px solid #e9ecef',
                                        paddingBottom: '10px'
                                    }}>
                                        Chi tiết món ăn
                                    </h6>

                                    {order.orderItems.map((item, itemIndex) => (
                                        <Row key={item.orderItemId} style={{
                                            marginBottom: itemIndex === order.orderItems.length - 1 ? '0' : '15px',
                                            padding: '15px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '10px',
                                            alignItems: 'center'
                                        }}>
                                            <Col xs={3} md={2}>
                                                <Image
                                                    src={item.image}
                                                    alt="Món ăn"
                                                    style={{
                                                        width: '80px',
                                                        height: '80px',
                                                        objectFit: 'cover',
                                                        borderRadius: '10px',
                                                        border: '3px solid white',
                                                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                                    }}
                                                    fluid
                                                />
                                            </Col>
                                            <Col xs={9} md={10}>
                                                <Row>
                                                    <Col md={4}>
                                                        <div style={{
                                                            fontWeight: '600',
                                                            color: '#495057',
                                                            marginBottom: '5px'
                                                        }}>
                                                            Đơn giá: {formatPrice(item.price)}
                                                        </div>
                                                    </Col>
                                                    <Col md={3}>
                                                        <div style={{
                                                            fontWeight: '600',
                                                            color: '#6c757d'
                                                        }}>
                                                            SL: <span style={{
                                                                backgroundColor: '#e9ecef',
                                                                padding: '4px 8px',
                                                                borderRadius: '15px',
                                                                fontSize: '14px'
                                                            }}>
                                                                {item.quantity}
                                                            </span>
                                                        </div>
                                                    </Col>
                                                    <Col md={3}>
                                                        <Badge bg={item.orderItemStatus === 'DONE' ? '' : 'warning'} style={{
                                                            fontSize: '12px',
                                                            padding: '6px 12px',
                                                            backgroundColor: item.orderItemStatus === 'DONE' ? '#912910' : '#ffc107',
                                                            color: 'white'
                                                        }}>
                                                            {item.orderItemStatus === 'DONE' ? 'Hoàn thành' : 'Đang xử lý'}
                                                        </Badge>
                                                    </Col>
                                                    <Col md={2} className="text-end">
                                                        <div style={{
                                                            fontWeight: 'bold',
                                                            color: '#912910',
                                                            fontSize: '16px'
                                                        }}>
                                                            {formatPrice(item.price * item.quantity)}
                                                        </div>
                                                    </Col>
                                                </Row>
                                            </Col>
                                        </Row>
                                    ))}
                                </div>

                                {/* Customer Info */}
                                <div style={{
                                    backgroundColor: '#e9ecef',
                                    padding: '20px',
                                    borderTop: '1px solid #dee2e6'
                                }}>
                                    <Row>
                                        <Col md={8}>
                                            <h6 style={{
                                                marginBottom: '15px',
                                                color: '#495057',
                                                fontWeight: 'bold'
                                            }}>
                                                Thông tin khách hàng
                                            </h6>
                                            <div style={{ lineHeight: '1.6' }}>
                                                <div><strong>Họ tên:</strong> {order.customer.fullName}</div>
                                                <div><strong>Email:</strong> {order.customer.email}</div>
                                                <div><strong>Số điện thoại:</strong> {order.customer.phone}</div>
                                                <div><strong>Địa chỉ giao hàng:</strong> {order.deliveryAddress}</div>
                                            </div>
                                        </Col>
                                        <Col md={4} className="text-end">
                                            <div style={{
                                                backgroundColor: 'white',
                                                padding: '20px',
                                                borderRadius: '10px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                            }}>
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: '#6c757d',
                                                    marginBottom: '8px'
                                                }}>
                                                    Tổng tiền
                                                </div>
                                                <div style={{
                                                    fontSize: '24px',
                                                    fontWeight: 'bold',
                                                    color: '#28a745'
                                                }}>
                                                    {formatPrice(getTotalAmount(order.orderItems))}
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}

                    {/* Refresh Button */}
                    {onlineOrders.length > 0 && (
                        <div style={{ textAlign: 'center', marginTop: '30px' }}>
                            <Button
                                variant="outline-primary"
                                onClick={fetchMyOnlineOrder}
                                disabled={loading}
                                style={{
                                    borderRadius: '25px',
                                    padding: '12px 30px',
                                    fontWeight: '600'
                                }}
                            >
                                Tải lại danh sách
                            </Button>
                        </div>
                    )}
                </Container>

            </Container>
            <Footer />
        </>
    );
};

export default MyOnlineOrderPage;