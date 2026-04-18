# Thiết kế Kỹ thuật - Kitchen Queue & Membership Intelligence

Tài liệu này chi tiết hóa các thành phần kỹ thuật, công thức tính toán và kiến trúc hệ thống hỗ trợ ra quyết định (DSS) trong quản lý vận hành nhà hàng.

## 1. Thành phần Dữ liệu (Entities & Configuration)

Hệ thống đã chuyển đổi sang mô hình **Dynamic Configuration** để đảm bảo khả năng tùy chỉnh linh hoạt mà không cần khởi động lại Server.

### Setting (Hệ thống cấu hình động)
- **KITCHEN_CAPACITY**: Số lượng món có thể xử lý đồng thời (mặc định = 2).
- **LOYALTY_POINTS_PER_VND**: Quy đổi tiền mặt sang điểm (mặc định 1000đ = 1 điểm).
- **LOYALTY_MIN_REDEMPTION_THRESHOLD**: Ngưỡng điểm tối thiểu để được quy đổi thành tiền mặt.

### MembershipTier & Loyalty
- **priority** (Integer): Trọng số ưu tiên cho hàng đợi bếp (Gold: 3, Silver: 2, New: 1).
- **point_earning_rate** (Double): Hệ số nhân điểm thưởng theo hạng thành viên.

### OrderItem & Time Tracking
- **estimate_time** (Double): Thời gian chờ ước tính (phút).
- **deadline_time** (LocalDateTime): Mốc thời gian tuyệt đối phải hoàn thành món.
- **avg_cooking_time** (Double): Lưu tại `MenuItem`, được cập nhật liên tục qua mỗi lần hoàn thành món bằng thuật toán EMA (Exponential Moving Average).

---

## 2. Công thức Ước lượng & DSS (Estimation Formula)

Thời gian chờ ước tính ($T_{wait}$) cho một món ăn mới được tính toán dựa trên năng suất thực tế của khu vực bếp:

$$ T_{wait} = Max(Remaining_{cooking}) + \frac{\sum Pending_{load}}{Capacity_{kitchen}} + T_{self} $$

Trong đó:
- $Remaining_{cooking}$: Thời gian còn lại của các món đang xử lý trên bếp.
- $Pending_{load}$: Tổng khối lượng công việc của các món đang đợi.
- $Capacity_{kitchen}$: Tham số cấu hình số lượng đầu bếp/bếp nấu (`KITCHEN_CAPACITY`).
- $T_{self}$: Thời gian nấu trung bình (`avgCookingTime`) của chính món đó.

---

## 3. Hệ thống Hàng đợi Ưu tiên (Priority Queue Logic)

### Cơ chế đồng bộ Real-time (Firestore)
Mọi thay đổi trạng thái món ăn đều được đồng bộ tức thời lên Firestore để phục vụ UI Kitchen và Khách hàng:
- **estimateTime**: Thời gian chờ (relative).
- **deadlineTime**: Mốc thời gian hoàn thành (absolute - giúp Chef quản lý theo đồng hồ).
- **priority**: Điểm ưu tiên dựa trên hạng thành viên của khách hàng.

### Logic sắp xếp tại Kitchen UI
Hệ thống hỗ trợ Chef ra quyết định bằng cách sắp xếp danh sách PENDING:
1. `priority` (Giảm dần): Khách VIP được phục vụ trước.
2. `deadlineTime` (Tăng dần): Các món sắp hết thời gian cam kết được đưa lên trên.
3. `orderedAt` (Tăng dần): Đảm bảo tính công bằng (First-Come First-Served) giữa các khách cùng hạng.

---

## 4. Hệ thống Thăng hạng & Tặng thưởng (Membership Flow)

Quy trình xử lý tự động sau khi thanh toán thành công:
1. **Cập nhật Spending**: Cộng dồn số tiền thanh toán vào `totalSpending` của User.
2. **Tích lũy Điểm**: `Points = (Amount / ConfigRate) * EarningRate(Tier)`.
3. **Kiểm tra Thăng hạng**: Nếu `totalSpending >= minSpending` của hạng cao hơn, hệ thống tự động:
    - Cập nhật hạng mới.
    - Lưu lịch sử vào `MembershipHistory`.
    - Tặng Voucher thăng hạng (`isLevelUpReward`).

---

## 5. Chỉ số Hiệu suất (Performance Analytics)

- **Kitchen Efficiency**: So sánh `ActualCookingTime` với `BaseCookingTime`.
- **Delay Ratio**: Đánh giá độ chính xác của hệ thống ước lượng qua `ActualTime / EstimatedTime`.
- **SLA Fulfillment**: Tỷ lệ phần trăm các món hoàn thành trước `deadline_time`.

---

## 6. Phạm vi áp dụng (Business Scope)

Hệ thống phân tách rõ ràng luồng xử lý giữa các loại đơn hàng để đảm bảo tính chính xác của dữ liệu:

- **DINE_IN (Tại nhà hàng)**: Áp dụng đầy đủ mô hình Hàng đợi ưu tiên, Công thức ước lượng và Deadline. Đây là đối tượng chính của hệ thống quản trị kỳ vọng và hỗ trợ ra quyết định (DSS).
- **ONLINE (Giao hàng/Mang về)**: Không áp dụng các công thức tính toán thời gian chờ dựa trên Throughput của bếp tại chỗ. Các trường dữ liệu `estimateTime` và `deadlineTime` sẽ được để trống (`null`) để tránh gây nhiễu cho các thuật toán phân tích hiệu suất tại nhà hàng.

---

## 7. Chiến lược Hỗ trợ Ra quyết định (DSS Strategy)

Hệ thống không chỉ thu thập dữ liệu mà còn chuyển hóa chúng thành các đề xuất hành động cho Admin nhằm tối ưu hóa vận hành và giữ chân khách hàng (Customer Retention).

### 7.1. Cân bằng tải chủ động (Load Balancing)
- **Cơ chế**: Dựa trên `pendingLoad`, hệ thống tự động cung cấp dữ liệu cho Chatbot để thực hiện luồng "Demand Shifting".
- **Hành động**: Gợi ý các món có thời gian nấu nhanh hoặc các khu vực bếp đang rảnh để giảm áp lực cho các khu vực đang quá tải.

### 7.2. Quản trị rủi ro rời bỏ (Churn Risk Mitigation)
- **Cơ chế**: Theo dõi mốc `deadlineTime` cho từng bàn. 
- **Hành động**: Khi một bàn có món quá hạn > 10 phút, hệ thống gửi cảnh báo (Alert) tới Tablet của Quản lý để thực hiện "Service Recovery" (xin lỗi trực tiếp hoặc tặng coupon) ngay trước khi khách hàng cảm thấy quá khó chịu.

### 7.3. Hiệu chuẩn năng suất (Productivity Calibration)
- **Cơ chế**: So sánh `Delay Ratio` giữa các ngày trong tuần.
- **Hành động**: Tự động đề xuất Admin điều chỉnh thông số `KITCHEN_CAPACITY` cho các khung giờ đặc thù (ví dụ: giờ ăn trưa văn phòng cần throughput nhanh hơn, giờ ăn tối gia đình có thể thư thả hơn).

### 7.4. Tối ưu hóa Thực đơn (Menu Optimization)
- **Cơ chế**: Phân tích các món thường xuyên có `Delay Ratio` cao nhất (Nút thắt cổ chai).
- **Hành động**: Hỗ trợ Admin đưa ra quyết định loại bỏ món, thay đổi công thức nấu hoặc đầu tư thêm trang thiết bị cho trạm bếp (Station) phụ trách món đó.
