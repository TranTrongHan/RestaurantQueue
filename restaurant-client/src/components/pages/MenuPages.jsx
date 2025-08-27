import { useContext, useEffect, useState } from "react";
import Apis, { authApis, endpoints } from "../configs/Apis";
import { Button, Card, Col, Container, Row, Nav, Badge, Modal } from "react-bootstrap";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import AlertComp from "../common/AlertComp";
import '../styles/MenuPages.css';
import { useCookies } from "react-cookie";
import SpinnerComp from "../common/SpinnerComp";
import { MyCartContext, MyUserContext } from "../configs/Context";
import { Link } from "react-router-dom";

const MenuPages = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [cateId, setCateId] = useState(1);
    const [user,] = useContext(MyUserContext);
    const formatPrice = (price) => {
        return price.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
    };

    const fetchMenuItems = async (categoryId) => {
        if (!categoryId) {
            console.warn("fetchMenuItems skipped, invalid categoryId:", categoryId);
            return;
        }
        try {
            const url = `${endpoints['menu_items']}?cateId=${categoryId}`;
            const res = await Apis.get(url);

            if (res.data.code === 200) {
                setMenuItems(res.data.result);
            }
        } catch (error) {
            if (error.response) {
                console.error("Backend error:", error.response.data);
            } else {
                console.error("Axios error:", error.message);
            }
        }
    };

    const fetchCategories = async () => {
        try {
            const url = `${endpoints['categories']}`;
            const res = await Apis.get(url);
            if (res.data.code === 200) {
                const fetchedCategories = res.data.result;
                setCategories(fetchedCategories);
                if (fetchedCategories.length > 0) {
                    setCateId(fetchedCategories[0].categoryId);
                }
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        if (cateId !== null) {
            fetchMenuItems(cateId);
        }
    }, [cateId]);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);
    const [cookies, setCookies] = useCookies(["cart"]);
    const [cart, dispatchCart] = useContext(MyCartContext);
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleAddFoodToCart = async (item) => {
        if (!user) {
            setShow(true);
            return;
        }
        console.log("name:", item.name);
        dispatchCart({
            type: "add",
            payload: { name: item.name, menuItemId: item.menuItemId, quantity: 1, price: item.price, image: item.image }
        });

        try {
            setLoading(true);
            let payload = {
                "items": [
                    {
                        "menuItemId": item.menuItemId,
                        "quantity": 1
                    }
                ]
            }
            const url = `${import.meta.env.VITE_API_BASE_URL}${endpoints['cart']}/add`;
            console.log("fetching url:", url);
            console.log("token : ", cookies.token || null);
            console.log("payload :", payload);
            let res = await authApis(cookies.token).post(url, payload);
            if (res.status === 200) {
                const updatedCart = res.data.result.items;
                if(updatedCart){
                      console.log("has results")
                }
                  
                updatedCart.map(cartItem => {
                    if (cartItem.menuItemId == item.menuItemId) {
                        console.log("updateId case");
                        console.log("cartItemId ", Number(cartItem.cartItemId))
                        dispatchCart({
                            type: "updateId",
                            payload: {
                                menuItemId: cartItem.menuItemId,
                                cartItemId: cartItem.cartItemId
                            }
                        })
                    }
                })

            }
        } catch (error) {
            setError("Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        console.log("🛒 Cart state updated:", cart);
    },[cart])

    useEffect(() => {
        if (success) {
            console.log(success);
            const timer = setTimeout(() => {
                setSuccess(null);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [error]);

    return (
        <>
            <div
                className="d-flex flex-column min-vh-100"
                style={{
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    minHeight: '100vh'
                }}
            >
                <Header />
                <Container className="flex-grow-1" style={{ marginTop: '20px', position: 'relative', zIndex: 3 }}>
                    {/* Categories & Cart Section */}
                    <div style={{
                        background: 'white',
                        borderRadius: '20px',
                        padding: '25px',
                        marginBottom: '30px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(145, 41, 16, 0.1)'
                    }}>
                        <Row style={{ alignItems: 'center' }}>
                            <Col md={8}>
                                <h5 style={{
                                    marginBottom: '15px',
                                    color: '#912910',
                                    fontWeight: '700'
                                }}>
                                    Danh mục món ăn
                                </h5>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '10px'
                                }}>
                                    {categories.map(category => (
                                        <button
                                            key={category.categoryId}
                                            className={`${cateId === category.categoryId ? 'active' : ''}`}
                                            onClick={() => {
                                                setCateId(category.categoryId);
                                                fetchMenuItems(category.categoryId);
                                            }}
                                            style={{
                                                padding: '10px 20px',
                                                borderRadius: '25px',
                                                border: '2px solid #912910',
                                                background: cateId === category.categoryId
                                                    ? 'linear-gradient(135deg, #912910 0%, #b8401f 100%)'
                                                    : 'transparent',
                                                color: cateId === category.categoryId ? 'white' : '#912910',
                                                fontWeight: '600',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                outline: 'none',
                                                boxShadow: cateId === category.categoryId
                                                    ? '0 4px 15px rgba(145, 41, 16, 0.3)'
                                                    : '0 2px 5px rgba(0,0,0,0.1)'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (cateId !== category.categoryId) {
                                                    e.target.style.background = 'rgba(145, 41, 16, 0.1)';
                                                    e.target.style.transform = 'translateY(-2px)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (cateId !== category.categoryId) {
                                                    e.target.style.background = 'transparent';
                                                    e.target.style.transform = 'translateY(0)';
                                                }
                                            }}
                                        >
                                            {category.name}
                                        </button>
                                    ))}
                                </div>
                            </Col>
                            {user?.role === "CUSTOMER" && <Col md={4} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Link
                                    to="/cart"
                                    className="position-relative"
                                    style={{
                                        textDecoration: 'none',
                                        border: '2px solid #912910',
                                        borderRadius: '25px',
                                        padding: '12px 25px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        transition: 'all 0.3s ease',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        minWidth: '160px',
                                        justifyContent: 'center',
                                        color: '#912910',
                                        backgroundColor: 'transparent',
                                        boxShadow: '0 4px 15px rgba(145, 41, 16, 0.2)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#912910';
                                        e.currentTarget.style.color = 'white';
                                        e.currentTarget.style.transform = 'translateY(-3px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(145, 41, 16, 0.4)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#912910';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(145, 41, 16, 0.2)';
                                    }}
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        fill="currentColor"
                                        viewBox="0 0 16 16"
                                        style={{ flexShrink: 0 }}
                                    >
                                        <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                                    </svg>
                                    <span>Giỏ hàng</span>
                                    {cart.reduce((sum, i) => sum + i.quantity, null) && (
                                        <Badge
                                            bg="danger"
                                            pill
                                            className="position-absolute"
                                            style={{
                                                top: '-8px',
                                                right: '-8px',
                                                fontSize: '11px',
                                                minWidth: '22px',
                                                height: '22px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '2px solid white',
                                                boxShadow: '0 2px 8px rgba(220, 53, 69, 0.4)',
                                                background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                                            }}
                                        >
                                            {cart.length > 99 ? '99+' : cart.reduce((sum, i) => sum + i.quantity, null)}
                                        </Badge>
                                    )}
                                </Link>
                            </Col>}

                        </Row>
                    </div>

                    {/* Alerts */}
                    {/* {error && <AlertComp variant="danger" lable={error} />}
                    {success && <AlertComp variant="success" lable={success} />} */}

                    {/* Menu Items Grid */}
                    <Row>
                        {menuItems.length > 0 ? (
                            menuItems.map(item => (
                                <Col md={4} className="mb-4" key={item.menuItemId}>
                                    <Card style={{
                                        border: 'none',
                                        borderRadius: '20px',
                                        overflow: 'hidden',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                        transition: 'all 0.3s ease',
                                        background: 'white',
                                        height: '100%'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-10px)';
                                            e.currentTarget.style.boxShadow = '0 20px 40px rgba(145, 41, 16, 0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                                        }}
                                    >
                                        <div style={{ position: 'relative', overflow: 'hidden' }}>
                                            <Card.Img
                                                variant="top"
                                                src={item.image}
                                                alt={item.name}
                                                style={{
                                                    height: '250px',
                                                    objectFit: 'cover',
                                                    transition: 'transform 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.transform = 'scale(1.05)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.transform = 'scale(1)';
                                                }}
                                            />

                                        </div>

                                        <Card.Body style={{
                                            padding: '25px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            minHeight: '180px'
                                        }}>
                                            <div>
                                                <Card.Title style={{
                                                    fontSize: '1.4rem',
                                                    fontWeight: '700',
                                                    color: '#333',
                                                    marginBottom: '15px',
                                                    textAlign: 'center',
                                                    lineHeight: '1.3'
                                                }}>
                                                    {item.name}
                                                </Card.Title>

                                                <div style={{
                                                    textAlign: 'center',
                                                    marginBottom: '20px'
                                                }}>
                                                    <span style={{
                                                        fontSize: '1.3rem',
                                                        fontWeight: '800',
                                                        color: '#912910',
                                                        background: 'linear-gradient(135deg, #912910 0%, #b8401f 100%)',
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent',
                                                        padding: '5px 15px',
                                                        borderRadius: '15px',
                                                        border: '2px solid rgba(145, 41, 16, 0.2)',
                                                        display: 'inline-block'
                                                    }}>
                                                        {formatPrice(item.price)}
                                                    </span>
                                                </div>
                                            </div>

                                            {(user === null || user.role === "CUSTOMER") && <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                <Button
                                                    onClick={() => handleAddFoodToCart(item)}
                                                    disabled={loading}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #912910 0%, #b8401f 100%)',
                                                        border: 'none',
                                                        borderRadius: '25px',
                                                        padding: '12px 25px',
                                                        fontWeight: '600',
                                                        fontSize: '14px',
                                                        width: '100%',
                                                        boxShadow: '0 4px 15px rgba(145, 41, 16, 0.3)',
                                                        transition: 'all 0.3s ease',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.transform = 'translateY(-2px)';
                                                        e.target.style.boxShadow = '0 6px 20px rgba(145, 41, 16, 0.5)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.transform = 'translateY(0)';
                                                        e.target.style.boxShadow = '0 4px 15px rgba(145, 41, 16, 0.3)';
                                                    }}
                                                >
                                                    {loading ? (
                                                        <SpinnerComp />
                                                    ) : (
                                                        <>

                                                            <span>Thêm vào giỏ</span>
                                                        </>
                                                    )}
                                                </Button>
                                            </div>}

                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))
                        ) : (
                            <div className="text-center my-5 w-100">
                                <div style={{
                                    background: 'white',
                                    borderRadius: '20px',
                                    padding: '60px 40px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                    maxWidth: '600px',
                                    margin: '0 auto'
                                }}>

                                    <h3 style={{ color: '#666', marginBottom: '15px' }}>
                                        Không có món ăn trong danh mục này
                                    </h3>
                                    <p style={{ color: '#999' }}>
                                        Hãy thử chọn danh mục khác để xem thêm món ăn ngon!
                                    </p>
                                </div>
                            </div>
                        )}
                    </Row>
                    <Modal show={show} onHide={handleClose}>
                        <Modal.Header closeButton>
                            <Modal.Title>Yêu cầu đăng nhập</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            Vui lòng{" "}
                            <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}>
                                đăng nhập
                            </Link>{" "}
                            để thực hiện đặt món
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleClose}>
                                Đóng
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </Container>
                <Footer />
            </div>
        </>
    );
}

export default MenuPages;