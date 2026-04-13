package com.tth.RestaurantApplication.service;

import com.google.genai.Client;
import com.google.genai.types.ContentEmbedding;
import com.google.genai.types.EmbedContentConfig;
import com.google.genai.types.EmbedContentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.List;

@Slf4j
@Service
public class EmbeddingService {
    @Value("${gemini.api.key}")
    private String apiKey;

    private Client client;

    @PostConstruct
    public void init() {
        this.client = Client.builder()
                .apiKey(apiKey)
                .build();
    }

    public float[] getEmbedding(String text) {
        try {
            EmbedContentConfig config = EmbedContentConfig.builder().build();

            // Gọi API embedContent với cú pháp đúng
            EmbedContentResponse response = client.models.embedContent("gemini-embedding-001", text, config);

            // Gemini API trả về embedding trong response object
            if (response != null && response.embeddings() != null && response.embeddings().isPresent()) {
                List<ContentEmbedding> embeddings = response.embeddings().get();

                if (!embeddings.isEmpty() && embeddings.getFirst() != null) {
                    // Lấy embedding đầu tiên
                    List<Float> values = embeddings.getFirst().values().orElse(null);

                    if (values != null && !values.isEmpty()) {
                        // Gemini might return 768 or more dimensions. Our index expects 768.
                        int dimension = Math.min(values.size(), 768);
                        float[] result = new float[768]; // Always return 768 to match index
                        for (int i = 0; i < dimension; i++) {
                            result[i] = values.get(i).floatValue();
                        }
                        return result;
                    }
                }
            }

        } catch (Exception e) {
            log.error("Lỗi khi tạo embedding từ Gemini API. Kiểm tra API Key và kết nối mạng: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi khi tạo embedding: " + e.getMessage(), e);
        }
        return new float[0];
    }
}
