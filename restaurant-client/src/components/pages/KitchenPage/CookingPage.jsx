import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Col, Row } from 'react-bootstrap';
import { authApis, endpoints } from '../../configs/Apis';
import { useCookies } from 'react-cookie';

const CookingPage = ({ items,handleFinishButton }) => {
    const [selectedItem, setselectedItem] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [cookie,] = useCookies(["token"]);

    
    useEffect(() => {
        // Auto select first cooking order if none selected
        if (items.length > 0 && !selectedItem) {
            setselectedItem(items[0]);
        }
    }, [items, selectedItem]);

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


    const getTimeRemaining = (deadlineTime) => {
        if (!deadlineTime) return { text: '--:--', isOverdue: false, totalSeconds: 0 };

        const deadline = new Date(deadlineTime.replace(/:/g, '-').replace(' ', 'T'));
        const remaining = Math.floor((deadline - currentTime) / 1000);

        if (remaining <= 0) {
            return {
                text: 'Quá hạn',
                isOverdue: true,
                totalSeconds: 0,
                overdue: Math.abs(remaining)
            };
        }

        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        return {
            text: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            isOverdue: false,
            totalSeconds: remaining,
            isUrgent: remaining < 300 // 5 minutes
        };
    };



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

    const OrderListItem = ({ item, isSelected, onClick }) => {
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
                        {item.kitchenId}
                    </Col>
                    <Col lg={5}>
                        <div className="fw-bold mb-1">{item.name} (SL: {item.quantity})</div>
                        <div className="text-muted small">
                            <div>Chef: {item.chef}</div>
                        </div>
                    </Col>
                    <Col lg={5} style={{ display: "flex", justifyContent: "flex-end" }}>
                        <div className="fw-bold mb-1">{item.table} </div>
                    </Col>
                </Row>



            </div>
        );
    };

    const ItemDetail = ({ item }) => {
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

        const elapsedTime = getElapsedTime(item.startAt);

        return (
            <div className="card h-100">
                <div className="card-header">
                    <h5 className="mb-0">Chi tiết món ăn</h5>
                </div>

                <div className="card-body">
                    {/* Basic Info */}
                    <div className="mb-4">
                        <h4 className="mb-2">{item.name}</h4>
                        <div className="text-muted">
                            <div className="mb-1">Số lượng: <strong>{item.quantity}</strong></div>
                            {/* <div className="mb-1">Id: <strong>{order.itemResponse.orderItemId}</strong></div> */}
                            <div>Điểm ưu tiên: <strong>{item.priorityScore}</strong></div>
                        </div>
                    </div>

                    {/* Chef Info */}
                    <div className="mb-4">
                        <h6 className="text-muted">Thông tin bếp trưởng</h6>
                        <div><strong>{item.chef}</strong></div>

                    </div>

                    {/* Time Information */}
                    <div className="mb-4">
                        <h6 className="text-muted mb-3">Thời gian</h6>

                        <div className="row mb-3">
                            <div className="col-6">
                                <div className="border rounded p-2 text-center">
                                    <div className="text-muted small">Bắt đầu nấu</div>
                                    <div className="fw-bold">{formatItemTime(item.startAt)}</div>

                                </div>
                            </div>
                            <div className="col-6">
                                <div className="border rounded p-2 text-center">
                                    <div className="text-muted small">Thời gian dự kiến</div>
                                    <div className="fw-bold">{formatItemTime(item.expectedDeadlineTime)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="border rounded p-3 bg-light">
                                <div className="text-muted small">Đã nấu được</div>
                                <div className="fw-bold h4 text-info">{elapsedTime}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-footer">
                    <Button
                        onClick={() => handleFinishButton(item)}
                        disabled={loading}
                        className="btn btn-success w-100" >
                        {loading ? ("....") : "Hoàn thành món"}
                    </Button>
                </div>
            </div>
        );
    };

    if (items.length === 0) {
        return (
            <div className="container-fluid py-4">
                <div className="text-center py-5">
                    <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>🍳</div>
                    <h3 className="text-muted">Không có món nào đang được nấu</h3>
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
                    <div className="card h-100">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Đang nấu ({items.length} món)</h5>
                            <span className="badge bg-warning">{formatTime(currentTime.toISOString())}</span>
                        </div>
                        <div style={{ height: '100%', overflowY: 'auto' }}>
                            <div className="list-group list-group-flush">
                                {items.map(item => (
                                    <OrderListItem
                                        key={item.kitchenId}
                                        item={item}
                                        isSelected={selectedItem?.kitchenId === item.kitchenId}
                                        onClick={() => setselectedItem(item)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Order Detail */}
                <div className="col-md-7 ps-2">
                    <div style={{ height: '100%', overflowY: 'auto' }}>
                        <ItemDetail item={selectedItem} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CookingPage;