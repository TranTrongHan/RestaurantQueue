import React, { useContext, useState } from "react";
import { Form, Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import SpinnerComp from "../common/SpinnerComp";
import Apis, { authApis, endpoints } from "../configs/Apis";
import { MyUserContext } from "../configs/Context";
import { useCookies } from "react-cookie";

const LoginForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [, dispatch] = useContext(MyUserContext);
  const [cookie, setCookie] = useCookies(["token"]);
  const nav = useNavigate();
  const [error, setError] = useState(null);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectPath = params.get("redirect") || "/";
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  
  const [validated, setValidated] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    // Nếu form không hợp lệ, dừng lại và hiện lỗi
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }

    try {
      setLoading(true);
      
      let res = await Apis.post(endpoints["login"], formData);

      if (res.data.code === 200) {
        setCookie("token", res.data.result.token, { path: "/" });

        let user = await authApis(res.data.result.token).get(
          endpoints["profile"]
        );
        dispatch({
          type: "login",
          payload: user.data.result,
        });
        nav(redirectPath, {replace: true});
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Đăng nhập không thành công. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <Form noValidate validated={validated} onSubmit={handleSubmit}>
      <Form.Group className="mb-3" controlId="formEmail">
        <Form.Label>Tên đăng nhập</Form.Label>
        <Form.Control
          required
          name="username"
          value={formData.username}
          type="text"
          placeholder="Nhập tên đăng nhập"
          onChange={handleInputChange}
        />
        <Form.Control.Feedback type="invalid">
          Vui lòng nhập tên đăng nhập
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-4" controlId="formPassword">
        <Form.Label>Mật khẩu</Form.Label>
        <Form.Control
          required
          name="password"
          value={formData.password}
          type="password"
          placeholder="Nhập mật khẩu"
          onChange={handleInputChange}
        />
        <Form.Control.Feedback type="invalid">
          Vui lòng nhập mật khẩu
        </Form.Control.Feedback>
      </Form.Group>

      {error && <p className="text-danger">{error}</p>}

      <Button
        type="submit"
        className="w-100 fw-semibold"
        disabled={loading}
        style={{
          background: "linear-gradient(45deg, #912910, #b33b1f)",
          borderColor: "#912910",
        }}
      >
        {loading ? <SpinnerComp /> : "Đăng nhập"}
      </Button>

      <div className="text-center mt-3">
        <span className="me-1">Chưa có tài khoản?</span>
        <Button
          variant="link"
          className="p-0"
          style={{ color: "#912910", fontWeight: "500" }}
          onClick={() => navigate("/register")}
        >
          Đăng ký
        </Button>
      </div>
      <div className="text-center mt-3">
        <Button
          variant="link"
          className="p-0"
          style={{ color: "#912910", fontWeight: "500" }}
          onClick={() => window.location.href = "http://localhost:8080/restaurantserver/oauth2/authorization/google"}
        >
          Đăng nhập với Google
        </Button>
      </div>
      
    </Form>
  );
};

export default LoginForm;
