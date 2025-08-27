import { Button, ButtonGroup, Card } from "react-bootstrap";

const CartContent = ({ cart, formatPrice, removeFromCart, addToCart }) => {
    const primaryColor = '#912910';
    const lightColor = '#f8f9fa';
    return (
        <>
            {cart.length === 0 ? (
            <div style={{
                textAlign: 'center',
                color: '#6c757d',
                padding: '60px 20px'
            }}>

                <p style={{ fontSize: '1.1rem' }}>Chưa có món nào được chọn</p>
            </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cart.map(item => (
                    <Card key={item.menuItemId} style={{
                        backgroundColor: lightColor,
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                        <Card.Body style={{ padding: '15px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '12px'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <h6 style={{
                                        margin: '0 0 5px 0',
                                        fontWeight: '600',
                                        color: primaryColor
                                    }}>
                                        {item.name}
                                    </h6>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <ButtonGroup size="sm">
                                    <Button
                                        variant="outline-danger"
                                        onClick={() => removeFromCart(item)}
                                        style={{
                                            borderColor: '#dc3545',
                                            color: '#dc3545',
                                            width: '35px'
                                        }}
                                    >
                                        -
                                    </Button>
                                    <Button
                                        variant="outline-secondary"
                                        disabled
                                        style={{ width: '45px', cursor: 'default' }}
                                    >
                                        {item.quantity}
                                    </Button>
                                    <Button
                                        variant="outline-success"
                                        onClick={() => addToCart(item)}
                                        style={{
                                            borderColor: '#198754',
                                            color: '#198754',
                                            width: '35px'
                                        }}
                                    >
                                        +
                                    </Button>
                                </ButtonGroup>
                                <div style={{
                                    fontWeight: 'bold',
                                    color: primaryColor,
                                    fontSize: '1.1rem'
                                }}>
                                    {formatPrice(item.price * item.quantity)}
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                ))}
            </div>
            )}
        </>
    )

}

export default CartContent;