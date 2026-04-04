package com.tth.RestaurantApplication.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.tth.RestaurantApplication.dto.response.MenuItemVectorResponse;
import com.tth.RestaurantApplication.entity.OrderSession;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.repository.OrderSessionRepository;
import com.tth.RestaurantApplication.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import redis.clients.jedis.JedisPooled;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ChatbotService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private Client client;

    private final JedisPooled jedis;
    private final RecommendFood recommendFood;
    private final UserRepository userRepository;
    private final OrderSessionRepository orderSessionRepository;

    private static final String CHAT_HISTORY_PREFIX = "chat:history:";
    private static final int HISTORY_TTL_SECONDS = 3600; // 1 tiếng
    private static final int MAX_HISTORY_ITEMS = 10;     // Lấy 10 dòng gần nhất

    public ChatbotService(JedisPooled jedis,
                          RecommendFood recommendFood,
                          UserRepository userRepository,
                          OrderSessionRepository orderSessionRepository) {
        this.jedis = jedis;
        this.recommendFood = recommendFood;
        this.userRepository = userRepository;
        this.orderSessionRepository = orderSessionRepository;
    }

    @PostConstruct
    public void init() {
        this.client = Client.builder()
                .apiKey(apiKey)
                .build();
        log.info("ChatbotService initialized with Gemini client.");
    }

    @Transactional
    public String chat(com.tth.RestaurantApplication.dto.request.ChatRequest request) {
        String sessionToken = request.getSessionToken();
        Integer userIdParam = request.getUserId();
        String userMessage = request.getUserMessage();

        User user;

        // 1. Xác thực và lấy thông tin khách hàng (Dual-path Identification)
        if (sessionToken != null && !sessionToken.isBlank()) {
            OrderSession orderSession = orderSessionRepository.findBySessionToken(sessionToken)
                    .orElseThrow(() -> new AppException(ErrorCode.ORDER_SESSION_NOT_FOUND));

            if (Boolean.FALSE.equals(orderSession.getIsActive()) ||
                    (orderSession.getExpiredAt() != null && orderSession.getExpiredAt().isBefore(LocalDateTime.now()))) {
                throw new AppException(ErrorCode.ORDER_SESSION_EXPIRED);
            }
            user = orderSession.getReservation().getUser();
        } else if (userIdParam != null) {
            user = userRepository.findById(String.valueOf(userIdParam))
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        } else {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION); // Hoặc một mã lỗi yêu cầu định danh
        }

        String userId = String.valueOf(user.getUserId());
        String historyKey = CHAT_HISTORY_PREFIX + userId;

        // 3. Lấy lịch sử chat ngắn hạn từ Redis (10 dòng cuối)
        List<String> chatHistory = jedis.lrange(historyKey, -MAX_HISTORY_ITEMS, -1);

        // 4. Tìm kiếm món ăn liên quan bằng Vector Search (RAG)
        List<MenuItemVectorResponse> recommendedFoods = recommendFood.recommendFoods(userMessage);
        String menuContext = buildMenuContext(recommendedFoods);

        // 5. Xây dựng Augmented Prompt
        String fullPrompt = buildPrompt(user, chatHistory, menuContext, userMessage);

        try {
            // 6. Gọi Gemini API (Sync, no streaming)
            GenerateContentConfig config = GenerateContentConfig.builder()
                    .systemInstruction(com.google.genai.types.Content.builder()
                            .role("user")
                            .parts(List.of(com.google.genai.types.Part.builder()
                                    .text("Bạn là một nhân viên phục vụ chuyên nghiệp, am hiểu ẩm thực. " +
                                          "Luôn trả lời bằng Tiếng Việt, thân thiện và ngắn gọn. " +
                                          "Chỉ tư vấn về món ăn và thực đơn của nhà hàng. " +
                                          "Nếu câu hỏi không liên quan đến ẩm thực, lịch sự từ chối.")
                                    .build()))
                            .build())
                    .build();

            GenerateContentResponse response = client.models.generateContent(
                    "gemini-2.0-flash", fullPrompt, config);
            String aiResponse = response.text();

            // 7. Cập nhật lịch sử chat vào Redis
            saveHistoryToRedis(historyKey, userMessage, aiResponse);

            // 8. AI trích xuất sở thích và cập nhật Profile User (Async-safe)
            extractAndUpdatePreference(user, userMessage, aiResponse);

            log.info("Chat completed for userId={}", userId);
            return aiResponse;

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi khi gọi Gemini API cho userId={}: {}", userId, e.getMessage());
            return "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Bạn vui lòng thử lại sau nhé!";
        }
    }

    // ===================== PRIVATE HELPERS =====================

    private String buildPrompt(User user, List<String> chatHistory, String menuContext, String userMessage) {
        StringBuilder sb = new StringBuilder();
        sb.append("=== THÔNG TIN KHÁCH HÀNG ===\n");
        sb.append("Tên: ").append(user.getFullName()).append("\n");

        if (user.getFoodPreference() != null && !user.getFoodPreference().isBlank()) {
            sb.append("Sở thích ẩm thực (ghi nhớ từ các lần trước): ")
              .append(user.getFoodPreference()).append("\n");
        }

        sb.append("\n=== THỰC ĐƠN GỢI Ý LIÊN QUAN ===\n");
        sb.append(menuContext).append("\n");

        if (!chatHistory.isEmpty()) {
            sb.append("\n=== LỊCH SỬ TRÒ CHUYỆN HIỆN TẠI ===\n");
            chatHistory.forEach(line -> sb.append(line).append("\n"));
        }

        sb.append("\n=== CÂU HỎI KHÁCH HÀNG ===\n");
        sb.append(userMessage);

        return sb.toString();
    }

    private String buildMenuContext(List<MenuItemVectorResponse> foods) {
        if (foods == null || foods.isEmpty()) {
            return "Không tìm thấy món ăn nào khớp trực tiếp. Hãy hỏi thêm để tôi hỗ trợ tốt hơn.";
        }
        return foods.stream()
                .map(f -> String.format("• %s | Giá: %s VNĐ | Mô tả: %s",
                        f.getName(),
                        f.getPrice().toPlainString(),
                        f.getDescription() != null ? f.getDescription() : "Đang cập nhật"))
                .collect(Collectors.joining("\n"));
    }

    private void saveHistoryToRedis(String historyKey, String userMessage, String aiResponse) {
        jedis.rpush(historyKey, "Khách: " + userMessage);
        jedis.rpush(historyKey, "Bot: " + aiResponse);
        jedis.expire(historyKey, HISTORY_TTL_SECONDS);
    }

    private void extractAndUpdatePreference(User user, String userMessage, String aiResponse) {
        String extractionPrompt = String.format(
                "Phân tích ngắn gọn: Từ câu hỏi '%s' và phản hồi '%s', " +
                "khách hàng có lộ ra sở thích ẩm thực cụ thể nào không (ví dụ: Thích cay, Ăn chay, Dị ứng hải sản)? " +
                "Chỉ trả về từ khóa ngắn (tối đa 10 từ). Nếu không có thông tin mới, trả về 'NONE'.",
                userMessage, aiResponse);

        try {
            GenerateContentResponse prefResponse = client.models.generateContent(
                    "gemini-2.0-flash", extractionPrompt, null);
            String extracted = prefResponse.text().trim();

            if (!extracted.equalsIgnoreCase("NONE") && !extracted.isBlank()) {
                String current = user.getFoodPreference() == null ? "" : user.getFoodPreference();
                // Tránh thêm thông tin trùng lặp
                if (!current.contains(extracted)) {
                    String updated = current.isBlank() ? extracted : current + "; " + extracted;
                    user.setFoodPreference(updated);
                    userRepository.save(user);
                    log.info("Cập nhật sở thích cho user {}: '{}'", user.getUsername(), extracted);
                }
            }
        } catch (Exception e) {
            // Không để lỗi phụ ảnh hưởng luồng chat chính
            log.warn("Không thể trích xuất sở thích từ cuộc chat: {}", e.getMessage());
        }
    }
}
