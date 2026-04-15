# Implementation Plan - Tối ưu Chatbot Prompt & Ứng dụng foodPreference

## Background

Sau khi review `ChatbotService.java`, có 2 vấn đề lớn cần giải quyết:

1. **System Prompt chưa đủ mạnh**: Thiếu rules xử lý câu hỏi ngoài lề, AI có thể "bịa" món, tag `[PREF]` có thể xuất hiện ở giữa câu trả lời.
2. **`foodPreference` bị lãng phí**: Sở thích được ghi nhận vào MySQL nhưng chỉ được đưa vào prompt như text thô — AI có thể bỏ qua. Không có gì "bắt buộc" AI phải dùng sở thích này để filter kết quả.

## User Review Required

> [!IMPORTANT]
> Thay đổi lớn nhất là bổ sung một Vector Search thứ 2 dựa trên `foodPreference`.
> Mỗi request chat sẽ có thể dùng **3 lần gọi API** (1 Embedding cho câu hỏi + 1 Embedding cho preference + 1 Chat).
> Để tối ưu, tôi sẽ thêm kiểm tra: chỉ search preference nếu khách đang hỏi về việc chọn món (không phải hỏi thông tin đơn thuần).
> Xét tổng thể đây vẫn tiết kiệm hơn phương án cũ (3 calls: embed + chat + extract riêng biệt).

> [!NOTE]
> Không thêm bất kỳ dependency mới nào. Chỉ chỉnh sửa `ChatbotService.java` và cách build prompt.

## Proposed Changes

### [MODIFY] ChatbotService.java

#### 1. Cải thiện System Instruction
Thay system instruction hiện tại bằng version đầy đủ với đủ rules:
- Hướng dẫn cách trả lời khi không tìm thấy món
- Cấm tự bịa món không có trong danh sách
- Yêu cầu đặt `[PREF: ...]` ở **dòng cuối** sau dấu `---` để tránh lẫn vào câu trả lời
- Hướng dẫn từ chối lịch sự câu hỏi ngoài lề ẩm thực

#### 2. Bổ sung Preference-Based Vector Search (Proactive Recommendation)
Thêm private method `buildPreferenceContext(User user)`:
- Nếu `user.getFoodPreference()` không rỗng → chạy `recommendFood.recommendFoods(preference)` để lấy tối đa 3 món phù hợp với sở thích lịch sử
- Kết quả được đưa vào một section riêng `=== GỢI Ý PHÙ HỢP VỚI BẠN ===` trong prompt

#### 3. Cập nhật `buildPrompt()` để dùng preference context
Prompt sẽ có cấu trúc:
```
=== THÔNG TIN KHÁCH HÀNG ===
...

=== MÓN GỢI Ý THEO CÂU HỎI ===
(Kết quả Vector Search từ câu hỏi hiện tại)

=== MÓN PHÙ HỢP VỚI SỞ THÍCH CỦA BẠN ===  ← MỚI
(Kết quả Vector Search từ foodPreference - chỉ hiển thị nếu có preference)

=== LỊCH SỬ TRÒ CHUYỆN ===
...

=== CÂU HỎI ===
...
```

#### 4. Fix vị trí `[PREF]` tag
Hướng dẫn AI đặt tag `[PREF]` **sau tất cả nội dung chính**, cách nhau bởi `---`. Backend regex đã có sẵn để xử lý.

## Verification Plan

### Manual Verification
1. Chat: "Tôi thích hải sản" → AI lưu preference.
2. Lần sau chat: "Cho tôi chọn món nào?" → Prompt sẽ tự động có mục "Món phù hợp sở thích" chứa các món hải sản → AI nên gợi ý chúng trước.
3. Chat: "Thời tiết hôm nay ra sao?" → AI lịch sự từ chối và redirect về menu.
4. Chat: "Có món nào ngon không?" → AI không tự bịa, chỉ liệt kê từ danh sách cung cấp.
