import React, { useState, useEffect } from 'react';

const FinishPage = ({ kitchenOrders = [], totalPage, renderPagination, totalItems }) => {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        if (kitchenOrders.length > 0 && !selectedOrder) {
            setSelectedOrder(kitchenOrders[0]);
        }
    }, [kitchenOrders, selectedOrder]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (timeString) => {
        if (!timeString) return '--:--';
        const date = new Date(timeString.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3"));
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const OrderListItem = ({ order, isSelected, onClick }) => (
        order.status === "DONE" &&
        <div
            onClick={onClick}
            className={`flex items-center p-3 cursor-pointer transition-all duration-200 border-l-4 ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-warning bg-white dark:bg-gray-800'} hover:bg-blue-50 dark:hover:bg-blue-900/20`}
        >
            <div className="w-12 text-center text-sm font-semibold text-gray-600 dark:text-gray-400 shrink-0">
                {order.kitchenAssignId}
            </div>
            <div className="flex-1 px-3">
                <div className="font-bold text-gray-900 dark:text-gray-100">{order.itemResponse.name} <span className="text-sm font-normal text-gray-500">(SL: {order.itemResponse.quantity})</span></div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Chef: {order.chefResponse.name}</div>
            </div>
            <div className="font-bold text-gray-700 dark:text-gray-300 text-sm text-right shrink-0">{order.table}</div>
        </div>
    );

    const OrderDetail = ({ order }) => {
        if (!order) return (
            <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">🍳</div>
                    <h5 className="font-semibold">Chọn một món để xem chi tiết</h5>
                </div>
            </div>
        );

        return (
            <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h5 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Chi tiết đơn món #{order.kitchenAssignId}</h5>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    <div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{order.itemResponse.name}</h4>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div>Số lượng: <strong className="text-gray-900 dark:text-gray-100">{order.itemResponse.quantity}</strong></div>
                            <div>Id: <strong className="text-gray-900 dark:text-gray-100">{order.itemResponse.orderItemId}</strong></div>
                            <div>Điểm ưu tiên: <strong className="text-gray-900 dark:text-gray-100">{order.itemResponse.priorityScore}</strong></div>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Bếp trưởng phụ trách</p>
                        <p className="font-bold text-gray-900 dark:text-gray-100">{order.chefResponse.name}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Thời gian</p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
                                <div className="text-xs text-gray-500 mb-1">Bắt đầu nấu</div>
                                <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">{formatTime(order.startAt)}</div>
                            </div>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
                                <div className="text-xs text-gray-500 mb-1">Dự kiến xong</div>
                                <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">{formatTime(order.itemResponse.expectedDeadlineTime)}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 rounded-xl p-3 text-center">
                                <div className="text-xs text-green-600 mb-1">Hoàn thành thực tế</div>
                                <div className="font-bold text-green-700 dark:text-green-400 text-sm">{formatTime(order.finishAt)}</div>
                            </div>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
                                <div className="text-xs text-gray-500 mb-1">Phút nấu thực tế</div>
                                <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">{order.actualCookingTime}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (kitchenOrders.length === 0) {
        return (
            <div className="w-full py-16 text-center">
                <div className="text-7xl mb-6">🍳</div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">Không có món nào</h3>
                <p className="text-gray-400">Tất cả món ăn đã hoàn thành hoặc đang chờ xử lý</p>
            </div>
        );
    }

    return (
        <div className="w-full p-3">
            <div className="flex gap-3" style={{ height: 'calc(100vh - 200px)' }}>
                {/* Left Panel */}
                <div className="w-5/12 flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <h5 className="font-bold text-gray-900 dark:text-gray-100">Đã hoàn thành ({totalItems} món)</h5>
                        <span className="bg-warning text-white text-xs font-bold px-3 py-1.5 rounded-full">
                            {formatTime(currentTime.toISOString())}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                        {kitchenOrders.map(order => (
                            <OrderListItem
                                key={order.kitchenAssignId}
                                order={order}
                                isSelected={selectedOrder?.kitchenAssignId === order.kitchenAssignId}
                                onClick={() => setSelectedOrder(order)}
                            />
                        ))}
                    </div>
                    {totalPage > 1 && (
                        <div className="p-3 border-t border-gray-100 dark:border-gray-700">
                            {renderPagination()}
                        </div>
                    )}
                </div>
                {/* Right Panel */}
                <div className="w-7/12 overflow-y-auto">
                    <OrderDetail order={selectedOrder} />
                </div>
            </div>
        </div>
    );
};

export default FinishPage;