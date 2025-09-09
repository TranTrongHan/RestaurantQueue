import { useContext, useEffect, useState } from "react";
import { Card, Form, Button, InputGroup, Modal } from "react-bootstrap";
import { authApis, endpoints } from "../configs/Apis";
import { useCookies } from "react-cookie";
import SpinnerComp from "../common/SpinnerComp";
import dayjs from "dayjs";
import { MyUserContext } from "../configs/Context";
import { Link } from "react-router-dom";
import { FaUserFriends, FaCalendarAlt, FaStickyNote } from "react-icons/fa";

const TableBookingForm = () => {
  const [validated, setValidated] = useState(false);
  const [formData, setFormData] = useState({
    checkinTime: "",
    capacity: "",
    note: ""
  });
  const [user] = useContext(MyUserContext);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const [cookies] = useCookies(["token"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!user) {
      setShow(true);
      return;
    }

    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    } else {
      try {
        setLoading(true);
        const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['booking']}/add`;
        const payload = {
          checkinTime: dayjs(formData.checkinTime).format("YYYY-MM-DD HH:mm:ss"),
          capacity: Number(formData.capacity),
          note: formData.note || ""
        };
        let res = await authApis(cookies.token).post(url, payload);
        if (res.data.code === 200) {
          setSuccess("Đặt bàn thành công!");
          setError(null);
          setFormData({
            checkinTime: "",
            capacity: "",
            note: ""
          });
          setValidated(false);
        }
      } catch (err) {
        if (err.response) {
          if (err.response.data.code === 4002) {
            setError("Tạm thời hết bàn. Vui lòng thử lại sau.");
          } else if (err.response.data.code === 5002) {
            setError("Bạn đã có đơn đặt bàn trước đó.");
          } else {
            setError(err.response.data.message);
          }
        } else {
          setError("Có lỗi xảy ra. Vui lòng thử lại.");
        }
      } finally {
        setLoading(false);
      }
    }
    
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [success, error]);

  return (
    <>
      <Card className="p-4 shadow-lg mx-auto" style={{ maxWidth: "500px" }}>
        <h3 className="text-center mb-4">Đặt bàn nhà hàng</h3>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Thời gian nhận bàn</Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <FaCalendarAlt />
              </InputGroup.Text>
              <Form.Control
                type="datetime-local"
                name="checkinTime"
                value={formData.checkinTime}
                onChange={handleInputChange}
                required
              />
              <Form.Control.Feedback type="invalid">
                Vui lòng chọn thời gian nhận bàn.
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Số lượng khách</Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <FaUserFriends />
              </InputGroup.Text>
              <Form.Select
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                required
              >
                <option value="">-- Chọn số lượng --</option>
                <option value="2">2 khách</option>
                <option value="4">4 khách</option>
                <option value="6">6 khách</option>
                <option value="8">8 khách</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                Vui lòng chọn số lượng khách.
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Ghi chú (tuỳ chọn)</Form.Label>
            <InputGroup>
              <InputGroup.Text>
                <FaStickyNote />
              </InputGroup.Text>
              <Form.Control
                as="textarea"
                rows={3}
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                placeholder="Ví dụ: Có trẻ em, dị ứng hải sản..."
              />
            </InputGroup>
          </Form.Group>

          <div className="d-grid">
            <Button
              type="submit"
              className="fw-semibold"
              style={{
                background: "linear-gradient(45deg, #912910, #b33b1f)",
                borderColor: "#912910",
                padding: "10px"
              }}
              disabled={loading}
            >
              {loading ? <SpinnerComp /> : "Đặt bàn"}
            </Button>
          </div>
        </Form>
      </Card>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Yêu cầu đăng nhập</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Vui lòng{" "}
          <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
            đăng nhập
          </Link>{" "}
          để thực hiện đặt bàn
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TableBookingForm;
