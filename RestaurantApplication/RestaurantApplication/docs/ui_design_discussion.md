# Đề xuất Thiết kế UI cho Module Membership & Voucher

Tài liệu này dùng để thảo luận và thống nhất các phương án giao diện cho hệ thống Thành viên và Voucher trên cả hai nền tảng: **Admin Client** (Quản trị) và **Restaurant Client** (Khách hàng).

---

## I. ADMIN CLIENT (Dành cho Quản trị viên)

### 1. Vị trí Menu
- **Đề xuất:** Thêm một nhóm menu mới mang tên **"Thành viên & Ưu đãi"** (Loyalty & Rewards).
- **Lý do:** Tách biệt với quản lý sản phẩm và đơn hàng để dễ dàng quản lý các chương trình Marketing.

### 2. Các trang chức năng
- **Trang Quản lý Hạng (Membership Tiers):**
    - **UI:** Dạng danh sách thẻ (Grid Cards) thể hiện rank (New, Silver, Gold).
    - **Tính năng:** Inline edit hoặc Modal để sửa `Mức chi tiêu tối thiểu`, `Tỷ lệ tích điểm`, `Mô tả quyền lợi`.
- **Trang Quản lý Voucher:**
    - **UI:** Bảng dữ liệu (Data Table) hỗ trợ tìm kiếm theo mã, lọc theo trạng thái (Đang chạy, Sắp chạy, Kết thúc).
    - **Form tạo mới:** 
        - Thông tin cơ bản: Mã code, Tên, Mô tả.
        - Cơ chế giảm: Loại giảm (Phần trăm / Tiền mặt), Giá trị giảm, Giảm tối đa (nếu là %).
        - Điều kiện: Giá trị đơn tối thiểu, Hạng áp dụng, Loại đơn (Tại chỗ / Online).
        - Thời gian: Ngày bắt đầu, Ngày kết thúc.
        - Flag: `Voucher chào mừng (Welcome)`, `Thưởng thăng hạng (Level Up)`.
- **Báo cáo Điểm & Điều chỉnh (Points Management):**
    - **UI:** Bảng lịch sử giao dịch điểm toàn hệ thống.
    - **Tính năng đặc biệt:** Một công cụ cho phép Admin nhập `UserID/Username`, xem điểm hiện tại và thực hiện cộng/trừ điểm thủ công kèm lý do (ví dụ: Đền bù sai sót đơn hàng).

---

## II. RESTAURANT CLIENT (Dành cho Khách hàng)

### 1. Vị trí truy cập
- **Đề xuất:** Một trang riêng biệt **"Ưu đãi của tôi"** truy cập từ Sidebar hoặc Header.

### 2. Các trang/thành phần chức năng
- **Dashboard Thành viên (Membership Card):**
    - **Thiết kế:** Một thẻ ảo (Virtual Card) có hiệu ứng Gradient theo màu hạng (Silver - Bạc, Gold - Vàng).
    - **Thông tin:** Tên khách hàng, Hạng, Điểm tích lũy, Tổng chi tiêu.
    - **Tiến trình:** Progress Bar hiển thị mục tiêu tiếp theo (Ví dụ: "Còn 500,000đ nữa để lên hạng Gold").
- **Ví Voucher (My Wallet):**
    - **UI:** Danh sách Voucher của User dưới dạng các Coupon đứt nét.
    - **Trạng thái:** Có nhãn dán "Sẵn dùng", "Đã dùng", "Hết hạn".
- **Sàn đổi Voucher (Redeem Points):**
    - **UI:** Danh sách các Voucher mà hệ thống đang cấu hình cho phép đổi điểm.
    - **Tính năng:** Nút "Đổi điểm" với thông tin `Points Required`.
- **Lịch sử hoạt động:**
    - **UI:** Danh sách dòng thời gian (Timeline) ghi lại các lần tích điểm từ hóa đơn hoặc tiêu điểm đổi quà.

---

## III. CÂU HỎI THẢO LUẬN (Vui lòng phản hồi bên dưới)

1. **Layout Admin:** Bạn muốn nhóm mục này vào một Menu cha (Collapse) hay để rời rạc như các mục hiện tại? -> tôi muốn sidebar có thêm một tab Thành Viên và Ưu Đãi
2. **Luồng đổi Voucher:** Sau khi đổi thành công, hệ thống nên tự động chuyển về "Ví Voucher" hay hiển thị mã Voucher ngay tại chỗ để khách hàng copy? -> Chuyển về ví voucher và thông báo toast popup
3. **Màu sắc thứ cấp:** Bạn có muốn định nghĩa bộ màu đại diện cho 3 hạng (New, Silver, Gold) không? -> Có
4. **Thông báo:** Có cần hiển thị thông báo "Nổi" (Toast) khi khách hàng vừa đạt đủ điểm thăng hạng trong lúc đang xem UI không? -> Không cần

---

> [!TIP]
> **Gợi ý:** Chúng ta có thể sử dụng các thư viện Icon như `lucide-react` (cho Admin) và `react-icons` (cho Restaurant) vốn đã có sẵn trong project. -> ok

---
**Bạn có thể phản hồi trực tiếp các ý kiến của bạn vào file này hoặc chat với mình nhé!**
