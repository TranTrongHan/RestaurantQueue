package com.tth.RestaurantApplication.infracstructure.redis;

import com.tth.RestaurantApplication.dto.redis.RedisIndexDefinition;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;

@Slf4j
@RequiredArgsConstructor
public abstract class IndexSchema {
//    @Value("${embedding.type}")
//    protected String embeddingType;
//
//    @Value("${embedding.dimension}")
//    protected int embeddingDimension;
//
//    @Value("${embedding.distance-metric}")
//    protected String distanceMetric;

    protected final RedisIndexInitializer redisIndexInitializer;

    //    @EventListener(ApplicationReadyEvent.class)
    @PostConstruct
    public void initIndex() {
        redisIndexInitializer.initIndex(indexSchemaDefinition());
    }

    public abstract RedisIndexDefinition indexSchemaDefinition();

}
