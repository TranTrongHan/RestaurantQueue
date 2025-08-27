import { Card } from "react-bootstrap";

const BillContent = ({ billItems = [], formatPrice }) => {
    // Tính tổng tiền
    const totalAmount = billItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    return (
        <>
            <Card style={{
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                overflow: 'hidden'
            }}>
                <Card.Header style={{
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #dee2e6',
                    padding: '16px 20px',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    textAlign: 'center'
                }}>
                    Hóa đơn tạm tính
                </Card.Header>

                <Card.Body style={{
                    padding: '0',
                    backgroundColor: '#ffffff'
                }}>
                    {/* Header của bảng */}
                    <div style={{
                        display: 'flex',
                        backgroundColor: '#f1f3f4',
                        padding: '12px 20px',
                        borderBottom: '1px solid #e0e0e0',
                        fontWeight: '600',
                        fontSize: '14px',
                        color: '#5f6368'
                    }}>
                        <div style={{ flex: '2', textAlign: 'left' }}>Món ăn</div>
                        <div style={{ flex: '1', textAlign: 'center' }}>SL</div>
                        <div style={{ flex: '1', textAlign: 'center' }}>Đơn giá</div>
                        <div style={{ flex: '1', textAlign: 'right' }}>Thành tiền</div>
                    </div>

                    {/* Danh sách món ăn */}
                    {billItems.map((item, index) => (
                        <div 
                            key={item.orderItemId}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '16px 20px',
                                borderBottom: index === billItems.length - 1 ? 'none' : '1px solid #f0f0f0',
                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                                transition: 'background-color 0.2s ease',
                                cursor: 'default'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#fafafa'}
                        >
                            <div style={{ 
                                flex: '2', 
                                fontWeight: '500',
                                color: '#2c3e50',
                                fontSize: '15px'
                            }}>
                                {item.name}
                            </div>
                            <div style={{ 
                                flex: '1', 
                                textAlign: 'center',
                                fontSize: '14px',
                                color: '#6c757d',
                                fontWeight: '500',
                                backgroundColor: '#e3f2fd',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                display: 'inline-block',
                                minWidth: '30px'
                            }}>
                                {item.quantity}
                            </div>
                            <div style={{ 
                                flex: '1', 
                                textAlign: 'center',
                                fontSize: '14px',
                                color: '#6c757d'
                            }}>
                                {formatPrice(item.price)}
                            </div>
                            <div style={{ 
                                flex: '1', 
                                textAlign: 'right',
                                fontWeight: '600',
                                color: '#e74c3c',
                                fontSize: '15px'
                            }}>
                                {formatPrice(item.quantity * item.price)}
                            </div>
                        </div>
                    ))}

                    {/* Trường hợp không có món nào */}
                    {billItems.length === 0 && (
                        <div style={{
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: '#9e9e9e',
                            fontSize: '16px'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍽️</div>
                            <div>Chưa có món nào được chọn</div>
                        </div>
                    )}
                </Card.Body>

                <Card.Footer style={{
                    backgroundColor: '#803421ff',
                    color: '#ffffff',
                    padding: '20px',
                    borderTop: '3px solid #34495e'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '18px',
                        fontWeight: '700'
                    }}>
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            Tổng cộng:
                        </span>
                        <span style={{
                            fontSize: '20px',
                            color: '#f39c12',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                        }}>
                            {formatPrice(totalAmount)}
                        </span>
                    </div>
                    
                    {/* Thông tin thêm */}
                    <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #34495e',
                        fontSize: '13px',
                        color: '#bdc3c7',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <span>Số món: {billItems.length}</span>
                        <span>Tổng SL: {billItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    </div>
                </Card.Footer>
            </Card>
        </>
    );
};

export default BillContent;