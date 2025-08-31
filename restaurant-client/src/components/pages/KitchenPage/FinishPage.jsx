import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card, Col, Row } from 'react-bootstrap';

const FinishPage = ({ kitchenOrders = [], totalPage, renderPagination,totalItems }) => {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Auto select first cooking order if none selected
        if (kitchenOrders.length > 0 && !selectedOrder) {
            setSelectedOrder(kitchenOrders[0]);
        }
    }, [kitchenOrders, selectedOrder]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (timeString) => {
        if (!timeString) return '--:--';
        const date = new Date(timeString.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3"));
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };
    const OrderListItem = ({ order, isSelected, onClick }) => {
       
        return (
            order.status === "DONE" && 
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
                        {order.kitchenAssignId}
                    </Col>
                    <Col lg={5}>
                        <div className="fw-bold mb-1">{order.itemResponse.name} (SL: {order.itemResponse.quantity})</div>
                        <div className="text-muted small">
                            <div>Chef: {order.chefResponse.name}</div>
                        </div>
                    </Col>
                    <Col lg={5} style={{ display: "flex", justifyContent: "flex-end" }}>
                        <div className="fw-bold mb-1">{order.table} </div>
                    </Col>
                </Row>



            </div>
        );
    };

    const OrderDetail = ({ order }) => {
        if (!order) {
            return (
                <div className="card h-100 d-flex align-items-center justify-content-center">
                    <div className="text-center text-muted">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍳</div>
                        <h5>Chọn một món để xem chi tiết</h5>
                    </div>
                </div>
            );
        }

        return (
            <div className="card h-100">
                <div className="card-header">
                    <h5 className="mb-0">Chi tiết đơn món {order.kitchenAssignId}</h5>
                </div>

                <div className="card-body">
                    {/* Basic Info */}
                    <div className="mb-4">
                        <h4 className="mb-2">{order.itemResponse.name}</h4>
                        <div className="text-muted">
                            <div className="mb-1">Số lượng: <strong>{order.itemResponse.quantity}</strong></div>
                            <div className="mb-1">Id: <strong>{order.itemResponse.orderItemId}</strong></div>
                            <div>Điểm ưu tiên: <strong>{order.itemResponse.priorityScore}</strong></div>
                        </div>
                    </div>

                    {/* Chef Info */}
                    <div className="mb-4">
                        <h6 className="text-muted">Thông tin bếp trưởng</h6>
                        <div><strong>{order.chefResponse.name}</strong></div>

                    </div>

                    {/* Time Information */}
                    <div className="mb-4">
                        <h6 className="text-muted mb-3">Thời gian</h6>

                        <div className="row mb-3">
                            <div className="col-6">
                                <div className="border rounded p-2 text-center">
                                    <div className="text-muted small">Bắt đầu nấu</div>
                                    <div className="fw-bold">{formatTime(order.startAt)}</div>

                                </div>
                            </div>
                            <div className="col-6">
                                <div className="border rounded p-2 text-center">
                                    <div className="text-muted small">Thời gian hoàn thành ước tính</div>
                                    <div className="fw-bold">{formatTime(order.itemResponse.expectedDeadlineTime)}</div>
                                </div>
                            </div>
                        </div>
                        <div className="row mb-3">
                            <div className="col-6">
                                <div className="border rounded p-2 text-center">
                                    <div className="text-muted small">Thời gian hoàn thành thực tế</div>
                                    <div className="fw-bold">{formatTime(order.finishAt)}</div>

                                </div>
                            </div>
                            <div className="col-6">
                                <div className="border rounded p-2 text-center">
                                    <div className="text-muted small">Số phút hoàn thành món</div>
                                    <div className="fw-bold">{order.actualCookingTime}</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>


            </div>
        );
    };

    if (kitchenOrders.length === 0) {
        return (
            <div className="container-fluid py-4">
                <div className="text-center py-5">
                    <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🍳</div>
                    <h3 className="text-muted">Không có món nào</h3>
                    <p className="text-muted">Tất cả món ăn đã hoàn thành hoặc đang chờ xử lý</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-3">
            <div className="row" style={{ height: 'calc(100vh - 200px)' }}>
                {/* Left Panel - Orders List */}
                <div className="col-md-5 pe-2">
                    <Card className="card h-100">
                        <Card.Header className="card-header d-flex justify-content-between align-items-center">
                            <Row>
                                <Col>
                                    <h5 className="mb-0">Đã hoàn thành ({totalItems} món)</h5>
                                    <span className="badge bg-warning">{formatTime(currentTime.toISOString())}</span>
                                </Col>
                            </Row>
                            
                        </Card.Header>

                        <Card.Body style={{ height: '100%', overflowY: 'auto' }}>
                            <div className="list-group list-group-flush">
                                {kitchenOrders.map(order => (
                                    <OrderListItem
                                        key={order.kitchenAssignId}
                                        order={order}
                                        isSelected={selectedOrder?.kitchenAssignId === order.kitchenAssignId}
                                        onClick={() => setSelectedOrder(order)}
                                    />
                                ))}
                            </div>
                        </Card.Body>
                        {totalPage > 1 && renderPagination()}
                    </Card>

                </div>

                {/* Right Panel - Order Detail */}
                <div className="col-md-7 ps-2">
                    <div style={{ height: '100%', overflowY: 'auto' }}>
                        <OrderDetail order={selectedOrder} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinishPage;