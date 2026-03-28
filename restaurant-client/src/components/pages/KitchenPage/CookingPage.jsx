import React, { useState, useEffect } from 'react';
import { authApis, endpoints } from '../../configs/Apis';
import { useCookies } from 'react-cookie';

const CookingPage = ({ items, handleFinishButton }) => {
    const [selectedItem, setselectedItem] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [cookie,] = useCookies(["token"]);

    useEffect(() => {
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
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatItemTime = (timeString) => {
        const trimmed = timeString.split(".")[0];
        const date = new Date(trimmed);
        return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    };

    const getElapsedTime = (startTime) => {
        if (!startTime) return '--:--';
        const cleanTime = startTime.split('.')[0];
        const start = new Date(cleanTime);
        if (isNaN(start.getTime())) return '--:--';
        const elapsed = Math.floor((currentTime - start) / 1000);
        if (elapsed < 0) return '00:00';
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const OrderListItem = ({ item, isSelected, onClick }) => (
        <div
            onClick={onClick}
            className={`flex items-center p-3 cursor-pointer transition-all duration-200 border-l-4 ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-warning bg-white dark:bg-gray-800'} hover:bg-blue-50 dark:hover:bg-blue-900/20`}
        >
            <div className="w-12 text-center text-sm font-semibold text-gray-600 dark:text-gray-400 shrink-0">
                {item.kitchenId}
            </div>
            <div className="flex-1 px-3">
                <div className="font-bold text-gray-900 dark:text-gray-100">{item.name} <span className="text-sm font-normal text-gray-500">(SL: {item.quantity})</span></div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Chef: {item.chef}</div>
            </div>
            <div className="font-bold text-gray-700 dark:text-gray-300 text-sm text-right shrink-0">{item.table}</div>
        </div>
    );

    const ItemDetail = ({ item }) => {
        if (!item) return (
            <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">🍳</div>
                    <h5 className="font-semibold">Chọn một món để xem chi tiết</h5>
                </div>
            </div>
        );

        const elapsedTime = getElapsedTime(item.startAt);

        return (
            <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h5 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Chi tiết món ăn</h5>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    <div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{item.name}</h4>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <div>Số lượng: <strong className="text-gray-900 dark:text-gray-100">{item.quantity}</strong></div>
                            <div>Điểm ưu tiên: <strong className="text-gray-900 dark:text-gray-100">{item.priorityScore}</strong></div>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Bếp trưởng phụ trách</p>
                        <p className="font-bold text-gray-900 dark:text-gray-100">{item.chef}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Thời gian</p>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
                                <div className="text-xs text-gray-500 mb-1">Bắt đầu nấu</div>
                                <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">{formatItemTime(item.startAt)}</div>
                            </div>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
                                <div className="text-xs text-gray-500 mb-1">Thời gian dự kiến</div>
                                <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">{formatItemTime(item.expectedDeadlineTime)}</div>
                            </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-xl p-4 text-center">
                            <div className="text-xs text-blue-500 mb-1">Đã nấu được</div>
                            <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{elapsedTime}</div>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => handleFinishButton(item)}
                        disabled={loading}
                        className="w-full py-3 px-4 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/20"
                    >
                        {loading ? "Đang xử lý..." : "✓ Hoàn thành món"}
                    </button>
                </div>
            </div>
        );
    };

    if (items.length === 0) {
        return (
            <div className="w-full py-16 text-center">
                <div className="text-7xl mb-6">🍳</div>
                <h3 className="text-xl font-bold text-gray-400 mb-2">Không có món nào đang được nấu</h3>
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
                        <h5 className="font-bold text-gray-900 dark:text-gray-100">Đang nấu ({items.length} món)</h5>
                        <span className="bg-warning text-white text-xs font-bold px-3 py-1.5 rounded-full">
                            {formatTime(currentTime.toISOString())}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
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
                {/* Right Panel */}
                <div className="w-7/12 overflow-y-auto">
                    <ItemDetail item={selectedItem} />
                </div>
            </div>
        </div>
    );
};

export default CookingPage;