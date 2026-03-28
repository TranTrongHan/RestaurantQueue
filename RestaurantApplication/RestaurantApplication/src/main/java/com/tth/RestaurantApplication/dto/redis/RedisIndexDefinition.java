package com.tth.RestaurantApplication.dto.redis;
import redis.clients.jedis.search.schemafields.SchemaField;

public record RedisIndexDefinition(String indexName, String prefixName, SchemaField[] schemaFields) {
}
