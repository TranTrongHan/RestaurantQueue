package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.redis.MenuItemVectorDto;
import com.tth.RestaurantApplication.dto.redis.Vectorizable;
import com.tth.RestaurantApplication.entity.MenuItem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import redis.clients.jedis.JedisPooled;
import redis.clients.jedis.Pipeline;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@Service
public class MenuItemRedisService {
    private final JedisPooled jedis;
    private final EmbeddingService embeddingService;
    public void saveAllMenuItem(List<MenuItemVectorDto> menuItems, String keyPrefix) {
        try(Pipeline pipeline = jedis.pipelined()) {
            for (MenuItemVectorDto job : menuItems) {
                String text = job.buildVectorContent();
                float[] embedding = embeddingService.getEmbedding(text);
                byte[] vectorBlob = floatArrayToBytes(embedding);

                String redisKey = keyPrefix + job.getId();

                // Tạo Map cho tất cả các field
                Map<String, String> metadata = job.toMap();
                // Save metadata
                pipeline.hset(redisKey, metadata);

                // Save vector
                pipeline.hset(redisKey.getBytes(), Map.of("vector".getBytes(), vectorBlob));
            }
            pipeline.sync();
        } catch (Exception e) {
            throw new RuntimeException("Error saved menu item list: " + e.getMessage(), e);
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
