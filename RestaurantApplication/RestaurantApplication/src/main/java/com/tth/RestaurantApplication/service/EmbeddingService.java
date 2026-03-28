package com.tth.RestaurantApplication.service;

import com.google.genai.Client;
import com.google.genai.types.ContentEmbedding;
import com.google.genai.types.EmbedContentConfig;
import com.google.genai.types.EmbedContentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmbeddingService {
    private final Client client;

    public EmbeddingService() {
        this.client = Client.builder()
                .apiKey("AIzaSyB2MfA--PKS7akEBSV1b3c7NUALLlGR-xE")
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

                if (!embeddings.isEmpty()) {
                    // Lấy embedding đầu tiên
                    List<Float> values = embeddings.getFirst().values().orElse(null);

                    // Chuyển sang mảng float[]
                    float[] result = new float[values.size()];
                    for (int i = 0; i < values.size(); i++) {
                        result[i] = values.get(i).floatValue();
                    }
                    return result;
                }
            }

        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi tạo embedding: " + e.getMessage(), e);
        }
        return new float[0];
    }
}
