import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { authApis, endpoints } from "../configs/Apis";
import { useCookies } from "react-cookie";
import SpinnerComp from "../common/SpinnerComp";
import AlertComp from "../common/AlertComp";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { Container, Card, Row, Col, Badge, Form, Button, Table } from "react-bootstrap";
import { 
    FaChair, 
    FaCalendarAlt, 
    FaClock, 
    FaUser, 
    FaStickyNote, 
    FaReceipt, 
    FaCreditCard, 
    FaCheck,

} from "react-icons/fa";
import dayjs from "dayjs";

const ReservationDetailPage = () => {
    const { id } = useParams();
    const [cookies] = useCookies(["token"]);
    const [reservation, setReservation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const nav = useNavigate();

    const fetchReservationDetail = async () => {
        try {
            setLoading(true);
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints["booking"]}/${id}`;
            let res = await authApis(cookies.token).get(url);
            if (res.data.code === 200) {
                setReservation(res.data.result);
                setError(null);
            } else {
                setError("Không tìm thấy đặt bàn.");
            }
        } catch (err) {
            console.log(err.message);
            if (err.response) {
                if (err.response.data.code === 9997) {
                    setError("Không có quyền truy cập!")
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservationDetail();
    }, [id]);

    const getStatusBadge = (status) => {
        switch (status) {
            case "BOOKED":
                return <Badge bg="warning" text="dark">Đã đặt</Badge>;
            case "CANCELED":
                return <Badge bg="danger">Đã hủy</Badge>;
            case "CHECKED_IN":
                return <Badge bg="primary">Đã nhận bàn</Badge>;
            case "CHECKEDOUT":
                return <Badge bg="success">Đã thanh toán</Badge>;
            default:
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    const getBillStatusBadge = (status) => {
        switch (status) {
            case "PAID":
                return <Badge bg="success"><FaCheck className="me-1"/>Đã thanh toán</Badge>;
            case "PENDING":
                return <Badge bg="warning" text="dark">Chờ thanh toán</Badge>;
            default:
                return <Badge bg="secondary">{status}</Badge>;
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDateTime = (dateTime) => {
        if (!dateTime) return "Chưa có";
        return new Date(dateTime).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    };

    const [formData, setFormData] = useState({
        checkinTime: ""
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                checkinTime: dayjs(formData.checkinTime).format("YYYY-MM-DD HH:mm:ss")
            };
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['booking']}/${id}`;
            let res = await authApis(cookies.token).put(url, payload);
            if (res.data.code === 200) {
                setSuccess("Thay đổi giờ checkin thành công");
                setFormData({ checkinTime: "" });
                fetchReservationDetail();
            }
        } catch (err) {
            if (err.response) {
                if (Number(err.response.data.code) === 5004) {
                    setError("Bạn chỉ có thể thay đổi giờ checkin trong vòng 2 tiếng kể từ khi đặt bàn");
                } else if (Number(err.response.data.code) === 5005) {
                    setError("Thời gian thay đổi không hợp lệ");
                } else {
                    setError(err.response.data.message || "Lỗi khi cập nhật giờ checkin");
                }
            } else {
                setError("Lỗi khi cập nhật giờ checkin");
            }
        } finally {
            setLoading(false);
            setFormData({ checkinTime: "" });
        }
    };

    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(() => {
            setError(null);
        }, 2500);
        return () => clearTimeout(timer);
    }, [error]);

    useEffect(() => {
        if (!success) return;
        const timer = setTimeout(() => setSuccess(null), 2500);
        return () => clearTimeout(timer);
    }, [success]);

    return (
        <div className="d-flex flex-column min-vh-100">
            <Header />
            <Container className="flex-grow-1 my-5">
                {loading && <SpinnerComp />}
                {error && <AlertComp variant="danger" lable={error} />}
                {success && <AlertComp variant="success" lable={success} />}
                
                {reservation && !loading && !error && (
                    <Row className="justify-content-center">
                        <Col lg={10}>
                            {/* Card thông tin chính */}
                            <Card className="shadow-lg border-0 rounded-4 overflow-hidden mb-4">
                                <Card.Header
                                    className="text-white d-flex justify-content-between align-items-center"
                                    style={{
                                        background: "linear-gradient(90deg, #b34411ff, #d44107ff)",
                                        borderBottom: "none"
                                    }}
                                >
                                    <h5 className="mb-0">
                                        <FaChair className="me-2" />
                                        {reservation.table.tableName}
                                    </h5>
                                   
                                </Card.Header>

                                <Card.Body className="p-4">
                                    <Row>
                                        <Col md={6}>
                                            <div className="mb-3 d-flex align-items-center">
                                                <FaChair className="me-2 text-secondary" size={20} />
                                                <strong>Sức chứa:</strong>&nbsp;{reservation.table.capacity} người
                                            </div>

                                            <div className="mb-3 d-flex align-items-center">
                                                <FaUser className="me-2 text-info" size={20} />
                                                <strong>Khách:</strong>&nbsp;{reservation.customer.fullName}
                                            </div>

                                            <div className="mb-3 d-flex align-items-center">
                                                <FaCalendarAlt className="me-2 text-primary" size={20} />
                                                <strong>Ngày đặt:</strong>&nbsp;{formatDateTime(reservation.bookingTime)}
                                            </div>
                                        </Col>
                                        
                                        <Col md={6}>
                                            <div className="mb-3 d-flex align-items-center">
                                                <FaClock className="me-2 text-success" size={20} />
                                                <strong>Check-in:</strong>&nbsp;{formatDateTime(reservation.checkinTime)}
                                            </div>

                                            {reservation.checkoutTime && (
                                                <div className="mb-3 d-flex align-items-center">
                                                    <FaClock className="me-2 text-danger" size={20} />
                                                    <strong>Check-out:</strong>&nbsp;{formatDateTime(reservation.checkoutTime)}
                                                </div>
                                            )}

                                            {reservation.note && (
                                                <div className="mb-3 d-flex align-items-start">
                                                    <FaStickyNote className="me-2 text-muted" size={20} />
                                                    <div>
                                                        <strong>Ghi chú:</strong>
                                                        <div className="fst-italic text-muted">{reservation.note}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>

                                    {/* Form thay đổi giờ check-in chỉ hiện khi status là BOOKED */}
                                    {reservation.status === "BOOKED" && (
                                        <>
                                            <hr />
                                            <div>
                                                <h6 className="fw-bold mb-3">
                                                    <FaClock className="me-2 text-warning" />
                                                    Thay đổi giờ check-in
                                                </h6>
                                                <Form className="d-flex gap-2 align-items-center flex-wrap">
                                                    <Form.Control
                                                        type="datetime-local"
                                                        value={formData.checkinTime}
                                                        name="checkinTime"
                                                        onChange={handleChange}
                                                        style={{ maxWidth: '250px' }}
                                                    />
                                                    <Button variant="success" onClick={handleUpdate}>
                                                        <FaCheck className="me-1" />Lưu
                                                    </Button>
                                                </Form>
                                            </div>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Card hóa đơn và món ăn */}
                            {reservation.bill && (
                                <Card className="shadow-lg border-0 rounded-4 overflow-hidden">
                                    <Card.Header 
                                        className="text-white d-flex justify-content-between align-items-center"
                                        style={{
                                            background: "linear-gradient(90deg, #b34411ff, #d44107ff)",
                                            borderBottom: "none"
                                        }}
                                    >
                                        <h5 className="mb-0">
                                            <FaReceipt className="me-2" />
                                            Hóa đơn #{reservation.bill.billId}
                                        </h5>
                                        {getBillStatusBadge(reservation.bill.status)}
                                    </Card.Header>

                                    <Card.Body className="p-0">
                                        {/* Thông tin hóa đơn */}
                                        <div className="p-4 border-bottom">
                                            <Row>
                                                <Col md={6}>
                                                    <div className="mb-2">
                                                        <strong>Ngày tạo hóa đơn:</strong> {formatDateTime(reservation.bill.createdAt)}
                                                    </div>
                                                    {reservation.bill.paymentTime && (
                                                        <div className="mb-2">
                                                            <strong>Thời gian thanh toán:</strong> {formatDateTime(reservation.bill.paymentTime)}
                                                        </div>
                                                    )}
                                                </Col>
                                                <Col md={6}>
                                                    <div className="mb-2">
                                                        <strong>Trạng thái đơn hàng:</strong> 
                                                        {reservation.bill.order.isPaid ? (
                                                            <Badge bg="success" className="ms-2">Đã thanh toán</Badge>
                                                        ) : (
                                                            <Badge bg="warning" text="dark" className="ms-2">Chưa thanh toán</Badge>
                                                        )}
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* Danh sách món ăn */}
                                        {/* <div className="p-4">
                                            <h6 className="fw-bold mb-3">
                                                Danh sách món đã order
                                            </h6>
                                            
                                            <div className="table-responsive">
                                                <Table className="table-hover">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>STT</th>
                                                            <th>Món ăn</th>
                                                            <th className="text-center">Số lượng</th>
                                                        
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {reservation.bill.order.items.map((item, index) => (
                                                            <tr key={item.orderItemId}>
                                                                <td>{index + 1}</td>
                                                                <td>
                                                                    <strong>Món #{item.orderItemId}</strong>
                                                                </td>
                                                                <td className="text-center">
                                                                    <Badge bg="primary">{item.quantity}</Badge>
                                                                </td>
                                                              
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        </div> */}

                                        {/* Thông tin thanh toán */}
                                        <div 
                                            className="p-4 text-white"
                                            style={{ 
                                                 background: "linear-gradient(90deg, #943509ff, #d44107ff)"
                                            }}
                                        >
                                            <Row>
                                                <Col md={8}>
                                                    <h6 className="fw-bold mb-3">
                                                     
                                                        Thông tin thanh toán
                                                    </h6>
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span>Tạm tính:</span>
                                                        <span>{formatPrice(reservation.bill.subTotal)}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <span>Giảm giá:</span>
                                                        <span className="text-success">
                                                            {reservation.bill.discountAmount > 0 ? 
                                                                `-${formatPrice(reservation.bill.discountAmount)}` : 
                                                                formatPrice(0)
                                                            }
                                                        </span>
                                                    </div>
                                                    <hr className="border-light" />
                                                    <div className="d-flex justify-content-between">
                                                        <strong className="h5">Tổng cộng:</strong>
                                                        <strong className="h5 text-warning">
                                                            {formatPrice(reservation.bill.totalAmount)}
                                                        </strong>
                                                    </div>
                                                </Col>
                                                <Col md={4} className="text-end">
                                                    <div className="mt-3">
                                                        <FaCreditCard size={40} className="text-warning mb-2" />
                                                        <div>
                                                            <small>Phương thức thanh toán</small>
                                                            <div className="fw-bold">Thanh toán tại quầy</div>
                                                        </div>
                                                    </div>
                                                </Col>
                                            </Row>
                                        </div>
                                    </Card.Body>
                                </Card>
                            )}

                            {/* Nút trở về */}
                            <div className="text-center mt-4">
                                <Button 
                                    variant="outline-primary" 
                                    size="lg"
                                    onClick={() => nav("/my-reservations")}
                                >
                                    ← Trở về danh sách đặt bàn
                                </Button>
                            </div>
                        </Col>
                    </Row>
                )}
            </Container>
            <Footer />
        </div>
    );
};

export default ReservationDetailPage;