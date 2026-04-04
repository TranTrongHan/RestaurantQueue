package com.tth.RestaurantApplication.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tth.RestaurantApplication.dto.response.MenuItemVectorResponse;
import com.tth.RestaurantApplication.infracstructure.redis.MenuItemIndexSchema;
import com.tth.RestaurantApplication.service.EmbeddingService;
import com.tth.RestaurantApplication.service.VectorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import redis.clients.jedis.JedisPooled;

import redis.clients.jedis.search.Document;
import redis.clients.jedis.search.Query;
import redis.clients.jedis.search.SearchResult;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendFood {
    private final JedisPooled jedis;
    private final EmbeddingService embeddingService;
    private final ObjectMapper objectMapper;
    private final MenuItemIndexSchema menuItemIndexSchema;

    private static final String INDEX_NAME = "menuItemIdx";

    public List<MenuItemVectorResponse> recommendFoods(String userQuery) {
        log.info("Starting recommendation for query: {}", userQuery);
        // B0: Ensure index exists
        menuItemIndexSchema.initIndex();

        // B1: tạo embedding từ CV\
        float[] embedding = embeddingService.getEmbedding(userQuery);

        // B2: tìm job gần nhất bằng KNN
        byte[] vecBytes = VectorService.floatArrayToBytes(embedding);

        // Required syntax: *=>[KNN ...]
        Query q = new Query("*=>[KNN 5 @vector $vec AS score]")
                .addParam("vec", vecBytes)
                .returnFields("id", "name", "price", "description", "image")
                .setSortBy("score", true)
                .dialect(2);

        SearchResult result = jedis.ftSearch(INDEX_NAME, q);
        log.info("Found {} results from Redis", result.getTotalResults());

        List<MenuItemVectorResponse> menuItemResponse = mapSearchResult(result);

        return menuItemResponse;

    }

    private List<MenuItemVectorResponse> mapSearchResult(SearchResult result) {
        if (result == null || result.getDocuments() == null) {
            return Collections.emptyList();
        }

        return result.getDocuments().stream().map(this::mapToJobResponse).toList();
    }

    private MenuItemVectorResponse mapToJobResponse(Document doc) {
        log.info("Mapping document ID: {}", doc.getId());
        return MenuItemVectorResponse.builder()
                .menuItemId(Integer.parseInt(doc.getString("id")))
                .name(doc.getString("name"))
                .price(new BigDecimal(doc.getString("price")))
                .image(doc.getString("image"))
                .description(doc.getString("description"))
                .build();
    }
}
