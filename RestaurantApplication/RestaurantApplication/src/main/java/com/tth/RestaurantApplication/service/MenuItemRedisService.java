package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.redis.MenuItemVectorDto;
import com.tth.RestaurantApplication.dto.redis.Vectorizable;
import com.tth.RestaurantApplication.entity.MenuItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import redis.clients.jedis.JedisPooled;
import redis.clients.jedis.Pipeline;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
@Service
public class MenuItemRedisService {
    private final JedisPooled jedis;
    private final EmbeddingService embeddingService;
    public void saveAllMenuItem(List<MenuItemVectorDto> menuItems, String keyPrefix) {
        log.info("Saving {} menu items to Redis with prefix '{}'", menuItems.size(), keyPrefix);
        try(Pipeline pipeline = jedis.pipelined()) {
            for (MenuItemVectorDto job : menuItems) {
                String text = job.buildVectorContent();
                float[] embedding = embeddingService.getEmbedding(text);
                byte[] vectorBlob = floatArrayToBytes(embedding);

                String redisKey = keyPrefix + job.getId();
                if (menuItems.indexOf(job) < 3) { // Log first 3 items for verification
                    log.info("DEBUG: Syncing Item '{}' to Redis Key: '{}'", job.getName(), redisKey);
                }

                // Tạo Map cho tất cả các field
                Map<String, String> metadata = job.toMap();
                // Save metadata
                pipeline.hset(redisKey, metadata);

                // Save vector
                pipeline.hset(redisKey.getBytes(), Map.of("vector".getBytes(), vectorBlob));
            }
            pipeline.sync();
            log.info("Pipeline sync completed successfully");
        } catch (Exception e) {
            String errorMessage = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            throw new RuntimeException("Error saved menu item list: " + errorMessage, e);
        }
    }

    private byte[] floatArrayToBytes(float[] array) {
        ByteBuffer buffer = ByteBuffer.allocate(4 * array.length);
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        for (float v : array) {
            buffer.putFloat(v);
        }
        return buffer.array();
    }
}
