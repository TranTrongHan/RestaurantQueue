# Implementation Plan: Chatbot gợi ý món ăn tại bàn (Tablet Simulator)

Dự án này triển khai một trợ lý ảo tư vấn ẩm thực tích hợp trực tiếp trên Tablet của từng bàn ăn. Chatbot giúp khách hàng đưa ra quyết định chọn món dựa trên sở thích cá nhân và dữ liệu thực đơn thời gian thực.

## Chốt phương án thiết kế (Final Review)

> **Context-Aware**: Chatbot sẽ nhận diện khách hàng thông qua `OrderSession` hiện tại (Session Token). 
> **Linh hoạt kiểm thử**: Cho phép sử dụng trực tiếp `userId` thay cho `sessionToken` để hỗ trợ quá trình phát triển và kiểm thử dễ dàng hơn (không cần trải qua luồng check-in phức tạp).
> 
> **Persistence Strategry**: 
> - **Hội thoại**: Lưu trên Redis Stack trong **1 tiếng** (TTL).
> - **An toàn**: Sử dụng Docker Volume để đảm bảo history không mất khi container restart.
> - **Dài hạn**: Sở thích khách hàng (`foodPreference`) được lưu bền vững trong MySQL.

## Proposed Changes

### 1. Hạ tầng & Persistance (Infrastructure)

#### [NEW] [docker-compose.yml](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/docker-compose.yml)
- Triển khai Redis Stack với cơ chế mount volume để giữ dữ liệu.

#### [MODIFY] [application.yml](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/resources/application.yml)
- Bổ sung `gemini.api.key` được inject từ biến môi trường.

#### [MODIFY] [EmbeddingService.java](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/service/EmbeddingService.java)
- Thay đổi cơ chế khởi tạo `Client` để sử dụng `@Value` từ file cấu hình thay vì gán cứng key.

---

### 2. Dữ liệu & Giao tiếp (DTOs)

#### [NEW] [ChatRequest.java](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/dto/request/ChatRequest.java)
- `ChatRequest`: Chứa `userMessage` và `history` (nếu có).
- `ChatResponse`: Chứa `aiMessage` và trạng thái thành công.

---

### 4. Logic xử lý (ChatbotService)

#### [MODIFY] [ChatbotService.java](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/service/ChatbotService.java)
- **Luồng xác thực khách hàng (Dual-path Identification):**
    1. Nếu có `sessionToken`: Truy xuất User từ `OrderSession`.
    2. Nếu không có `sessionToken` mà có `userId`: Truy xuất trực tiếp User từ Database (phục vụ Testing).
    3. Lấy `foodPreference` lịch sử và tiến hành RAG.
    3. Kết hợp `history` chat ngắn hạn từ Redis.
    4. Tìm kiếm thực đơn phù hợp qua Vector Search.
    5. AI trả lời bằng **Tiếng Việt**, phong cách "Phục vụ chuyên nghiệp".
    6. **Tự học**: AI tự động trích xuất sở thích mới từ cuộc chat để cập nhật vào MySQL.


---

### 4. Giao diện lập trình (Controller Layer)

#### [NEW] [ChatbotController.java](file:///d:/Study/PTHTWeb/DoAn/RestaurantQueue/RestaurantApplication/RestaurantApplication/src/main/java/com/tth/RestaurantApplication/controller/ChatbotController.java)
- Endpoint: `POST /api/chat`
- Nhận JSON request và trả về phản hồi từ AI.

---

### 5. Tối ưu hóa API (Gemini Free Tier Optimization)

Để tránh lỗi **429 Too Many Requests** và vượt hạn mức (Quota) của gói miễn phí, các thay đổi sau được áp dụng:

#### 1. Gộp các cuộc gọi API (Consolidating API Calls)
- **Trước**: 1 tin nhắn khách gửi = 3 lần gọi API (1 Embedding + 1 Chat + 1 Extraction).
- **Sau**: 1 tin nhắn khách gửi = **2 lần gọi API** (1 Embedding + 1 Chat có tích hợp Extraction).
- **Kỹ thuật**: Sử dụng System Prompt yêu cầu AI trả về kết quả kèm theo thẻ sở thích (ví dụ: `[PREF: <sở thích>]`) ở cuối câu trả lời. Backend sẽ dùng Regex để tách và cập nhật DB.

#### 2. Quản lý Context & Token (Token Efficiency)
- **Giới hạn RAG**: Chỉ gửi **tối đa 3 món ăn** gợi ý từ Vector Search vào Prompt thay vì 5 món để giảm `input_token_count`.
- **Rút gọn mô tả**: Tự động cắt bớt mô tả món ăn nếu quá dài trước khi đưa vào context.

#### 3. Ngữ cảnh hội thoại (Contextual RAG)
- **Vấn đề**: Khi khách hỏi câu tiếp nối ("Món đó có cay không?"), câu này không có từ khóa về món ăn cụ thể nên tìm kiếm Vector sẽ bị sai.
- **Giải pháp**: **Query Expansion**. Hệ thống tự động gộp tin nhắn cuối cùng của khách trong quá khứ vào câu hỏi hiện tại trước khi gửi lên Redis tìm kiếm.
- **Kết quả**: Bot hiểu được "món đó", "nó", "loại này" đang ám chỉ món ăn nào đã thảo luận trước đó.

---

## Senior Discussion Summary

Chúng ta đã thống nhất các phương án tối ưu nhất cho nhà hàng:
- **Tốc độ & An toàn**: Ưu tiên dùng Redis (lưu Context hội thoại) có Volume mount.
- **Tính năng**: Tập trung vào tư vấn chọn món tại bàn ăn (Tablet context).
- **Trải nghiệm**: Bot tự học sở thích khách hàng, phản hồi trọn gói bằng Tiếng Việt.

## Verification Plan

### Automated Tests
- Kiểm tra kết nối Redis persistence (Tắt/Bật Container xem history còn không).
- Test luồng cập nhật `foodPreference` tự động sau khi chat.

### Manual Verification
- Dùng Tablet Simulator chat: "Gợi ý cho tôi món khai vị nhẹ nhàng".
- Kiểm tra tính chính xác của menu được bot liệt kê ra.

### Automated Tests
- Kiểm tra `ChatbotService` xem có gọi đúng các thành phần hay không.
- Thực hiện Vector Search xem có trả về đúng dữ liệu món ăn mẫu không.

### Manual Verification
- Sử dụng Postman gửi câu hỏi: "Tôi thích ăn hải sản, quán có món gì ngon?"
- Kiểm tra xem AI có liệt kê đúng các món hải sản có trong Redis không hay là nó tự "bịa" ra món mới.
- Kiểm tra khả năng xử lý các câu hỏi không liên quan (ví dụ: "Thời tiết hôm nay thế nào?"). AI nên lịch sự từ chối và tập trung vào ẩm thực.
