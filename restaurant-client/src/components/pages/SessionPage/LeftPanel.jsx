import { Button, Card, Col, Row } from "react-bootstrap";

const LeftPanel = ({cateId,setCateId,activeCategory,setActiveCategory,categories,menuItems,formatPrice,addToCart}) => {
    const primaryColor = '#912910';
    const lightColor = '#f8f9fa';
    const whiteColor = '#ffffff';
    return (
        <>
            <Col lg={8} md={7} style={{ height: '100%' }}>
                <Card style={{
                    height: '100%',
                    border: 'none',
                    boxShadow: '0 2px 15px rgba(0,0,0,0.08)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Category Navigation */}
                    <Card.Header style={{
                        backgroundColor: whiteColor,
                        borderBottom: `2px solid ${lightColor}`,
                        padding: '20px'
                    }}>
                        <Row className="g-2">
                            {categories.map(category => (
                                <Col key={category.categoryId} xs="auto">
                                    <Button
                                        variant={cateId === category.categoryId ? 'primary' : 'outline-primary'}
                                        onClick={() => {
                                            setCateId(category.categoryId);
                                            setActiveCategory(category.categoryId);
                                        }}
                                        style={{
                                            backgroundColor: activeCategory === category.categoryId ? primaryColor : 'transparent',
                                            borderColor: primaryColor,
                                            color: activeCategory === category.categoryId ? whiteColor : primaryColor,
                                            minWidth: '130px',
                                            padding: '10px 15px',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            border: `2px solid ${primaryColor}`
                                        }}
                                    >
                                        <span>{category.name}</span>
                                    </Button>
                                </Col>
                            ))}
                        </Row>
                    </Card.Header>

                    {/* Menu Items */}
                    <Card.Body style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '20px'
                    }}>
                        <Row className="g-3">
                            {menuItems.map(item => (
                                <Col key={item.menuItemId} lg={4} md={6}>
                                    <Card style={{
                                        height: '100%',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        backgroundColor: whiteColor
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(145,41,16,0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                        }}>
                                        <Card.Body style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            padding: '20px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ marginBottom: '15px' }}>
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
                                            <Card.Title style={{
                                                fontWeight: 'bold',
                                                marginBottom: '10px',
                                                color: primaryColor,
                                                fontSize: '1.1rem'
                                            }}>
                                                {item.name}
                                            </Card.Title>
                                            <div>
                                                <div style={{
                                                    fontSize: '1.3rem',
                                                    color: primaryColor,
                                                    fontWeight: 'bold',
                                                    marginBottom: '15px'
                                                }}>
                                                    {formatPrice(item.price)}
                                                </div>
                                                <Button
                                                    onClick={() => addToCart(item)}
                                                    style={{
                                                        backgroundColor: primaryColor,
                                                        borderColor: primaryColor,
                                                        width: '100%',
                                                        fontWeight: '600',
                                                        padding: '10px',
                                                        fontSize: '0.95rem'
                                                    }}
                                                >
                                                    Thêm vào đơn
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Card.Body>
                </Card>
            </Col>
        </>
    )
}

export default LeftPanel;