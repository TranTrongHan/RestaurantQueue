package com.tth.RestaurantApplication.infracstructure.redis;

import com.tth.RestaurantApplication.dto.redis.RedisIndexDefinition;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import redis.clients.jedis.JedisPooled;
import redis.clients.jedis.search.FTCreateParams;
import redis.clients.jedis.search.IndexDataType;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisIndexInitializer {
    private final JedisPooled jedis;

    public void initIndex(RedisIndexDefinition redisIndexDefinition) {
        try {
            // Test connection
            String ping = jedis.ping();
            log.info("Redis connection test: {}", ping);

            if(isIndexExists(redisIndexDefinition.indexName())) {
                log.info("Index {} already exists", redisIndexDefinition.indexName());
                return;
            }

            log.info("Creating index {} with prefix {}...", redisIndexDefinition.indexName(), redisIndexDefinition.prefixName());
            jedis.ftCreate(
                    redisIndexDefinition.indexName(),
                    FTCreateParams.createParams()
                            .on(IndexDataType.HASH)
                            .addPrefix(redisIndexDefinition.prefixName()),
                    redisIndexDefinition.schemaFields()
            );

            log.info("Created index {} success", redisIndexDefinition.indexName());
        } catch (redis.clients.jedis.exceptions.JedisDataException e) {
            if (e.getMessage().contains("unknown command")) {
                log.error("CRITICAL: Redis Stack (RediSearch) is required but current Redis instance does not support it.");
                log.error("Please ensure you are connected to the correct Redis Stack instance (image: redis/redis-stack:latest).");
            } else {
                log.error("Redis Data Error: {}", e.getMessage());
            }
        } catch (Exception e) {
            log.error("Error when create index {}: {}", redisIndexDefinition.indexName(), e.getMessage(), e);
        }
    }

    private boolean isIndexExists(String indexName) {
        return jedis.ftList().contains(indexName);
    }
}
