package com.tth.RestaurantApplication.infracstructure.redis;

import com.tth.RestaurantApplication.dto.redis.RedisIndexDefinition;
import org.springframework.stereotype.Service;
import redis.clients.jedis.search.schemafields.*;

import java.util.Map;

@Service
public class MenuItemIndexSchema extends IndexSchema {
    public MenuItemIndexSchema(RedisIndexInitializer redisIndexInitializer) {
        super(redisIndexInitializer);
    }

    @Override
    public RedisIndexDefinition indexSchemaDefinition() {
        return new RedisIndexDefinition(
                "menuItemIdx",
                "menuItem:",
                new SchemaField[] {
                        TextField.of("id"),
                        TextField.of("name"),
                        NumericField.of("price"),
                        TextField.of("image"),
                        TextField.of("description"),

                        // Vector field: FLAT + COSINE, dim = 768
                        VectorField.builder()
                                .fieldName("vector")
                                .algorithm(VectorField.VectorAlgorithm.FLAT)
                                .attributes(Map.of(
                                        "TYPE", "FLOAT32",
                                        "DIM", "768",
                                        "DISTANCE_METRIC", "COSINE"
                                ))
                                .build()
                });
    }
}
