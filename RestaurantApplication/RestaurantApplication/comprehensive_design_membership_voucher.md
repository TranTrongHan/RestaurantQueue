# TÀI LIỆU TỔNG HỢP: THIẾT KẾ MODULE VOUCHER & HẠNG THÀNH VIÊN

Tài liệu này tổng hợp toàn bộ các thực thể, luồng nghiệp vụ và chiến lược kỹ thuật cho phân hệ quản lý Voucher và Hạng thành viên của dự án Nhà hàng.

---

## I. KIẾN TRÚC THỰC THỂ (ERD)

### 1. MembershipTier (Hạng thành viên)
Quản lý các cấp bậc khách hàng.
- `id`: Primary Key.
- `tier_name`: Tên hạng (New Member, Silver, Gold).
- `min_spending`: Ngưỡng chi tiêu để đạt hạng này.
- `point_earning_rate`: Tỷ lệ tích điểm cộng thêm (Ví dụ: 1.0, 1.2, 1.5).
- `description`: Mô tả đặc quyền.

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

### 2. Minh bạch dữ liệu
- Luôn hiển thị rõ: "Giá trị bill -> Điểm gốc -> Điểm thưởng hạng thành viên" để khách hàng cảm thấy họ được ưu đãi đặc biệt.

---

## IV. CÁC CÂU HỎI MỞ

- [ ] Sử dụng **BigDecimal** cho tiền tệ/điểm để tránh sai số dấu phẩy động?
- [ ] Khởi tạo 3 hạng thành viên ban đầu bằng SQL Script hay viết API Admin để tạo?

---
*Tài liệu này được soạn thảo dựa trên kết quả thảo luận của Antigravity và người dùng.*
