import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import backgroundImg from "../../assets/restaurant-bg.jpg";
import LoginForm from "../forms/LoginForm";

const LoginPage = () => {
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
      {/* Lớp overlay mờ */}
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
          <Col md={5}>
            <Card className="shadow-lg p-4 border-0 rounded-4">
              <h3 className="text-center fw-bold mb-4" style={{ color: "#912910" }}>
               Restaurant App
              </h3>
              <LoginForm />
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default LoginPage;
