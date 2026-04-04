package com.tth.RestaurantApplication.infracstructure.redis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import redis.clients.jedis.JedisPooled;

@Component
@Slf4j
@RequiredArgsConstructor
public class RedisConnectionChecker {

    private final JedisPooled jedis;

    @EventListener(ApplicationReadyEvent.class)
    public void checkConnection() {
        log.info("Checking Redis connection on startup...");
        try {
            String response = jedis.ping();
            log.info("Successfully connected to Redis! PING response: {}", response);
            
            long keyCount = jedis.dbSize();
            log.info("Redis current database size: {} keys", keyCount);
            
        } catch (Exception e) {
            log.error("CRITICAL: Failed to connect to Redis on startup! Error: {}", e.getMessage());
        }
    }
}
