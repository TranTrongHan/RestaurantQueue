# MASTER DESIGN: MODULE VOUCHER & HẠNG THÀNH VIÊN (FINAL)

Tài liệu này là bản tổng hợp cuối cùng, chứa đựng mọi thông số kỹ thuật và nghiệp vụ đã thống nhất để bắt đầu triển khai code.

---

## I. KIẾN TRÚC DATABASE (ERD)

### 1. Bảng chính
- **`membership_tier`**: Lưu cấu hình hạng (New, Silver, Gold).
- **`user`**: Cập nhật `membership_tier_id`, `total_spending`, `loyalty_points`.
- **`voucher`**: Định nghĩa các loại mã giảm giá, hạn dùng, ngưỡng áp dụng.
- **`user_voucher`**: Kho voucher của khách (quan hệ n-n giữa User và Voucher).
- **`point_transaction`**: Lịch sử tích/tiêu điểm (Earn/Redeem/Adjust).
- **`membership_history`**: Nhật ký thăng hạng.

---

## II. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)

### 1. Quy tắc Tích lũy
- **Tỷ lệ quy đổi:** **1,000 VNĐ = 1 điểm tích lũy**.
- **Công thức tích điểm khi thanh toán:**
  - `BasePoints = TotalAmount / 1000`.
  - `BonusPoints = BasePoints * (EarningRate - 1)`.
  - *Ví dụ: Hạng Silver (Rate 1.2), ăn hết 100k -> Nhận 100 điểm gốc + 20 điểm thưởng = 120 điểm.*

### 2. Quy tắc Voucher
- **Giới hạn:** **01 đơn hàng chỉ áp dụng tối đa 01 voucher**.
- **Điều kiện áp dụng:** Kiểm tra `min_order_value`, `start_date/end_date`, `apply_type` (Online/Dine-in) và `target_tier_id`.

### 3. Quy trình tính toán hóa đơn (VAT)
- **Thứ tự ưu tiên:** `SubTotal` (Tiền món) -> `Discount` (Trừ voucher) -> `VAT 10%` -> `TotalAmount`.
- **Công thức:** `TotalAmount = (SubTotal - Discount) * 1.1`.

### 4. Thăng hạng & Tặng thưởng
- **Kích hoạt:** Sau mỗi giao dịch thành công, hệ thống tính lại `total_spending`.
- **Thăng hạng:** Nếu đạt ngưỡng mới, cập nhật `membership_tier_id`, ghi log history và tự động tặng Voucher thăng hạng vào kho của User.

---

## III. HỆ THỐNG API (API DESIGN)

### 1. Dành cho Khách hàng (`/api/customer`)
- `GET /membership/status`: Xem hạng, chi tiêu và số điểm hiện có.
- `GET /vouchers/my-wallet`: Danh sách voucher đang sở hữu.
- `POST /vouchers/redeem/{id}`: Dùng điểm đổi lấy voucher mới.
- `GET /points/transactions`: Xem lịch sử biến động điểm.

### 2. Dành cho Quản trị (`/api/admin`)
- `CRUD /membership-tiers`: Quản lý cấu hình các hạng.
- `CRUD /vouchers`: Thiết lập các chương trình khuyến mãi/voucher.
- `GET /points/report`: Theo dõi minh bạch toàn bộ giao dịch điểm.
- `POST /points/adjust`: Điều chỉnh điểm thủ công cho khách hàng.

### 3. Xử lý Thanh toán (Inter-service)
- `validateVoucher(code)`: Trả về số tiền giảm và tính hợp lệ.
- `processLoyalty(bill)`: Tích điểm và thăng hạng sau khi thanh toán thành công.
- `rollbackLoyalty(bill)`: Hoàn lại voucher nến thanh toán lỗi (VNPay Fail).

---

## IV. CÁC KỊCH BẢN KIỂM THỬ TRỌNG TÂM

1. **UC01:** Đăng ký tài khoản nhận ngay Voucher WELCOME50.
2. **UC02:** Thanh toán đơn 500k, áp mã giảm 50k -> VAT tính trên 450k.
3. **UC03:** Khách Silver tích điểm nhanh hơn khách New Member cho cùng một giá trị đơn hàng.
4. **UC04:** Khách tiêu đạt mốc 1tr -> Hệ thống báo thăng hạng Silver và nổ code SILVER10 trong kho.
5. **UC05:** VNPay báo lỗi -> Khách vào lại kho voucher vẫn thấy mã cũ chưa bị mất.

---

Bạn vui lòng review bản "tổng hợp cuối cùng" này. Nếu đã hoàn toàn đúng ý bạn, hãy phản hồi **"Approve"** để tôi bắt đầu viết code triển khai thực tế nhé!
