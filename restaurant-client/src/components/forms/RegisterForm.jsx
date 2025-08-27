import React, { useRef, useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import SpinnerComp from "../common/SpinnerComp";
import Apis, { endpoints } from "../configs/Apis";

const RegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    dob: "",
    email: "",
    phone: "",
    address: "",
    username: "",
    password: "",
    confirm: "",
  });
  const avatar = useRef();
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    // Nếu form chưa hợp lệ -> dừng
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    // Kiểm tra password
    if (formData.password !== formData.confirm) {
      setError("Mật khẩu xác nhận không khớp");
      setValidated(true);
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      data.append("file", avatar.current.files[0] || null);

      let res = await Apis.post(endpoints["register"], data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.code === 200) {
        navigate("/login");
      }
    } catch (err) {
      setError(err.message);
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(null); 
  };

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="fullName">
            <Form.Label>Họ và tên</Form.Label>
            <Form.Control
              required
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
            />
            <Form.Control.Feedback type="invalid">
              Vui lòng nhập họ và tên.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="dob">
            <Form.Label>Ngày sinh</Form.Label>
            <Form.Control
              required
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleInputChange}
            />
            <Form.Control.Feedback type="invalid">
              Vui lòng chọn ngày sinh.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />
            <Form.Control.Feedback type="invalid">
              Vui lòng nhập email hợp lệ.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="phone">
            <Form.Label>Số điện thoại</Form.Label>
            <Form.Control
              required
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
            />
            <Form.Control.Feedback type="invalid">
              Vui lòng nhập số điện thoại.
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group className="mb-3" controlId="address">
            <Form.Label>Địa chỉ</Form.Label>
            <Form.Control
              required
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            />
            <Form.Control.Feedback type="invalid">
              Vui lòng nhập địa chỉ.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="username">
            <Form.Label>Tên đăng nhập</Form.Label>
            <Form.Control
              required
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
            />
            <Form.Control.Feedback type="invalid">
              Vui lòng nhập tên đăng nhập.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="password">
            <Form.Label>Mật khẩu</Form.Label>
            <Form.Control
              required
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              minLength={6}
            />
            <Form.Control.Feedback type="invalid">
              Mật khẩu phải tối thiểu 6 ký tự.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="confirm">
            <Form.Label>Xác nhận mật khẩu</Form.Label>
            <Form.Control
              required
              type="password"
              name="confirm"
              value={formData.confirm}
              onChange={handleInputChange}
              isInvalid={!!error}
            />
            <Form.Control.Feedback type="invalid">
              {error || "Vui lòng xác nhận mật khẩu."}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-4" controlId="avatar">
        <Form.Label>Ảnh đại diện</Form.Label>
        <Form.Control type="file" name="file" ref={avatar} />
      </Form.Group>

      <Button
        type="submit"
        className="w-100 fw-semibold"
        style={{
          background: "linear-gradient(45deg, #912910, #b33b1f)",
          borderColor: "#912910",
        }}
        disabled={loading}
      >
        {loading ? <SpinnerComp /> : "Đăng ký"}
      </Button>

      <div className="text-center mt-3">
        <span className="me-1">Đã có tài khoản?</span>
        <Button
          variant="link"
          className="p-0"
          style={{ color: "#912910", fontWeight: "500" }}
          disabled={loading}
          onClick={() => navigate("/login")}
        >
          Đăng nhập
        </Button>
      </div>
    </Form>
  );
};

export default RegisterForm;
