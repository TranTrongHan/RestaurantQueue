package com.tth.RestaurantApplication.scheduler;


import com.tth.RestaurantApplication.entity.OrderItem;
import com.tth.RestaurantApplication.properties.RedisProperties;
import com.tth.RestaurantApplication.repository.OrderItemRepository;
import com.tth.RestaurantApplication.service.FirestoreService;
import com.tth.RestaurantApplication.service.OrderSessionService;
import jakarta.annotation.PostConstruct;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/*
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class OrderItemScheduler {

    OrderItemRepository orderItemRepository;
    OrderSessionService orderSessionService;
    StringRedisTemplate redisTemplate;
    FirestoreService firestoreService;
    RedisProperties redisProperties;
    @PostConstruct
    public void init() {
        String streamKey = redisProperties.getStreamKey();
        String groupName = redisProperties.getStream().getGroup();
        String consumerName = redisProperties.getStream().getConsumer();
    }

    @Scheduled(fixedRate = 450000) // Tăng thời gian hoặc disable vì không dùng điểm ưu tiên nữa
    public void updatePendingItemsPriority() throws Exception {
        // Món ăn không còn sử dụng điểm ưu tiên (priorityScore) theo yêu cầu kiến trúc mới.
        // Logic này có thể được gỡ bỏ hoàn toàn trong tương lai.
        log.debug("Priority update skipped - feature disabled.");
    }
}
*/
