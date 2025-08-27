import { Badge, Button, Card } from "react-bootstrap";

const TrackingContent = ({ items, primaryColor,handleCancelOrderItem }) => {

    return (
        <>
            <div>
                <div style={{
                    textAlign: 'center',
                    color: '#6c757d',
                    padding: '20px 0 30px 0'
                }}>

                    <h6 style={{ color: primaryColor, fontWeight: 'bold', marginBottom: '10px' }}>
                        Theo dõi tình trạng món ăn
                    </h6>
                </div>

                {/* Sample tracking items layout */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px',
                    marginBottom: '10px'
                }}>
                    {[
                        { status: 'PENDING', label: 'Đang chuẩn bị', color: '#ffc107', icon: '⏳' },
                        { status: 'COOKING', label: 'Đang nấu', color: '#fd7e14', icon: '🍳' },
                        { status: 'DONE', label: 'Sẵn sàng', color: '#20c997', icon: '🔔' },
                        // { status: 'SERVED', label: 'Đã phục vụ', color: '#198754', icon: '✅' }
                    ].map(({ status, label, color, icon }) => {
                        const count = items.filter(item => item.status === status).length;
                        return (
                            <div key={status} style={{
                                padding: '15px',
                                backgroundColor: color + '15',
                                border: `2px solid ${color}`,
                                borderRadius: '10px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{icon}</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: color, lineHeight: 1 }}>
                                    {count}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>
                                    {label}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Active Orders Container */}
                <div style={{
                    display: 'grid',
                    gap: '15px',
                    maxHeight: '60vh',
                    overflowY: 'auto',
                    paddingRight: '8px'
                }}>
                    {/* Đang chuẩn bị */}
                    {(() => {
                        const pendingItems = items.filter(item => item.status === 'PENDING');
                        const maxDisplay = 6; // Hiển thị 6 món cho web
                        const displayItems = pendingItems.slice(0, maxDisplay);
                        const remainingCount = pendingItems.length - maxDisplay;

                        return pendingItems.length > 0 ? (
                            <Card style={{
                                backgroundColor: '#fff8e1',
                                border: '2px solid #ffc107',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(255, 193, 7, 0.1)'
                            }}>
                                <Card.Body style={{ padding: '18px' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '15px',
                                        paddingBottom: '10px',
                                        borderBottom: '1px solid #ffc10740'
                                    }}>
                                        <div style={{
                                            width: '35px',
                                            height: '35px',
                                            borderRadius: '50%',
                                            backgroundColor: '#ffc107',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.1rem',
                                            marginRight: '12px'
                                        }}>
                                            ⏳
                                        </div>
                                        <div>
                                            <h6 style={{ margin: 0, color: '#856404', fontWeight: '600', fontSize: '1rem' }}>
                                                Đang chuẩn bị
                                            </h6>
                                            <small style={{ color: '#6c757d' }}>
                                                {pendingItems.length} món đang chờ xử lý
                                            </small>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        {displayItems.map(item => (
                                            <div key={item.orderItemId} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 15px',
                                                backgroundColor: 'white',
                                                borderRadius: '8px',
                                                border: '1px solid #ffc10730',
                                                fontSize: '0.9rem'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{
                                                        backgroundColor: '#ffc107',
                                                        color: '#856404',
                                                        borderRadius: '6px',
                                                        width: '24px',
                                                        height: '24px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {item.quantity}
                                                    </span>
                                                    <span style={{ fontWeight: '500', color: '#495057' }}>
                                                        {item.name}
                                                    </span>
                                                </div>
                                                {item.startTime && (
                                                    <span style={{
                                                        color: '#6c757d',
                                                        fontSize: '0.8rem',
                                                        backgroundColor: '#f8f9fa',
                                                        padding: '3px 8px',
                                                        borderRadius: '12px'
                                                    }}>
                                                        Dự kiến :{new Date(item.deadlineTime).toLocaleTimeString('vi-VN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                )}
                                                <Button variant="danger" style={{width:"85px",height:"45px",fontSize:"10px"}} 
                                                    onClick={() => handleCancelOrderItem(item.orderItemId)}
                                                    >
                                                    Hủy món
                                                </Button>
                                            </div>
                                        ))}

                                        {remainingCount > 0 && (
                                            <div style={{
                                                padding: '8px 15px',
                                                textAlign: 'center',
                                                backgroundColor: '#ffc107',
                                                color: '#856404',
                                                borderRadius: '8px',
                                                fontSize: '0.85rem',
                                                fontWeight: '500',
                                                marginTop: '5px'
                                            }}>
                                                + {remainingCount} món khác (Click để xem thêm)
                                            </div>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        ) : null;
                    })()}

                    {/* Đang nấu */}
                    {(() => {
                        const cookingItems = items.filter(item => item.status === 'COOKING');
                        const maxDisplay = 4; // Ít hơn vì đang nấu cần ưu tiên
                        const displayItems = cookingItems.slice(0, maxDisplay);
                        const remainingCount = cookingItems.length - maxDisplay;

                        return cookingItems.length > 0 ? (
                            <Card style={{
                                backgroundColor: '#fff4e6',
                                border: '2px solid #fd7e14',
                                borderRadius: '12px',
                                boxShadow: '0 2px 8px rgba(253, 126, 20, 0.1)'
                            }}>
                                <Card.Body style={{ padding: '18px' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        marginBottom: '15px',
                                        paddingBottom: '10px',
                                        borderBottom: '1px solid #fd7e1440'
                                    }}>
                                        <div style={{
                                            width: '35px',
                                            height: '35px',
                                            borderRadius: '50%',
                                            backgroundColor: '#fd7e14',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.1rem',
                                            marginRight: '12px'
                                        }}>
                                            🍳
                                        </div>
                                        <div>
                                            <h6 style={{ margin: 0, color: '#8b4513', fontWeight: '600', fontSize: '1rem' }}>
                                                Đang nấu
                                            </h6>
                                            <small style={{ color: '#6c757d' }}>
                                                {cookingItems.length} món đang chế biến
                                            </small>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        {displayItems.map(item => (
                                            <div key={item.orderItemId} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 15px',
                                                backgroundColor: 'white',
                                                borderRadius: '8px',
                                                border: '1px solid #fd7e1430',
                                                fontSize: '0.9rem'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{
                                                        backgroundColor: '#fd7e14',
                                                        color: 'white',
                                                        borderRadius: '6px',
                                                        width: '24px',
                                                        height: '24px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {item.quantity}
                                                    </span>
                                                    <span style={{ fontWeight: '500', color: '#495057' }}>
                                                        {item.name}
                                                    </span>
                                                </div>
                                                {item.deadlineTime && (
                                                    
                                                    <span style={{
                                                        color: '#dc3545',
                                                        fontSize: '0.8rem',
                                                        backgroundColor: '#f8d7da',
                                                        padding: '3px 8px',
                                                        borderRadius: '12px',
                                                        fontWeight: '500'
                                                    }}>
                                                        Ước tính: {new Date(item.deadlineTime).toLocaleTimeString('vi-VN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                        ))}

                                        {remainingCount > 0 && (
                                            <div style={{
                                                padding: '8px 15px',
                                                textAlign: 'center',
                                                backgroundColor: '#fd7e14',
                                                color: 'white',
                                                borderRadius: '8px',
                                                fontSize: '0.85rem',
                                                fontWeight: '500',
                                                marginTop: '5px'
                                            }}>
                                                + {remainingCount} món khác (Click để xem thêm)
                                            </div>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        ) : null;
                    })()}

                    {/* Đã phục vụ - Collapsed */}
                    {(() => {
                        const servedItems = items.filter(item => item.status === 'DONE');
                        return servedItems.length > 0 ? (
                            <Card style={{
                                backgroundColor: '#f0f8f0',
                                border: '2px solid #198754',
                                borderRadius: '12px'
                            }}>
                                <Card.Body style={{ padding: '15px' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '50%',
                                                backgroundColor: '#198754',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '1rem'
                                            }}>
                                                ✅
                                            </div>
                                            <div>
                                                <span style={{ fontWeight: '600', color: '#0f5132', fontSize: '1rem' }}>
                                                    Đã phục vụ
                                                </span>
                                                <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                                                    Tất cả món đã hoàn thành
                                                </div>
                                            </div>
                                        </div>
                                        <Badge style={{
                                            backgroundColor: '#198754',
                                            color: 'white',
                                            fontSize: '0.9rem',
                                            padding: '8px 12px'
                                        }}>
                                            {servedItems.length} món
                                        </Badge>
                                    </div>
                                </Card.Body>
                            </Card>
                        ) : null;
                    })()}
                </div>


                {/* Thời gian cập nhật */}
                <div style={{
                    textAlign: 'center',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    color: '#6c757d',
                    border: '1px solid #dee2e6'
                }}>
                    Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    })} - {new Date().toLocaleDateString('vi-VN')}
                </div>
            </div>
        </>
    )
}

export default TrackingContent;