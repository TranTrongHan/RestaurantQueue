package com.tth.RestaurantApplication.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tth.RestaurantApplication.dto.response.MenuItemVectorResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import redis.clients.jedis.JedisPooled;

import redis.clients.jedis.search.Document;
import redis.clients.jedis.search.Query;
import redis.clients.jedis.search.SearchResult;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecommendFood {
    private final JedisPooled jedis;
    private final EmbeddingService embeddingService;
    private final ObjectMapper objectMapper;

    private static final String INDEX_NAME = "menuItemIdx";

    public List<MenuItemVectorResponse> recommendJobs(String userQuery) {
        // B1: tạo embedding từ CV\
        float[] embedding = embeddingService.getEmbedding(userQuery);

        // B2: tìm job gần nhất bằng KNN
        byte[] vecBytes = VectorService.floatArrayToBytes(embedding);

        Query q = new Query("=>[KNN 5 @vector $vec AS score]")
                .addParam("vec", vecBytes)
                .returnFields("id", "name", "price", "description", "image")
                .setSortBy("score", true)
                .dialect(2);

        SearchResult result = jedis.ftSearch(INDEX_NAME, q);

        List<MenuItemVectorResponse> menuItemResponse = mapSearchResult(result);

//        String prompt = buildExplainPrompt(jobResponses, cvProfile);
//
//        ChatResponse chatResponse = chatModel.call(new Prompt(prompt));
//        try {
//            List<JobExplainResponse> jobExplainResponses = objectMapper.readValue(chatResponse.getResult().getOutput().getText(),
//                    new TypeReference<List<JobExplainResponse>>() {});
//        } catch (JsonProcessingException e) {
//            log.error("Error parsing job explain gemini response: {}", e.getMessage());
//            throw new RuntimeException(e);
//        }

        return menuItemResponse;


    }

    private List<MenuItemVectorResponse> mapSearchResult(SearchResult result) {
        if(result == null || result.getDocuments() == null) {
            return Collections.emptyList();
        }

        return result.getDocuments().stream().map(this::mapToJobResponse).toList();
    }

    private MenuItemVectorResponse mapToJobResponse(Document doc) {
        String skills = doc.getString("skillNames");
        return MenuItemVectorResponse.builder()
                .menuItemId(Integer.parseInt(doc.getString("id")))
                .name(doc.getString("name"))
                .price(new BigDecimal( doc.getString("price")))
                .image(doc.getString("image"))
                .description(doc.getString("description"))
                .build();
    }
}
