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

    @Scheduled(fixedRate = 45000)
    public void updatePendingItemsPriority() throws Exception {
        List<OrderItem> pendingItems = orderItemRepository.findByStatus(OrderItem.OrderItemStatus.PENDING);

        int updatedCount = 0;
        for (OrderItem item : pendingItems) {
            // Tính lại điểm
            double oldScore = item.getPriorityScore();
            double newScore = orderSessionService.calculatePriorityScore(item);
            if (LocalDateTime.now().isAfter(item.getDeadlineTime()) && item != null) {
                log.warn(" CẢNH BÁO: Món ăn với ID {} đã vượt quá thời gian dự kiến (deadlineTime).", item.getOrderItemId());
                newScore = newScore - 50.0;
                firestoreService.updateOrderItemField(String.valueOf(item.getOrder().getOrderId()),String.valueOf(item.getOrderItemId()),"priorityScore",newScore);
                firestoreService.updateOrderItemField(String.valueOf(item.getOrder().getOrderId()),String.valueOf(item.getOrderItemId()),"isLate",Boolean.TRUE.toString());
                redisTemplate.opsForZSet().add(
                        redisProperties.getZsetKey(),
                        String.valueOf(item.getOrderItemId()),
                        newScore
                );
            }
            if (oldScore != newScore) {
                // Cập nhật điểm trong OrderItem
                item.setPriorityScore(newScore);
                firestoreService.updateOrderItemField(String.valueOf(item.getOrder().getOrderId()),String.valueOf(item.getOrderItemId()),"priorityScore",newScore);
                orderItemRepository.save(item);

                // Cập nhật điểm của món ăn trong Sorted Set
                redisTemplate.opsForZSet().add(
                        redisProperties.getZsetKey(),
                        String.valueOf(item.getOrderItemId()),
                        newScore
                );
                log.info(
                        "    -> Món ăn ID {} ({}): Cập nhật điểm ưu tiên. Điểm cũ: {}, Điểm mới: {} (giảm {} do thời gian chờ)",
                        item.getOrderItemId(),
                        item.getMenuItem().getName(),
                        oldScore,
                        newScore,
                        oldScore - newScore
                );
                updatedCount++;
            }

            Map<String, String> updateData = new HashMap<>();
            updateData.put("type", "UPDATE_PRIORITY");
            updateData.put("orderItemId", String.valueOf(item.getOrderItemId()));
            updateData.put("newPriority", String.valueOf(newScore));
            redisTemplate.opsForStream().add(redisProperties.getStreamKey(), updateData);
//            log.info("Đã gửi message cập nhật điểm ưu tiên cho món ăn ID {} lên kitchen-stream.", item.getOrderItemId());
        }
//        log.info("Finished updating priority scores. Total items updated: {}", updatedCount);
    }
}
