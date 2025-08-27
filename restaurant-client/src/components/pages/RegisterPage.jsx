import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";

import backgroundImg from "../../assets/restaurant-bg.jpg";
import RegisterForm from "../forms/RegisterForm";

const RegisterPage = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(6px)",
        }}
      />

      <Container style={{ position: "relative", zIndex: 2 }}>
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="shadow-lg p-4 border-0 rounded-4">
              <h3 className="text-center fw-bold mb-4" style={{ color: "#912910" }}>
                Đăng ký
              </h3>
              <RegisterForm />
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default RegisterPage;
