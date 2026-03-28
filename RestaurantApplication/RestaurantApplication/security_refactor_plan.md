# 🛡️ Tổng hợp Lỗi và Kế hoạch Refactor Hệ thống Spring Security

Cảm ơn bạn đã tin tưởng. Dưới đây là bản phân tích kiến trúc (Architectural Review) đánh giá các "lỗ hổng" logic mà hệ thống xác thực (JWT + Spring Security) của bạn đang mắc phải, đi kèm là kế hoạch (Plan) tái cấu trúc chuẩn thiết kế (Best Practices) với tư duy của Senior Engineer.

## User Review Required

> [!IMPORTANT]
> Hãy đọc qua các vấn đề cốt lõi dưới đây. Mình đã thiết kế một hướng giải quyết triệt để và tách biệt cho từng vấn đề. Sau khi bạn xem xong, **nếu bạn đồng ý**, mình sẽ tự động áp dụng các đoạn Code cần thiết thay bạn.

---

## 1. Các "Lỗ hổng" & Vấn đề Kiến trúc hiện tại (Anti-Patterns)

### 1.1. Lỗi Bug Core: Token JWT hết hạn ngay lập tức (1.5 phút) 🚨
- **Hiện tượng:** Mọi user đăng nhập qua Google đều "tắt thở" phiên đăng nhập ở giây 87. API `/api/reservation/add` luôn báo 403 Forbidden thay vì thành công.
- **Nguyên nhân:** Biến môi trường `JWT_EXPIRATION=86400` đếm theo Giây (Seconds - tương đương 1 ngày). Tuy nhiên, dòng code sinh JWT `new Date(System.currentTimeMillis() + jwtConfig.getExpiration())` lại của Java lại sử dụng hệ đo lường là **Mili-giây (ms)**.
- **Hệ quả:** Vì bạn cộng trực tiếp số `86400` vào mili-giây, Token chỉ "sống" thọ vỏn vẹn `86.4 giây`. Thời gian người dùng thao tác đặt bàn trên UI là Token đã phơi xác.

### 1.2. Kiến trúc Xử lý Lỗi: Che Giấu Exception (Swallowing Exceptions) ⚠️
- **Hiện tượng:** Nếu Token hết hạn hoặc sai chữ ký, hệ thống cứ im thin thít đẩy sang dây chuyền tiếp theo của FilterChain.
- **Nguyên nhân:** Khối `catch (Exception e)` bên trong `JwtAuthenticationFilter.java` đang bị bỏ trống (`{ // Token không hợp lệ }`). 
- **Hệ quả:** Khi gửi cho Spring Security xử lý, bản thân framework sẽ chốt lỗi `403 Forbidden` cụt lủn do thiếu Context Role. Phía máy khách (React, Mobile App) hoàn toàn bị "mù" và không biết khi nào cần chạy luồng `Refresh Token` hoặc bắt đăng nhập lại.

### 1.3. Lỗi Hiệu Năng (Performance): Spam truy vấn Database (N+1 Problem) 🐢
- **Hiện tượng:** Tại các REST API trong Controller, hệ thống chọc và query lại SQL Database liên tục để nhận dạng User.
- **Nguyên nhân:** Cơ chế giải mã trích xuất dư thừa:
  1. Client gửi `Token`. File `JwtAuthenticationFilter` tốn công băm tách chuỗi lấy Role.
  2. Filter không nạp đủ chi tiết vào `SecurityContext` (chỉ nạp username dạng chuỗi).
  3. Ở dưới tầng Controller (như `ReservationController`), mã nguồn gọi `authenticateService.getCurrentUser(token)`. Lệnh này băm tách `Token` lại lần 2 và dùng `username` chọc xuống MySQL (`SELECT *`) lại lần nữa.
- **Hệ quả:** Lãng phí cực lớn tài nguyên CPU server và IO trên Database, làm mất đi sức mạnh "stateless (phi trạng thái)" vô song của JWT (Chỉ dùng chữ ký số mà không cần tìm DB).

### 1.4. Thiết kế Context: Bỏ sót thông tin Request HTTP (Traceability) 🔍
- **Hiện tượng:** Không thể dò vết thiết bị, Session, hoặc cấu hình IP.
- **Nguyên nhân:** Đối tượng `UsernamePasswordAuthenticationToken` trong Filter lúc khởi tạo bị khuyết `setDetails(new WebAuthenticationDetailsSource().buildDetails(request))`.

---

## 2. Kế hoạch Giải quyết (Proposed Changes)

Dưới đây là phương án Cấu trúc lại toàn bộ các lớp theo tư duy sạch.

### [JWT Configuration Layer]

#### [MODIFY] `JwtService.java`
- Giải quyết triệt để lỗi chênh lệch thời gian. Đưa logic `expirationTime` về đúng chuẩn mili-giây. Sẽ được sửa thành: `System.currentTimeMillis() + (jwtConfig.getExpiration() * 1000L)`.

### [Security Filter Chain]

#### [MODIFY] `JwtAuthenticationFilter.java`
- **Graceful Fallback:** Tái cấu trúc lại khối `try-catch`. Nếu có Token Expired hoặc lỗi chữ ký, Filter chặn đứng yêu cầu của Client, đồng thời ném lại ngay lập tức mã trả về `401 Unauthorized` dạng JSON (với thông điệp báo `Token đã quá hạn!`), để Client biết đường Logout.
- **Audit Logging Context:** Thêm dòng gép thông tin HTTP Request cho Token Details: `authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));`.
- Bổ sung `UserId` vào Context của `UsernamePasswordAuthenticationToken` thông qua Custom Object (để không dùng DB truy xuất nữa).

### [Controllers & Services Layer]

#### [MODIFY] `AuthenticateService.java`
- Khai tử hoặc tối ưu lại hàm `getCurrentUser(token)` vì tác dụng của nó khiến thao tác Request bị chậm đi do gọi Database thừa thãi mỗi lần User gởi request.

#### [MODIFY] Các tệp Controller (`ReservationController.java`...)
- Chỉnh sửa thủ tục nạp Người dùng từ: 
  `User currentUser = authenticateService.getCurrentUser(...)`
- Rút gọn lại thành sử dụng thẳng Data được tiêm qua vòng xác nhận bằng lệnh:
  `String username = SecurityContextHolder.getContext().getAuthentication().getName();`
- Truy vấn DB chỉ trong những trường hợp cực kỳ cần thiết như Cập nhật tiền, Thông tin giỏ hàng.

---

## Open Questions

> [!WARNING]
> Mình đã liệt kê tổng hợp phía trên giải pháp Fix tận gốc vấn đề. Có 2 hướng cho bạn chọn:
> 1. Mình **Chỉ fix lỗi thời gian (Expiration 1.5 phút)** để bạn kịp Submit ứng dụng nếu bài tập Đồ án sắp đến hạn.
> 2. Mình **Refactor lại toàn bộ Hệ thống (Sửa luôn Filter, Controller và Xử lý Lỗi)** dựa theo kế hoạch này để ứng dụng đạt chuẩn đẳng cấp Web Enterprise thực sự.
> 
> Hãy ra chỉ thị, mình sẽ tiến hành triển khai sửa Code ngay lập tức!
