import { useEffect, useState } from "react";
import { authApis, endpoints } from "../configs/Apis";
import { useCookies } from "react-cookie";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { Container, Card, Row, Col, Spinner, Alert, Form, Button } from "react-bootstrap";
import moment from 'moment';
import AlertComp from "../common/AlertComp";
import SpinnerComp from "../common/SpinnerComp";

const ReservationsPages = () => {
    const [reservations, setReservations] = useState([]);
    const [cookies,] = useCookies(["token"]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [loadingBtn, setLoadingBtn] = useState(false);
    const [sucess, setSucess] = useState(null);
    const fetchReservations = async () => {
        try {
            setLoading(true);
            let url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['booking']}`;
            if (search) {
                console.log("has search");
                url = `${url}?customer=${search}`;
            }
            console.log("fetching url: ", url);
            let res = await authApis(cookies.token).get(url);
            if (res.status === 200) {
                setReservations(res.data.result);
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
        if (search) {
            let timer = setTimeout(() => {
                fetchReservations();
                return () => clearTimeout(timer);
            }, 2000)
        }
        fetchReservations();
    }, []);

    const formatTime = (time) => {
        return moment(time).format("HH:mm:ss DD/MM/YYYY");
    };
    const handleChange = (e) => {

        setSearch(e.target.value);
        console.log("value: ", e.target.value);
    }
    const handleCheckin = async (reservationId) => {
        try {
            setLoadingBtn(true);
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['booking']}/${reservationId}`;
            console.log("posting url", url);
            let res = await authApis(cookies.token).post(url);
            if (res.status === 200) {
                setSucess("Checkin thành công");
                fetchReservations();
                const session_token = res.data.result.sessionToken;
                const { customerJwt, sessionId } = res.data.result;
                if (session_token) {
                    const session_url = `${import.meta.env.VITE_CONTEXT_PATH}/order_session?token=${session_token}&sessionId=${sessionId}`;
                    console.log("sessionPageUrl: ", session_url);
                    const newWindow = window.open(session_url, "_blank");
                    if (newWindow) {
                        newWindow.onload = () => {
                            newWindow.sessionStorage.setItem("customer_jwt", customerJwt);
                            newWindow.sessionStorage.setItem("session_id", sessionId);
                        };
                    }
                }

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
            setLoadingBtn(false);
        }
    }
    useEffect(() => {
        if (sucess) {
            const timer = setTimeout(() => {
                setSucess(null);
                return () => clearTimeout(timer);
            }, 2000)

        }
    }, [sucess])

    const statusStyle = (status) => {
        switch (status) {
            case 'BOOKED':
                return {
                    color: '#ffffff',
                    backgroundColor: '#11b139ff',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                };
            default:
                return {
                    color: '#ffffff',
                    backgroundColor: '#757575',
                    padding: '6px 12px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                };
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e9f0 100%)'
        }}>
            <Header />
            <Container style={{
                flex: 1,
                padding: '40px 20px',
                maxWidth: '1400px',
                marginTop: '20px',
                marginBottom: '40px'
            }}>
                <Form style={{
                    marginBottom: '30px',
                    maxWidth: '600px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                }}>
                    <Form.Group controlId="searchBar">
                        <Form.Control
                            type="text"
                            placeholder="Tìm kiếm theo tên khách hàng hoặc tên bàn..."
                            value={search}
                            onChange={handleChange}
                            style={{
                                padding: '12px 20px',
                                fontSize: '1rem',
                                borderRadius: '25px',
                                border: '1px solid #e0e0e0',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                backgroundColor: '#ffffff'
                            }}
                            onFocus={(e) => e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                            onBlur={(e) => e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'}
                        />
                    </Form.Group>
                </Form>
                {loading && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '15px',
                        padding: '20px',
                        backgroundColor: '#ffffff',
                        borderRadius: '15px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}>
                        <Spinner animation="border" style={{
                            color: '#d32f2f',
                            width: '3rem',
                            height: '3rem'
                        }} />
                        <p style={{
                            margin: 0,
                            color: '#333333',
                            fontSize: '1.1rem',
                            fontWeight: '500'
                        }}>
                            Đang tải dữ liệu...
                        </p>
                    </div>
                )}

                {error && (
                    <Alert variant="danger" style={{
                        textAlign: 'center',
                        padding: '20px',
                        borderRadius: '15px',
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        fontWeight: '500',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        marginBottom: '30px'
                    }}>
                        {error}
                    </Alert>
                )}
                {sucess && <AlertComp variant="success" lable={sucess} />}
                {!loading && !error && reservations.length === 0 && (
                    <Alert variant="info" style={{
                        textAlign: 'center',
                        padding: '20px',
                        borderRadius: '15px',
                        backgroundColor: '#e3f2fd',
                        color: '#1565c0',
                        fontWeight: '500',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        marginBottom: '30px'
                    }}>
                        Hiện không có đơn đặt bàn nào.
                    </Alert>
                )}

                <Row>
                    {reservations.map(res => (
                        <Col xs={2} md={4} lg={4} key={res.reservationId} style={{ marginTop: 10 }}>
                            <Card style={{
                                height: '100%',
                                borderRadius: '15px',
                                border: 'none',
                                backgroundColor: '#ffffff',
                                boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                                overflow: 'hidden',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)';
                                }}>
                                <Card.Header style={{
                                    backgroundColor: '#d32f2f',
                                    color: '#ffffff',
                                    padding: '15px 20px',
                                    borderBottom: 'none'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <h5 style={{
                                            margin: 0,
                                            fontSize: '1.3rem',
                                            fontWeight: '600',
                                            letterSpacing: '0.5px'
                                        }}>
                                            {res.tableResponse.tableName}
                                        </h5>
                                        <span style={statusStyle(res.status)}>
                                            {res.status}
                                        </span>
                                    </div>
                                </Card.Header>
                                <Card.Body style={{
                                    padding: '20px',
                                    backgroundColor: '#fafafa'
                                }}>
                                    <p style={{
                                        marginBottom: '12px',
                                        fontSize: '1rem',
                                        color: '#333333',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <strong style={{ color: '#d32f2f', fontWeight: '600' }}>Khách hàng:</strong>
                                        {res.customerResponse.fullName}
                                    </p>
                                    <p style={{
                                        marginBottom: '12px',
                                        fontSize: '1rem',
                                        color: '#333333',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <strong style={{ color: '#d32f2f', fontWeight: '600' }}>Thời gian:</strong>
                                        {formatTime(res.checkinTime)}
                                    </p>
                                    <p style={{
                                        marginBottom: '12px',
                                        fontSize: '1rem',
                                        color: '#333333',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <strong style={{ color: '#d32f2f', fontWeight: '600' }}>Số người:</strong>
                                        {res.tableResponse.capacity}
                                    </p>
                                    <hr style={{
                                        borderTop: '1px solid #e0e0e0',
                                        margin: '15px 0'
                                    }} />
                                    <p style={{
                                        marginBottom: '8px',
                                        fontSize: '0.95rem',
                                        color: '#555555'
                                    }}>
                                        <strong style={{ color: '#333333' }}>Email:</strong> {res.customerResponse.email}
                                    </p>
                                    <p style={{
                                        marginBottom: '8px',
                                        fontSize: '0.95rem',
                                        color: '#555555'
                                    }}>
                                        <strong style={{ color: '#333333' }}>Số điện thoại:</strong> {res.customerResponse.phone}
                                    </p>
                                    {res.note && (
                                        <p style={{
                                            marginTop: '12px',
                                            fontSize: '0.95rem',
                                            color: '#666666',
                                            backgroundColor: '#f5f5f5',
                                            padding: '10px',
                                            borderRadius: '8px'
                                        }}>
                                            <strong style={{ color: '#333333' }}>Ghi chú:</strong> {res.note}
                                        </p>
                                    )}
                                </Card.Body>
                                <Card.Footer style={{
                                    backgroundColor: '#ffffff',
                                    borderTop: '1px solid #e0e0e0',
                                    padding: '15px 20px',
                                    display: 'flex',
                                    justifyContent: 'flex-end'
                                }}>
                                    <Button
                                        style={{
                                            backgroundColor: '#d32f2f',
                                            border: 'none',
                                            borderRadius: '25px',
                                            padding: '10px 20px',
                                            fontSize: '1rem',
                                            fontWeight: '500',
                                            color: '#ffffff',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                        }}
                                        disabled={loadingBtn || res.status === "CHECKEDOUT"}
                                        onClick={() => handleCheckin(res.reservationId)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#b71c1c';
                                            e.currentTarget.style.transform = 'scale(1.05)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#d32f2f';
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                        }}
                                    >
                                        {loadingBtn && <SpinnerComp />} Checkin
                                    </Button>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>

            </Container>
            <Footer />
        </div>
    );
}

export default ReservationsPages;