# TÀI LIỆU TỔNG HỢP: THIẾT KẾ MODULE VOUCHER & HẠNG THÀNH VIÊN

Tài liệu này tổng hợp toàn bộ các thực thể, luồng nghiệp vụ và chiến lược kỹ thuật cho phân hệ quản lý Voucher và Hạng thành viên của dự án Nhà hàng.

---

## I. KIẾN TRÚC THỰC THỂ (ERD)

### 1. MembershipTier (Hạng thành viên)
Quản lý các cấp bậc khách hàng.
- `id`: Primary Key (AUTO_INCREMENT).
- `tier_name`: Tên hạng (New Member, Silver, Gold).
- `min_spending`: Ngưỡng chi tiêu để đạt hạng này (Kiểu `DECIMAL(19,2)` để đồng bộ với `BigDecimal`).
- `point_earning_rate`: Tỷ lệ tích điểm cộng thêm (Ví dụ: 1.0, 1.2, 1.5).
- `description`: Mô tả đặc quyền.
*Lưu ý: Admin có thể quản lý, sửa đổi hoặc thêm mới các hạng này qua giao diện quản trị.*

### 2. User (Cập nhật)
Lưu trữ thông tin thành viên hiện tại.
- `membership_tier_id`: Foreign Key đến hạng hiện tại.
- `total_spending`: Tổng số tiền đã tiêu lũy kế (để thăng hạng).
- `loyalty_points`: Số điểm hiện có.

### 3. MembershipHistory (Lịch sử thăng hạng)
Lưu vết các mốc thăng hạng để làm báo cáo Marketing.
- `id`: Primary Key.
- `user_id`: Foreign Key.
- `old_tier_id`: Hạng cũ.
- `new_tier_id`: Hạng mới.
- `changed_at`: Ngày thay đổi.

### 4. Voucher (Định nghĩa Voucher)
Chi tiết các chương trình khuyến mãi.
- `id`: Primary Key.
- `voucher_code`: Mã giảm giá (VD: SILVER2024).
- `voucher_type`: `PERCENTAGE` hoặc `FIXED`.
- `discount_value`: Giá trị giảm.
- `max_discount_amount`: Giới hạn giảm tối đa.
- `min_order_value`: Đơn tối thiểu.
- `start_date` & `end_date`: Thời hạn.
- `target_tier_id`: Chỉ dành cho hạng nào (Optional).
- `is_new_member_voucher`: Tặng khi đăng ký.
- `is_level_up_reward`: Tặng khi thăng hạng.
- `points_required`: Điểm cần để đổi (nếu có).
- `apply_type`: `ONLINE`, `DINE_IN`, hoặc `BOTH`.

### 5. UserVoucher (Kho Voucher của khách)
- `user_id`, `voucher_id`, `is_used`, `acquired_at`, `used_at`.

### 6. PointTransaction (Lịch sử điểm thưởng) - TÍNH MINH BẠCH CAO
- `id`: Primary Key.
- `user_id`: Foreign Key.
- `base_points`: Điểm tính từ Bill.
- `bonus_points`: Điểm thưởng thêm nhờ Hạng.
- `amount`: Tổng điểm thay đổi.
- `transaction_type`: `EARN`, `REDEEM`, `ADJUST`.
- `description`: Text chi tiết (VD: "Tích 12 điểm - 10 gốc + 2 thưởng VIP").
- `bill_id`: ID hóa đơn liên quan.

---

## II. LUỒNG NGHIỆP VỤ (BUSINESS LOGIC)

1. **Giai đoạn Đăng ký:**
   - Hệ thống tự động gán hạng "New Member".
   - Tặng Voucher dành cho người mới (nếu có cấu hình).

2. **Giai đoạn Thanh toán (Online/Tại bàn):**
   - Áp dụng Voucher (nếu có) -> Tính số tiền sau cùng (`total_amount`).
   - Sau khi thanh toán thành công:
     - Tính điểm: `Base = Total * Rate_Gốc`, `Bonus = Base * (Earning_Rate - 1)`.
     - Lưu giao dịch điểm và thăng hạng nếu tổng chi tiêu đạt ngưỡng.
     - Tặng Voucher thăng hạng tương ứng.

3. **Giai đoạn Đổi điểm:**
   - Khách hàng có thể dùng `loyalty_points` để đổi lấy các Voucher có `points_required > 0`.

---

## III. CHIẾN LƯỢC KỸ THUẬT & HIỆU NĂNG

### 1. Đánh Index (MySQL)
Sử dụng SQL để tăng tốc độ truy vấn:
```sql
ALTER TABLE vouchers ADD INDEX idx_voucher_code (voucher_code);
ALTER TABLE point_transactions ADD INDEX idx_user_id (user_id);
ALTER TABLE user_vouchers ADD INDEX idx_user_status (user_id, is_used);
```

### 2. Kiểu dữ liệu tương thích MySQL
Toàn bộ các trường tiền tệ, điểm số sẽ sử dụng **`BigDecimal`** trong Java và mapping với kiểu **`DECIMAL(19,2)`** trong MySQL để đảm bảo độ chính xác tuyệt đối, tránh sai số trong tính toán tài chính.

