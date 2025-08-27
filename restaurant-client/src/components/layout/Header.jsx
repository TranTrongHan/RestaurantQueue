import React, { useContext } from 'react';
import { Container, Navbar, Nav, Button, Dropdown, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { MyUserContext } from '../configs/Context';
import { useCookies } from 'react-cookie';

const Header = () => {
  const [user, dispatch] = useContext(MyUserContext);
  const [cookie,,removeCookie] = useCookies(["token"]);
  const handleLogout = () => {
    removeCookie("token",{path: "/"});
    dispatch({type: "logout"});
    console.log("cookie: ", cookie.token || null);
  }
  return (
    <Navbar expand="lg" style={{ backgroundColor: '#912910' }} variant="dark">
      <Container>
        <Navbar.Brand href="/" style={{ fontWeight: 'bold' }}>
          Restaurant App
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            <Link to="/" className="nav-link">Trang Chủ</Link>
            <Link to="/menu" className="nav-link">Thực đơn</Link>
            {user?.role === "STAFF" && (
              <Link to="/reservations" className="nav-link">Danh sách bàn</Link>
            )}
             {user?.role === "STAFF" && (
              <Link to="/kitchen" className="nav-link">Đơn bếp</Link>
            )}
            {user?.role === "CUSTOMER" && <Link to="/booking" className="nav-link">Đặt bàn</Link>}
            <Link to="/about" className="nav-link">Giới thiệu</Link>
          </Nav>
          {user ? (
            <Dropdown align="end">
              <Dropdown.Toggle
                id="dropdown-user"
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "999px",
                  padding: "4px 10px",
                  fontWeight: 500,
                  backgroundColor: "#fff",
                  border: "1px solid #e5e5e5",
                  color: "#912910",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
              >
                <Image
                  src={user.image}
                  roundedCircle
                  width={28}
                  height={28}
                  style={{
                    marginRight: 8,
                    objectFit: "cover",
                    background: "#f0f0f0",
                  }}
                  alt="avatar"
                />
                <span style={{ fontSize: "0.9rem" }}>Chào {user.fullName}</span>
              </Dropdown.Toggle>

              <Dropdown.Menu
                style={{
                  width: 200,
                  borderRadius: 10,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                  padding: "6px 0",
                  border: "1px solid #f0f0f0",
                  marginTop: 8, // tạo khoảng cách giữa toggle và menu
                }}
              >


                <Dropdown.Item
                  as={Link} to={"/profile"}
                  style={{
                    fontWeight: 500,
                    padding: "10px 16px",
                    fontSize: "0.95rem",
                    color: "#912910",
                    transition: "background 0.2s",
                  }}
                >
                  Thông tin cá nhân
                </Dropdown.Item>
                {user?.role === "CUSTOMER" && <Dropdown.Item
                  as={Link} to={"/my-reservations"}
                  style={{
                    fontWeight: 500,
                    padding: "10px 16px",
                    fontSize: "0.95rem",
                    color: "#912910",
                    transition: "background 0.2s",
                  }}

                >
                  Thông tin đặt bàn
                </Dropdown.Item>
                }
                {user?.role === "CUSTOMER" && <Dropdown.Item
                  as={Link} to={"/online_order"}
                  style={{
                    fontWeight: 500,
                    padding: "10px 16px",
                    fontSize: "0.95rem",
                    color: "#912910",
                    transition: "background 0.2s",
                  }}
                >
                  Thông tin món đã đặt
                </Dropdown.Item>}

                <Dropdown.Item
                  onClick={handleLogout}
                  style={{
                    fontWeight: 500,
                    padding: "10px 16px",
                    fontSize: "0.95rem",
                    color: "#912910",
                    transition: "background 0.2s",
                  }}
                >
                  Đăng xuất
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>


          ) : (<div className="d-flex gap-2">
            <Button variant="outline-light" href="/login">Đăng nhập</Button>
            <Button variant="light" href="/register" style={{ color: '#912910' }}>
              Đăng ký
            </Button>
          </div>)}

        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
