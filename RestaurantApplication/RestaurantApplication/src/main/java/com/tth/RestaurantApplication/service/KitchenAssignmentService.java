package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.response.ChefResponse;
import com.tth.RestaurantApplication.dto.response.KitchenAssignmentResponse;
import com.tth.RestaurantApplication.dto.response.OrderItemResponse;
import com.tth.RestaurantApplication.entity.Chef;
import com.tth.RestaurantApplication.entity.KitchenAssignment;
import com.tth.RestaurantApplication.entity.MenuItem;
import com.tth.RestaurantApplication.entity.OrderItem;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.ChefMapper;
import com.tth.RestaurantApplication.mapper.KitchenAssignmentMapper;
import com.tth.RestaurantApplication.mapper.OrderItemMapper;
import com.tth.RestaurantApplication.properties.RedisProperties;
import com.tth.RestaurantApplication.repository.ChefRepository;
import com.tth.RestaurantApplication.repository.KitchenAssignmentRepository;
import com.tth.RestaurantApplication.repository.MenuItemRepository;
import com.tth.RestaurantApplication.repository.OrderItemRepository;

import com.tth.RestaurantApplication.specification.KitchenAssignmentSpecification;
import jakarta.annotation.PostConstruct;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.DecimalFormat;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class KitchenAssignmentService {
     KitchenAssignmentRepository kitchenAssignmentRepository;
     OrderItemRepository orderItemRepository;
     ChefRepository chefRepository;
     MenuItemRepository menuItemRepository;
     ApplicationEventPublisher eventPublisher;
     KitchenAssignmentMapper kitchenAssignmentMapper;
     ChefService chefService;
     StringRedisTemplate redisTemplate;
     KitchenAssignmentHelperService kitchenAssignmentHelperService;
     FirestoreService firestoreService;
     ChefMapper chefMapper;
     OrderItemMapper orderItemMapper;

    RedisProperties redisProperties;
    @PostConstruct
    public void init() {
        String streamKey = redisProperties.getStreamKey();
        String groupName = redisProperties.getStream().getGroup();
        String consumerName = redisProperties.getStream().getConsumer();
    }

    @Transactional
    public void assignDishesToAllAvailableChefs() {
        // Tìm tất cả các đầu bếp đang rảnh
        List<Chef> availableChefs = chefRepository.findByIsAvailableTrue();

        for (Chef chef : availableChefs) {
            try {
                Set<ZSetOperations.TypedTuple<String>> items = redisTemplate.opsForZSet()
                        .popMin(redisProperties.getZsetKey(), 1);

                if (items != null && !items.isEmpty()) {
                    ZSetOperations.TypedTuple<String> highestPriorityItem = items.iterator().next();
                    log.info("orderItemId from sorted set: {}",highestPriorityItem.getValue());
                    Integer orderItemId = Integer.parseInt(Objects.requireNonNull(highestPriorityItem.getValue()));
                    kitchenAssignmentHelperService.assignToChef(orderItemId, chef.getUserId());

                    log.info("Assigned dish {} from priority queue to chef {}.", orderItemId, chef.getUserId());
                } else {
                    break;
                }
            } catch (Exception e) {
                log.error("Lỗi khi gán món ăn cho bếp {}: {}", chef.getUserId(), e.getMessage());

            }
        }
    }



    @Transactional
    public KitchenAssignmentResponse doneCooking(Integer kitchenAssignId) throws Exception {
        KitchenAssignment kitchenAssignment = kitchenAssignmentRepository.findById(kitchenAssignId)
                .orElseThrow(() -> new AppException(ErrorCode.KITCHEN_ASSIGN_NOT_FOUND));

        LocalDateTime finishTime = LocalDateTime.now();
        kitchenAssignment.setFinishAt(finishTime);
        Duration duration = Duration.between(kitchenAssignment.getStartAt(), finishTime);
        double actualCookingTime = (double) duration.toMinutes();
        kitchenAssignment.setActualCookingTime(actualCookingTime);
        kitchenAssignment.setStatus(KitchenAssignment.KitchenAssignmentStatus.DONE);

        kitchenAssignmentRepository.save(kitchenAssignment);
        OrderItem item  = kitchenAssignment.getOrderItem();
        item.setStatus(OrderItem.OrderItemStatus.DONE);
        orderItemRepository.save(item);

        updateAvgCookingTime(item.getMenuItem(),actualCookingTime);
        updateDeadlineTimes();
        firestoreService.updateOrderItemField(String.valueOf(item.getOrder().getOrderId()),String.valueOf(item.getOrderItemId()), "status", OrderItem.OrderItemStatus.DONE);
        firestoreService.updateKitchenField(kitchenAssignment.getKitchenAssignId().toString(),"status", KitchenAssignment.KitchenAssignmentStatus.DONE.toString());
        firestoreService.updateKitchenField(kitchenAssignment.getKitchenAssignId().toString(),"finishAt",finishTime.toString());
        firestoreService.updateKitchenField(kitchenAssignment.getKitchenAssignId().toString(),"actualCookingTime",String.valueOf(actualCookingTime));

        ChefResponse chefResponse = chefMapper.toChefResponse(kitchenAssignment.getChef());
        OrderItemResponse orderItemResponse = orderItemMapper.toOrderItemResponse(kitchenAssignment.getOrderItem());
        KitchenAssignmentResponse response = new KitchenAssignmentResponse();
        response.setKitchenAssignId(kitchenAssignment.getKitchenAssignId());
        response.setChefResponse(chefResponse);
        response.setItemResponse(orderItemResponse);
        response.setStartAt(kitchenAssignment.getStartAt());
        response.setFinishAt(finishTime);
        response.setStatus(KitchenAssignment.KitchenAssignmentStatus.DONE);
        response.setActualCookingTime(actualCookingTime);
        response.setTable(kitchenAssignment.getOrderItem().getOrder().getOrderSession().getReservation().getTable().getTableName());
        Chef chef = kitchenAssignment.getChef();
        chef.setIsAvailable(true);
        chefRepository.save(chef);
        Map<String, String> wakeUpMessage = new HashMap<>();
        wakeUpMessage.put("type", "WAKE_UP");
        wakeUpMessage.put("chefId", String.valueOf(chef.getUserId()));
        redisTemplate.opsForStream().add("kitchen-stream", wakeUpMessage);

        return response;
    }
    @Transactional
    public void updateChefStatus(Integer chefId) {
        Chef chef = chefRepository.findById(chefId)
                .orElseThrow(() -> new AppException(ErrorCode.CHEF_NOT_FOUND));

        chef.setIsAvailable(true);
        chefRepository.save(chef);
        log.info("Chef ID {} status updated to {}", chefId, chef.getIsAvailable());
    }
    Double ALPHA = 0.3;
    private void updateAvgCookingTime(MenuItem menuItem, Double actualCookingTime){
        log.info("call updateAvgCookingTime");
        log.info("actual cooking time of {}  {}",menuItem.getMenuItemId(),actualCookingTime);
        double avgCookingTime = menuItem.getAvgCookingTime() * (1 - ALPHA) + actualCookingTime * ALPHA;
        log.info("avg cooking time: {}",avgCookingTime);
        DecimalFormat df = new DecimalFormat("#.##");
        avgCookingTime = Double.parseDouble(df.format(avgCookingTime));
        menuItem.setAvgCookingTime(avgCookingTime);
        menuItemRepository.save(menuItem);
    }
    private void updateDeadlineTimes() throws Exception {
        // Lấy tất cả món PENDING + COOKING
        log.info("call updateDeadlineTimes");
        List<OrderItem> items = orderItemRepository.findByStatus(OrderItem.OrderItemStatus.PENDING);
        for (OrderItem orderItem : items) {
            double estimatedTime = kitchenAssignmentHelperService.calculateEstimatedTime(orderItem.getMenuItem().getMenuItemId());
            LocalDateTime newDeadline = LocalDateTime.now().plusMinutes((long) estimatedTime);
            log.info("new deadline of PENDING orderItem {}: {}", orderItem.getOrderItemId(), newDeadline);
            orderItem.setDeadlineTime(newDeadline);
            orderItemRepository.save(orderItem);


            firestoreService.updateOrderItemField(String.valueOf(orderItem.getOrder().getOrderId()),String.valueOf(orderItem.getOrderItemId()), "deadlineTime",newDeadline.toString());
        }
    }

    public Page<KitchenAssignmentResponse> get(Map<String, String> params, Pageable pageable){

        Specification<KitchenAssignment> spec = KitchenAssignmentSpecification.filterByParams(params);
        Page<KitchenAssignment>  assignmentPage = kitchenAssignmentRepository.findAll(spec,pageable);

        return assignmentPage.map(kitchenAssignmentMapper::toKitchenAssignmentResponse);

    }

}
