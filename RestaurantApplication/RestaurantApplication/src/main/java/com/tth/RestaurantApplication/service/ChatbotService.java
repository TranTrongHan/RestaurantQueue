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
    private static final int MAX_HISTORY_ITEMS = 4;     // Giảm xuống 4 để tiết kiệm Input Token

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

        try {
            // 3. Lấy lịch sử chat ngắn hạn từ Redis
            List<String> chatHistory = jedis.lrange(historyKey, -MAX_HISTORY_ITEMS, -1);

            // 4. Mở rộng câu hỏi và gợi ý món ăn
            String extendedQuery = userMessage;
            if (chatHistory != null && chatHistory.size() >= 2) {
                String lastUserMsg = chatHistory.get(chatHistory.size() - 2);
                extendedQuery = lastUserMsg + " " + userMessage;
            }

            List<MenuItemVectorResponse> recommendedFoods = recommendFood.recommendFoods(extendedQuery);
            String menuContext = buildMenuContext(recommendedFoods);

            // 5. Xây dựng Augmented Prompt
            String fullPrompt = buildPrompt(user, chatHistory, menuContext, userMessage);

            // 6. Gọi Gemini API
            GenerateContentConfig config = GenerateContentConfig.builder()
                    .systemInstruction(com.google.genai.types.Content.builder()
                            .role("user")
                            .parts(List.of(com.google.genai.types.Part.builder()
                                    .text("Bạn là một nhân viên phục vụ chuyên nghiệp, am hiểu ẩm thực. " +
                                          "Luôn trả lời bằng Tiếng Việt, thân thiện và ngắn gọn. " +
                                          "Chỉ tư vấn về món ăn có trong thực đơn gợi ý. " +
                                          "Dựa vào lịch sử hội thoại để hiểu các từ thay thế như 'món đó', 'nó', 'loại này'. " +
                                          "QUAN TRỌNG: Nếu khách hàng bộc lộ sở thích mới, hãy viết kèm '[PREF: <sở thích>]'.")
                                    .build()))
                            .build())
                    .build();

            log.info("Calling Gemini for user: {}", userId);
            GenerateContentResponse response = client.models.generateContent("gemini-2.5-flash", fullPrompt, config);
            String rawAiResponse = response.text();

            // 7. Trích xuất sở thích
            String aiResponse = rawAiResponse;
            if (rawAiResponse != null && rawAiResponse.contains("[PREF:")) {
                String preference = parsePreferenceFromResponse(rawAiResponse);
                if (preference != null) {
                    extractAndUpdatePreference(user, preference);
                }
                aiResponse = rawAiResponse.replaceAll("\\[PREF:.*?\\]", "").trim();
            }

            // 8. Cập nhật lịch sử
            saveHistoryToRedis(historyKey, userMessage, aiResponse);

            log.info("Chat completed for userId={}", userId);
            return aiResponse;

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Lỗi nghiêm trọng trong ChatbotService cho userId={}: {}", userId, e.getMessage(), e);
            return "Xin lỗi " + user.getFullName() + ", tôi đang gặp sự cố kỹ thuật kết nối với trí tuệ nhân tạo. Bạn vui lòng thử lại sau nhé!";
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
        // Giới hạn 3 món để tiết kiệm Token
        return foods.stream()
                .limit(3)
                .map(f -> {
                    String desc = f.getDescription() != null ? f.getDescription() : "Đang cập nhật";
                    if (desc.length() > 100) desc = desc.substring(0, 97) + "..."; // Cắt ngắn mô tả
                    return String.format("• %s | Giá: %s VNĐ | Mô tả: %s",
                        f.getName(),
                        f.getPrice().toPlainString(),
                        desc);
                })
                .collect(Collectors.joining("\n"));
    }

    private void saveHistoryToRedis(String historyKey, String userMessage, String aiResponse) {
        jedis.rpush(historyKey, "Khách: " + userMessage);
        jedis.rpush(historyKey, "Bot: " + aiResponse);
        jedis.expire(historyKey, HISTORY_TTL_SECONDS);
    }

    private String parsePreferenceFromResponse(String rawResponse) {
        try {
            int start = rawResponse.indexOf("[PREF:");
            int end = rawResponse.indexOf("]", start);
            if (start != -1 && end != -1) {
                return rawResponse.substring(start + 6, end).trim();
            }
        } catch (Exception e) {
            log.warn("Lỗi khi parse preference từ AI response: {}", e.getMessage());
        }
        return null;
    }

    private void extractAndUpdatePreference(User user, String extractedPreference) {
        if (extractedPreference == null || extractedPreference.isBlank() || extractedPreference.equalsIgnoreCase("NONE")) {
            return;
        }

        try {
            String current = user.getFoodPreference() == null ? "" : user.getFoodPreference();
            // Tránh thêm thông tin trùng lặp
            if (!current.toLowerCase().contains(extractedPreference.toLowerCase())) {
                String updated = current.isBlank() ? extractedPreference : current + "; " + extractedPreference;
                user.setFoodPreference(updated);
                userRepository.save(user);
                log.info("Cập nhật sở thích cho user {}: '{}'", user.getUsername(), extractedPreference);
            }
        } catch (Exception e) {
            log.warn("Không thể lưu sở thích mới: {}", e.getMessage());
        }
    }
}
