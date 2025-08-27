import { Container, Card, Row, Col, Badge } from "react-bootstrap";
import Footer from "../layout/Footer";
import Header from "../layout/Header";
import { useEffect, useState } from "react";
import SpinnerComp from "../common/SpinnerComp";
import { authApis, endpoints } from "../configs/Apis";
import { useCookies } from "react-cookie";
import AlertComp from "../common/AlertComp";
import { FaChair, FaCalendarAlt, FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const MyReservationPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cookies] = useCookies(["token"]);
  const nav = useNavigate();
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints["booking"]}/my`;
      let res = await authApis(cookies.token).get(url);
      if (res.data.code === 200) {
        setReservations(res.data.result);
        setError(null);
      } else {
        setError("Không tìm thấy đặt bàn nào.");
      }
    } catch (error) {
      setError("Lỗi khi tải dữ liệu đặt bàn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "BOOKED":
        return <Badge bg="success">Đã đặt</Badge>;
      case "CANCELED":
        return <Badge bg="danger">Đã hủy</Badge>;
      case "CHECKED_IN":
        return <Badge bg="primary">Đã nhận bàn</Badge>;
      case "CHECKEDOUT":
      return <Badge bg="primary">Đã thanh toán</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <Container className="flex-grow-1 my-5">
        {loading && <SpinnerComp />}
        {error && <AlertComp variant={"danger"} lable={error} />}

        {reservations.length > 0 ? (
          <Row className="g-4">
            {reservations.map((res) => (
              <Col md={6} lg={4} key={res.reservationId}>
                <Card
                  className="shadow-sm h-100 border-0 rounded-4"
                  style={{ cursor: "pointer" }}
                  onClick={() => nav(`/my-reservations/${res.reservationId}`)}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <Card.Title className="mb-0 fw-bold">
                        {res.tableResponse.tableName}
                      </Card.Title>
                      {getStatusBadge(res.status)}
                    </div>

                    <div className="text-muted small mb-3">
                      Sức chứa: {res.tableResponse.capacity} người
                    </div>

                    <div className="mb-2">
                      <FaCalendarAlt className="me-2 text-primary" />
                      <strong>Ngày đặt:</strong> {res.bookingTime}
                    </div>

                    <div className="mb-2">
                      <FaClock className="me-2 text-warning" />
                      <strong>Giờ check-in:</strong> {res.checkinTime}
                    </div>

                    {res.note && (
                      <div className="mt-2 text-muted fst-italic">
                        Ghi chú: {res.note}
                      </div>
                    )}
                  </Card.Body>
                  <Card.Footer className="bg-light border-0 text-end">
                    <small className="text-muted">
                      Khách: {res.customerResponse.fullName}
                    </small>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div className="text-center my-5 w-100">
            <AlertComp variant="dark" lable="Không có đơn đặt bàn nào." />
          </div>
        )}
      </Container>
      <Footer />
    </div>
  );
};

export default MyReservationPage;
