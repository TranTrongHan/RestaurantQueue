package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.request.OrderItemRequest;
import com.tth.RestaurantApplication.dto.request.OrderRequest;
import com.tth.RestaurantApplication.dto.response.OrderItemResponse;
import com.tth.RestaurantApplication.entity.MenuItem;
import com.tth.RestaurantApplication.entity.Order;
import com.tth.RestaurantApplication.entity.OrderItem;
import com.tth.RestaurantApplication.entity.OrderSession;
import com.tth.RestaurantApplication.entity.OrderItemStatus;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.OrderItemMapper;
import com.tth.RestaurantApplication.repository.MenuItemRepository;
import com.tth.RestaurantApplication.repository.OrderItemRepository;
import com.tth.RestaurantApplication.repository.OrderRepository;
import com.tth.RestaurantApplication.repository.OrderSessionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderItemService {
    OrderItemRepository orderItemRepository;
    MenuItemRepository menuItemRepository;
    OrderRepository orderRepository;
    OrderSessionRepository orderSessionRepository;
    OrderItemMapper orderItemMapper;
    FirestoreService firestoreService;
    MenuItemService menuItemService;
    SettingService settingService;
    
    @Transactional
    public OrderItemResponse updateStatus(Integer orderItemId, OrderItemStatus newStatus) {
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_ITEM_NOT_FOUND));

        // Logic check transition
        if (newStatus == OrderItemStatus.COOKING && orderItem.getStatus() == OrderItemStatus.PENDING) {
            orderItem.setStatus(OrderItemStatus.COOKING);
            orderItem.setStartTime(LocalDateTime.now());
            orderItemRepository.save(orderItem);
            
            // push real-time updates
            Integer resId = orderItem.getOrder().getOrderSession().getReservation().getReservationId();
            firestoreService.updateOrderItemStatus(resId, orderItem.getOrderItemId(), OrderItemStatus.COOKING.toString());
        } else if (newStatus == OrderItemStatus.DONE && orderItem.getStatus() == OrderItemStatus.COOKING) {
            orderItem.setStatus(OrderItemStatus.DONE);
            orderItem.setFinishedAt(LocalDateTime.now());
            orderItemRepository.save(orderItem);
            
            // Calculate actual cooking time and update average
            double actualCookingTime = 0.0;
            if (orderItem.getStartTime() != null) {
                Duration duration = Duration.between(orderItem.getStartTime(), LocalDateTime.now());
                actualCookingTime = (double) duration.toMinutes();
                updateAvgCookingTime(orderItem.getMenuItem(), actualCookingTime);
            }

            Integer resId = orderItem.getOrder().getOrderSession().getReservation().getReservationId();
            firestoreService.updateOrderItemStatus(resId, orderItem.getOrderItemId(), OrderItemStatus.DONE.toString());
        }

        return orderItemMapper.toOrderItemResponse(orderItem);
    }
    
    Double ALPHA = 0.3;
    private void updateAvgCookingTime(MenuItem menuItem, Double actualCookingTime){
        log.info("call updateAvgCookingTime");
        log.info("actual cooking time of {}  {}", menuItem.getMenuItemId(), actualCookingTime);
        double currentAvg = menuItem.getAvgCookingTime() == null ? 0.0 : menuItem.getAvgCookingTime();
        double avgCookingTime = currentAvg * (1 - ALPHA) + actualCookingTime * ALPHA;
        log.info("avg cooking time: {}", avgCookingTime);
        DecimalFormat df = new DecimalFormat("#.##");
        avgCookingTime = Double.parseDouble(df.format(avgCookingTime));
        menuItem.setAvgCookingTime(avgCookingTime);
        menuItemRepository.save(menuItem);
    }

    @Transactional
    public List<OrderItemResponse> createOrderItem(OrderRequest request, Integer sessionId) {
        OrderSession orderSession = orderSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_SESSION_NOT_FOUND));

        if (!Boolean.TRUE.equals(orderSession.getIsActive())) {
            throw new AppException(ErrorCode.INVALID_ORDER_SESSION);
        }

        Order order = orderRepository.findByOrderSession(orderSession);
        if (order == null) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);
        }

        // Kiểm tra bàn có đang bị khóa để thanh toán không
        if (orderSession.getReservation().getStatus() == com.tth.RestaurantApplication.entity.Reservation.ReservationStatus.REQUEST_PAYMENT) {
            throw new AppException(ErrorCode.TABLE_LOCKED_FOR_PAYMENT);
        }

        List<OrderItem> newOrderItems = new ArrayList<>();
        for (OrderItemRequest menuItemRequest : request.getMenuItemRequestList()) {
            OrderItem orderItem = createAndSaveSingleOrderItem(order, menuItemRequest);
            newOrderItems.add(orderItem);
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                for (OrderItem orderItem : newOrderItems) {
                    firestoreService.pushOrderItem(orderItem, orderSession.getReservation().getReservationId());
                }
            }
        });

        return newOrderItems.stream()
                .map(orderItemMapper::toOrderItemResponse)
                .collect(Collectors.toList());
    }

    private OrderItem createAndSaveSingleOrderItem(Order order, OrderItemRequest menuItemRequest) {
        MenuItem item = menuItemRepository.findByMenuItemId(menuItemRequest.getMenuItemId())
                .orElseThrow(() -> new AppException(ErrorCode.MENUITEM_NOT_FOUND));

        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(order);
        orderItem.setMenuItem(item);
        orderItem.setQuantity(menuItemRequest.getQuantity());
        orderItem.setStatus(OrderItemStatus.PENDING);

        // Map priority from MembershipTier
        Integer priority = 1; // Default
        if (order.getOrderSession() != null && 
            order.getOrderSession().getReservation() != null && 
            order.getOrderSession().getReservation().getUser() != null && 
            order.getOrderSession().getReservation().getUser().getMembershipTier() != null) {
            priority = order.getOrderSession().getReservation().getUser().getMembershipTier().getPriority();
            if (priority == null) priority = 1;
        }
        orderItem.setPriorityScore((double) priority);

        double estimatedTime = calculateEstimatedTime(menuItemRequest.getMenuItemId());
        orderItem.setEstimateTime(estimatedTime);
        orderItem.setDeadlineTime(LocalDateTime.now().plusMinutes((long) Math.ceil(estimatedTime)));
        return orderItemRepository.save(orderItem);
    }

    public void cancelOrderItem(Integer orderItemId){
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_ITEM_NOT_FOUND));
        if(orderItem.getStatus().equals(OrderItemStatus.PENDING)){
            orderItemRepository.delete(orderItem);
            double amountToSubtract = orderItem.getMenuItem().getPrice().doubleValue() * orderItem.getQuantity();
            firestoreService.removeOrderItem(orderItem.getOrder().getOrderSession().getReservation().getReservationId(), 
                    orderItem.getOrderItemId(), amountToSubtract);

            log.info("OrderItem {} đã bị hủy: xóa khỏi DB và Firestore", orderItemId);
        }
    }

    public double calculateEstimatedTime(int menuItemId) {
        log.info("Calculating estimated time for menuItemId: {}", menuItemId);
        
        // 1. Kitchen Capacity from dynamic settings (Default to 2)
        int totalChefs = settingService.getIntegerSetting("KITCHEN_CAPACITY", 2);

        // 2. Remaining cooking time for items already on stoves (Max of them)
        double maxCookingRemaining = orderItemRepository
                .findByStatus(OrderItemStatus.COOKING)
                .stream()
                .mapToDouble(item -> {
                    double avg = getEffectivePrepTime(item.getMenuItem());
                    double elapsed = 0.0;
                    if(item.getStartTime() != null) {
                        elapsed = Duration.between(item.getStartTime(), LocalDateTime.now()).toMinutes();
                    }
                    return Math.max(0, avg - elapsed);
                })
                .max()
                .orElse(0.0);

        // 3. Total load of pending items in queue
        double pendingLoad = orderItemRepository.findByStatus(OrderItemStatus.PENDING)
                .stream()
                .mapToDouble(item -> getEffectivePrepTime(item.getMenuItem()) * item.getQuantity())
                .sum();

        // 4. Preparation time for the requested item itself
        MenuItem requestedItem = menuItemRepository.findById(menuItemId).orElse(null);
        double selfPrepTime = requestedItem != null ? getEffectivePrepTime(requestedItem) : 10.0;

        // Formula: MaxRemainingCooking + (PendingLoad / Throughput) + SelfTime
        double estimatedTime = maxCookingRemaining + (pendingLoad / totalChefs) + selfPrepTime;
        
        log.info("Estimation Details [menuItemId={}]: capacity={}, maxCookingRemaining={}m, pendingLoad={}m, selfPrepTime={}m", 
                menuItemId, totalChefs, maxCookingRemaining, pendingLoad, selfPrepTime);
        log.info("Formula: {} + ({} / {}) + {} = {} minutes", 
                maxCookingRemaining, pendingLoad, totalChefs, selfPrepTime, estimatedTime);

        // Round to 1 decimal place
        return BigDecimal.valueOf(estimatedTime).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    private double getEffectivePrepTime(MenuItem item) {
        if (item.getAvgCookingTime() != null && item.getAvgCookingTime() > 0) {
            return item.getAvgCookingTime();
        }
        return item.getBaseCookingTime() != null ? item.getBaseCookingTime() : 10.0;
    }
}
