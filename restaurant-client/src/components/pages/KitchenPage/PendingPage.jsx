import { useEffect, useState } from "react";
import { Badge, Card, Col, Row } from "react-bootstrap";

const PendingPage = ({ orderItems }) => {
    const [selectedItem, setselectedItem] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const formatTime = (timeString) => {
        if (!timeString) return '--:--';
        const date = new Date(timeString.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3"));
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };
    const formatItemTime = (timeString) => {
        const trimmed = timeString.split(".")[0];
        const date = new Date(trimmed);

        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
    }
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    const getElapsedTime = (startTime) => {
        if (!startTime) return '--:--';

        // Cắt phần nano giây, chỉ lấy đến mili giây (3 chữ số) hoặc bỏ hết
        const cleanTime = startTime.split('.')[0];

        // JS hiểu chuẩn "YYYY-MM-DDTHH:mm:ss"
        const start = new Date(cleanTime);

        if (isNaN(start.getTime())) return '--:--';

        const elapsed = Math.floor((currentTime - start) / 1000);

        if (elapsed < 0) return '00:00';

        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const PendingItem = ({ item, isSelected, onClick }) => {
        return (
            <div
                onClick={onClick}
                className="list-group-item list-group-item-action p-3"
                style={{
                    borderLeft: isSelected ? '4px solid #0d6efd' : '4px solid #ffc107',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: isSelected ? '#e7f3ff' : 'white'
                }}
            >
                <Row>
                    <Col lg={2} style={{ display: "flex", justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }}>
                        {item.orderItemId}
                    </Col>
                    <Col lg={5}>
                        <div className="fw-bold mb-1">{item.name} (SL: {item.quantity})</div>
                    </Col>
                    <Col lg={5} style={{ display: "flex", justifyContent: "flex-end",gap:"8px" }}>
                        <span className="fw-bold mb-1">{item.table} </span>
                        <span>{item.VIP ? (<Badge bg="primary">VIP</Badge>):(null)}</span>
                        <span>{item.isLate !='false'? (<Badge bg="danger">LATE</Badge>):(null)}</span>
                    </Col>
                </Row>
            </div>
        );
    };

    const OrderDetail = ({ item }) => {
        if (!item) {
            return (
                <div className="card h-100 d-flex align-items-center justify-content-center">
                    <div className="text-center text-muted">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍳</div>
                        <h5>Chọn một món để xem chi tiết</h5>
                    </div>
                </div>
            );
        }
        const elapsedTime = getElapsedTime(item.startTime);

        return (
            <div className="card h-100">
                <div className="card-header">
                    <h5 className="mb-0">Chi tiết đơn món chờ </h5>
                </div>

                <div className="card-body">
                    {/* Basic Info */}
                    <div className="mb-4">
                        <h4 className="mb-2">{item.name}</h4>
                        <div className="text-muted">
                            <div className="mb-1">Số lượng: <strong>{item.quantity}</strong></div>
                            <div className="mb-1">Id: <strong>{item.orderItemId}</strong></div>
                            <div>Điểm ưu tiên: <strong>{item.priorityScore}</strong></div>
                        </div>
                    </div>


                    {/* Time Information */}
                    <div className="mb-4">
                        <h6 className="text-muted mb-3">Thời gian</h6>

                        <Row className="mb-3">
                            <Col lg={6}>
                                <div className="border rounded p-2 text-center">
                                    <div className="text-muted small">Món được gửi lúc</div>
                                    <div className="fw-bold">{formatItemTime(item.startTime)}</div>

                                </div>
                            </Col>
                            <Col lg={6}>
                                <div className="border rounded p-2 text-center">
                                    <div className="text-muted small">Thời gian hoàn thành ước tính</div>
                                    <div className="fw-bold">{formatItemTime(item.deadlineTime)}</div>
                                </div>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col lg={12}>
                                <div className="border rounded p-2 text-center">
                                    <div className="text-muted small">Đã chờ </div>
                                    <div className="fw-bold">{elapsedTime} phút</div>
                                </div>
                            </Col>
                        </Row>


                    </div>
                </div>


            </div>
        );
    };
    if (orderItems.length === 0) {
        return (
            <div className="container-fluid py-4">
                <div className="text-center py-5">
                    <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🍳</div>
                    <h3 className="text-muted">Không có món nào đang chờ</h3>
                    <p className="text-muted">Tất cả món ăn đã hoàn thành hoặc đang được nấu </p>
                </div>
            </div>
        );
    }
    return (
        <>
            <div className="container-fluid py-3">
                <div className="row" style={{ height: 'calc(100vh - 200px)' }}>
                    {/* Left Panel - Orders List */}
                    <div className="col-md-5 pe-2">
                        <Card className="card h-100">
                            <Card.Header className="card-header d-flex justify-content-between align-items-center">
                                <Row>
                                    <Col>
                                        <h5 className="mb-0"> ({orderItems.length} món đang chờ)</h5>
                                        <span className="badge bg-warning">{formatTime(currentTime.toISOString())}</span>
                                    </Col>
                                </Row>

                            </Card.Header>

                            <Card.Body style={{ height: '100%', overflowY: 'auto' }}>
                                <div className="list-group list-group-flush">
                                    {orderItems.map(item => (
                                        <PendingItem
                                            key={item.orderItemId}
                                            item={item}
                                            isSelected={selectedItem?.orderItemId === item.orderItemId}
                                            onClick={() => setselectedItem(item)}
                                        />
                                    ))}
                                </div>
                            </Card.Body>
                            {/* {totalPage > 1 && renderPagination()} */}
                        </Card>

                    </div>

                    {/* Right Panel - Order Detail */}
                    <div className="col-md-7 ps-2">
                        <div style={{ height: '100%', overflowY: 'auto' }}>
                            <OrderDetail item={selectedItem} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default PendingPage;