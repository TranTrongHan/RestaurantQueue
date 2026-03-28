# 🚀 Hướng dẫn triển khai Push Notification (Web Push & VAPID)

Tài liệu này hướng dẫn cách phối hợp giữa **React (Frontend)** và **Spring Boot (Backend)** để gửi thông báo đẩy đến trình duyệt của người dùng ngay cả khi họ không mở tab ứng dụng.

---

## 🏗️ Kiến trúc tổng quan
1. **Frontend:** Đăng ký Service Worker -> Xin quyền -> Lấy `PushSubscription` -> Gửi cho Backend.
2. **Backend:** Lưu `PushSubscription` vào Database (Map với `userId`).
3. **Trigger:** Khi có sự kiện (ví dụ: Bàn sẵn sàng) -> Backend lấy các Subscriptions của User -> Gửi yêu cầu qua Web Push Service (Google/Mozilla/Apple).

---

## 🔑 Chuẩn bị (Prerequisites)
Cần tạo cặp khóa **VAPID Keys** (Public Key & Private Key).
- **Public Key:** Dùng ở Frontend để đăng ký.
- **Private Key:** Dùng ở Backend để ký các yêu cầu gửi thông báo.
- *Tip: Có thể dùng tool `web-push` (NPM) để gen nhanh cặp khóa này.*

---

## 💻 Nhiệm vụ của Frontend (React)

### 1. Tạo Service Worker (`public/sw.js`)
Service Worker chạy ngầm để lắng nghe sự kiện từ trình duyệt.
```javascript
// public/sw.js
self.addEventListener('push', (event) => {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/logo.png', // Đường dẫn icon
        badge: '/badge.png',
        data: { url: data.url } // Link khi click vào thông báo
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

### 2. Logic Đăng ký (Trong React Component hoặc Store)
- Kiểm tra hỗ trợ trình duyệt.
- Đăng ký `sw.js`.
- Dùng `Public Key` để lấy `Subscription Object`.
- Gọi API `POST /api/notifications/subscribe` để gửi lên backend.

---

## ⚙️ Nhiệm vụ của Backend (Spring Boot)

### 1. Thư viện hỗ trợ
Thêm dependency vào `pom.xml`:
```xml
<dependency>
    <groupId>nl.martijndwars</groupId>
    <artifactId>web-push</artifactId>
    <version>5.1.1</version>
</dependency>
```

### 2. Database Schema
Cần bảng `push_subscriptions`:
- `id` (PK)
- `user_id` (FK)
- `endpoint` (String - unique)
- `p256dh` (String)
- `auth` (String)

### 3. API Controller
Tạo endpoint nhận subscription từ FE:
```java
@PostMapping("/subscribe")
public ResponseEntity<?> subscribe(@RequestBody SubscriptionDTO dto, @AuthenticationPrincipal User user) {
    // Lưu endpoint, auth, p256dh vào DB gắn với user hiện tại
    return ResponseEntity.ok("Subscribed successfully");
}
```

### 4. Logic Gửi thông báo (Service)
Dùng `Private Key` để cấu hình `PushService` và gửi:
```java
public void sendPushNotification(User user, String title, String body) {
    List<PushSubscription> subs = subRepository.findByUser(user);
    PushService pushService = new PushService(publicKey, privateKey, subject);
    
    for (PushSubscription sub : subs) {
        Notification notification = new Notification(
            sub.getEndpoint(), sub.getUserPublicKey(), sub.getAuthAsBytes(), 
            payloadJson // { "title": "...", "body": "..." }
        );
        pushService.send(notification);
    }
}
```

---

## ⚠️ Lưu ý quan trọng (Senior Dev Tips)
1. **HTTPS là bắt buộc:** Trình duyệt chỉ cho phép Service Worker và Push Notification hoạt động trên HTTPS (ngoại trừ localhost).
2. **Apple iOS:** Chỉ hỗ trợ từ iOS 16.4 trở lên và yêu cầu ứng dụng phải được "Thêm vào màn hình chính" (PWA).
3. **Quản lý Token lỗi:** Nếu gửi thất bại với mã lỗi 410 (Gone), Backend nên xóa `Subscription` đó khỏi DB vì user đã hủy đăng ký hoặc browser đã gỡ cài đặt.
4. **Vòng đời Service Worker:** Khi bạn cập nhật file `sw.js`, trình duyệt có thể không cập nhật ngay lập tức. Cần xử lý logic skipWaiting nếu cần update gấp.
