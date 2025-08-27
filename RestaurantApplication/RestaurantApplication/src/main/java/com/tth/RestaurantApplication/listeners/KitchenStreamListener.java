package com.tth.RestaurantApplication.listeners;

import com.tth.RestaurantApplication.entity.Chef;
import com.tth.RestaurantApplication.entity.OrderItem;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.properties.RedisProperties;
import com.tth.RestaurantApplication.repository.OrderItemRepository;
import com.tth.RestaurantApplication.service.ChefService;
import com.tth.RestaurantApplication.service.KitchenAssignmentHelperService;
import com.tth.RestaurantApplication.service.KitchenAssignmentService;

import jakarta.annotation.PostConstruct;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Range;
import org.springframework.data.redis.connection.stream.*;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@RequiredArgsConstructor
public class KitchenStreamListener implements StreamListener<String, MapRecord<String, String, String>> {


    KitchenAssignmentService kitchenAssignmentService;
    KitchenAssignmentHelperService kitchenAssignmentHelperService;
    ChefService chefService;
    OrderItemRepository orderItemRepository;
    StringRedisTemplate redisTemplate;
    RedisProperties redisProperties;
    @PostConstruct
    public void init() {
        String streamKey = redisProperties.getStreamKey();
        String groupName = redisProperties.getStream().getGroup();
        String consumerName = redisProperties.getStream().getConsumer();
    }


    @Override
    public void onMessage(MapRecord<String, String, String> message) {
        try {
            processMessage(message); // gọi vào service có @Transactional
        } catch (Exception e) {
            log.error("Error processing message with ID {}. Error: {}", message.getId().getValue(), e.getMessage());
        }
    }

    @Transactional
    public void processMessage(MapRecord<String, String, String> message) {
        String recordId = message.getId().getValue();
        Map<String, String> dishData = message.getValue();

        log.info("Received new message from stream: {}, record ID: {}", message.getStream(), recordId);
        log.info("Message details: {}", dishData);

        // ACK message ngay lập tức. Sorted Set sẽ đảm nhận việc quản lý trạng thái món ăn.
        redisTemplate.opsForStream().acknowledge(redisProperties.getStreamKey(), redisProperties.getStream().getGroup(), recordId);


        String messageType = dishData.get("type");

        if ("WAKE_UP".equals(messageType)) {
            log.info("Received WAKE_UP signal from chef ID {}. Assigning next available dish...", dishData.get("chefId"));

            Integer chefId = Integer.parseInt(dishData.get("chefId"));
            kitchenAssignmentService.updateChefStatus(chefId);
            // Gọi service để lấy món ăn có điểm ưu tiên thấp nhất từ Sorted Set và gán cho đầu bếp rảnh
            kitchenAssignmentService.assignDishesToAllAvailableChefs();
            return;
        }

        if ("UPDATE_PRIORITY".equals(messageType)) {
            try {
                Integer orderItemId = Integer.parseInt(dishData.get("orderItemId"));
                Double newPriority = Double.parseDouble(dishData.get("newPriority"));

                log.info("✅ Đã nhận message cập nhật điểm ưu tiên cho món ID {}. Điểm mới: {}", orderItemId, newPriority);
                // Dữ liệu trong Sorted Set đã được Scheduler cập nhật, listener chỉ cần ghi nhận.
                return;
            } catch (NumberFormatException e) {
                log.error("Error parsing UPDATE_PRIORITY message with data {}: {}", dishData, e.getMessage());
                return;
            }
        }


    }


}