---

## IV. KẾ HOẠCH TRIỂN KHAI DỮ LIỆU

1. **Khởi tạo (Initial Setup):** Sử dụng **SQL Script** để tạo cấu trúc bảng và insert 3 hạng thành viên mặc định (New, Silver, Gold).
2. **Quản lý Admin:** Phát triển đầy đủ bộ API CRUD cho `MembershipTier` để Admin có toàn quyền chỉnh sửa ngưỡng chi tiêu, tỷ lệ tích điểm hoặc thêm các hạng mới qua giao diện.

---

## V. CÁC KỊCH BẢN KIỂM THỬ (TEST SCENARIOS)

### 1. UC01: Đăng ký & Tặng Voucher chào mừng
- **Điều kiện:** Hệ thống có cấu hình Voucher với `is_new_member_voucher = TRUE`.
- **Luồng chính:**
  1. Người dùng thực hiện đăng ký tài khoản mới qua API hoặc OAuth2.
  2. Kiểm tra: Tài khoản mới được gán mặc định `membership_tier_id` của hạng "New Member".
  3. Kiểm tra: Trong bảng `user_voucher`, tài khoản mới nhận được Voucher "WELCOME50".

### 2. UC02: Áp dụng Voucher & Tính toán hóa đơn
- **Điều kiện:** Đơn hàng có giá trị 200,000đ. Áp dụng Voucher giảm 10% (tối đa 50k).
- **Công thức tính:**
  - `SubTotal`: 200,000đ.
  - `Discount`: 10% * 200,000 = 20,000đ (Dưới 50k nên giữ nguyên 20k).
  - `VAT (10%)`: (200,000 - 20,000) * 0.1 = 18,000đ.
  - `TotalAmount`: 200,000 - 20,000 + 18,000 = 198,000đ.
- **Kiểm tra:** Các trường trong bảng `bill` phải khớp chính xác với kết quả tính toán trên.

### 3. UC03: Thanh toán & Tích điểm theo hạng
- **Điều kiện:** Khách hàng hạng "Silver" (`point_earning_rate = 1.2`). Hóa đơn thanh toán thành công 1,000,000đ.
- **Luồng chính:**
  1. Hệ thống tính `base_points` = 1,000,000 / 10,000 (giả sử 10k = 1 điểm) = 100 điểm.
  2. Tính `bonus_points` = 100 * (1.2 - 1.0) = 20 điểm.
  3. Tổng tích lũy: 120 điểm.
  4. Kiểm tra: Bảng `point_transaction` ghi nhận 1 dòng loại `EARN` với đầy đủ thông tin gốc và thưởng.

### 4. UC04: Thăng hạng tự động & Tặng thưởng
- **Điều kiện:** Khách hàng đang có `total_spending` = 950,000đ (Hạng New Member). Thanh toán đơn mới 200,000đ.
- **Luồng chính:**
  1. Sau thanh toán, `total_spending` = 950,000 + 200,000 = 1,150,000đ.
  2. Ngưỡng thăng Silver là 1,000,000đ -> Hệ thống kích hoạt thăng hạng.
  3. Kiểm tra: `User.membership_tier_id` cập nhật lên ID của "Silver".
  4. Kiểm tra: Bảng `membership_history` ghi nhận sự kiện thăng hạng.
  5. Kiểm tra: Tự động chèn 1 dòng vào `user_voucher` tặng mã "SILVER10".

### 5. UC05: Đổi điểm thưởng lấy Voucher
- **Điều kiện:** Khách có 500 điểm. Muốn đổi Voucher cần 200 điểm.
- **Luồng chính:**
  1. Khách gọi API đổi điểm.
  2. Kiểm tra: `User.loyalty_points` còn 300 điểm.
  3. Kiểm tra: Thêm Voucher mới vào `user_voucher` cho khách.
  4. Kiểm tra: Ghi log `PointTransaction` loại `REDEEM` với số điểm -200.

### 6. UC06: Xử lý lỗi thanh toán VNPay (Rollback)
- **Luồng chính:**
  1. Khách đặt đơn, đã áp dụng Voucher (Voucher bị đánh dấu `is_used = TRUE` hoặc lưu vào Bill tạm).
  2. Cổng VNPay trả về kết quả **Thanh toán thất bại**.
  3. Kiểm tra: Hệ thống không được tăng `total_spending`, không tích điểm.
  4. Kiểm tra: Voucher đã áp dụng phải được hoàn lại (set `is_used = FALSE`) để khách dùng lại.

### 7. UC07: Ràng buộc của Voucher
- **Kiểm tra các trường hợp chặn:**
  - Voucher hết hạn (`end_date` < hiện tại).
  - Đơn hàng không đủ giá trị tối thiểu (`min_order_value`).
  - Voucher chỉ dành cho hạng Gold nhưng khách hạng Silver dùng.
  - Voucher loại `ONLINE` nhưng áp dụng cho đơn tại bàn (`DINE_IN`).

---
*Tài liệu này được soạn thảo dựa trên kết quả thảo luận của Antigravity và người dùng.*
