package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.request.MenuItemRequest;
import com.tth.RestaurantApplication.dto.request.OrderRequest;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.dto.response.OrderItemResponse;
import com.tth.RestaurantApplication.dto.response.OrderResponse;
import com.tth.RestaurantApplication.dto.response.OrderSessionResponse;
import com.tth.RestaurantApplication.entity.*;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.OrderItemMapper;
import com.tth.RestaurantApplication.mapper.OrderMapper;
import com.tth.RestaurantApplication.mapper.OrderSessionMapper;
import com.tth.RestaurantApplication.mapper.ReservationMapper;
import com.tth.RestaurantApplication.properties.RedisProperties;
import com.tth.RestaurantApplication.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderSessionService {
    OrderSessionRepository orderSessionRepository;
    OrderSessionMapper orderSessionMapper;
    OrderItemRepository orderItemRepository;
    MenuItemRepository menuItemRepository;
    MenuItemService menuItemService;
    KitchenAssignmentRepository kitchenAssignmentRepository;
    OrderItemMapper orderItemMapper;
    OrderRepository orderRepository;
    StringRedisTemplate redisTemplate;
    KitchenAssignmentService kitchenAssignmentService;
    OrderMapper orderMapper;
    FirestoreService firestoreService;
    ReservationRepository reservationRepository;
    PaymentService paymentService;
    ChefRepository chefRepository;
    KitchenAssignmentHelperService kitchenAssignmentHelperService;
    RedisProperties redisProperties;
    ReservationMapper reservationMapper;
    TableRepository tableRepository;
    @PostConstruct
    public void init() {
        String streamKey = redisProperties.getStreamKey();
        String groupName = redisProperties.getStream().getGroup();
        String consumerName = redisProperties.getStream().getConsumer();
    }

    public OrderSessionResponse validateSession(String token) {
        log.info("validating OrderSession with token={}", token);
        OrderSession orderSession = orderSessionRepository.findBySessionToken(token)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_SESSION_NOT_FOUND));

        boolean isValid = Boolean.TRUE.equals(orderSession.getIsActive());

        if (orderSession.getExpiredAt() != null && orderSession.getExpiredAt().isBefore(LocalDateTime.now())) {
            isValid = false;
        }
        if (!isValid) {
            log.warn("OrderSession token={} is invalid or expired", token);
            return new OrderSessionResponse(false, null, null);
        }

        OrderSessionResponse response = orderSessionMapper.toOrderSessionResponse(orderSession);
        response.setReservationResponse(reservationMapper.toReservationResponse(orderSession.getReservation()));
        response.setValid(true);

        log.info("Validated OrderSession token={} success", token);

        return response;

    }

    public OrderResponse getOrder(Integer sessionId) {
        OrderSession orderSession = orderSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_SESSION_NOT_FOUND));

        if (Boolean.FALSE.equals(orderSession.getIsActive())) {
            throw new AppException(ErrorCode.ORDER_SESSION_EXPIRED);
        }

        Order order = orderRepository.findByOrderSession(orderSession);
        if (order == null) {
            throw new AppException(ErrorCode.ORDER_NOT_FOUND);

        }

        return orderMapper.toOrderResponse(order);
    }




    @Transactional
    private OrderItem createAndSaveSingleOrderItem(Order order, MenuItemRequest menuItemRequest) {
        MenuItem item = menuItemRepository.findByMenuItemId(menuItemRequest.getMenuItemId())
                .orElseThrow(() -> new AppException(ErrorCode.MENUITEM_NOT_FOUND));

        OrderItem orderItem = new OrderItem();
        orderItem.setOrder(order);
        orderItem.setMenuItem(item);
        orderItem.setQuantity(menuItemRequest.getQuantity());
        orderItem.setStatus(OrderItem.OrderItemStatus.PENDING);


        double estimatedTime = kitchenAssignmentHelperService.calculateEstimatedTime(menuItemRequest.getMenuItemId());
        orderItem.setEstimateTime(estimatedTime);
        orderItem.setStartTime(LocalDateTime.now());
        orderItem.setDeadlineTime(LocalDateTime.now().plusMinutes((long) estimatedTime));
        log.info("before priority");
        orderItem.setPriorityScore(this.calculatePriorityScore(orderItem));
        log.info("after priority");
        return orderItemRepository.save(orderItem);
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


        List<OrderItem> newOrderItems = new ArrayList<>();
        for (MenuItemRequest menuItemRequest : request.getMenuItemRequestList()) {
            OrderItem orderItem = createAndSaveSingleOrderItem(order, menuItemRequest);
            newOrderItems.add(orderItem);
        }


        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                for (OrderItem orderItem : newOrderItems) {
                    Map<String, String> dishData = new HashMap<>();
                    dishData.put("orderItemId", String.valueOf(orderItem.getOrderItemId()));
                    dishData.put("orderId", String.valueOf(order.getOrderId()));
                    dishData.put("dishName", orderItem.getMenuItem().getName());
                    dishData.put("quantity", String.valueOf(orderItem.getQuantity()));
                    dishData.put("priority", String.valueOf(orderItem.getPriorityScore()));

                    redisTemplate.opsForStream().add(redisProperties.getStreamKey(), dishData);


                    redisTemplate.opsForZSet().add(
                            redisProperties.getZsetKey(),
                            String.valueOf(orderItem.getOrderItemId()),
                            orderItem.getPriorityScore()
                    );

                    try {
                        firestoreService.pushOrderItemForBill(orderItem, order);
                    } catch (ExecutionException e) {
                        throw new RuntimeException(e);
                    } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                    firestoreService.pushOrderItem(orderItem, order);
                }
                kitchenAssignmentService.assignDishesToAllAvailableChefs();
            }

        });

        return newOrderItems.stream()
                .map(orderItemMapper::toOrderItemResponse)
                .collect(Collectors.toList());
    }

    public double calculatePriorityScore(OrderItem item) {
        // Điểm cơ bản
        final double baseScore = 100;

        // 1. Giảm điểm cho khách VIP (càng thấp càng ưu tiên)
        boolean isVIP = item.getOrder().getOrderSession().getReservation().getUser().getIsVip();
        double vipPenalty = isVIP ? 20 : 0;

        // 2. Giảm điểm theo thời gian chờ (càng chờ lâu, điểm càng thấp, ưu tiên càng cao)
        long minutesSinceOrder = Duration.between(
                item.getStartTime(),
                LocalDateTime.now()
        ).toMinutes();
        double waitingTimeBonus = minutesSinceOrder;

        // 3. Giảm điểm theo thời gian nấu (món nấu lâu điểm càng thấp, ưu tiên càng cao)
        double avgCookingTime = menuItemService.getAvgCookingTime(item.getMenuItem().getMenuItemId());
        double cookingTimePenalty = avgCookingTime * 0.5;

        // Công thức tính điểm ưu tiên tổng hợp
        double score = baseScore - vipPenalty - waitingTimeBonus - cookingTimePenalty;
        if (score < 0) {
            score = 0;
        }
        return BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP).doubleValue();

    }

    // Pay xong thi sua lai status reservatiton
    public BillResponse pay(Integer sessionId) {
        OrderSession orderSession = orderSessionRepository.findById(sessionId).orElseThrow(() -> new AppException(ErrorCode.ORDER_SESSION_NOT_FOUND));

        Reservation reservation = orderSession.getReservation();
        TableEntity table =  reservation.getTable();
        Order order = orderRepository.findByOrderSession(orderSession);
        if (order != null) {
            log.info("has order");
        }


        List<OrderItem> orderItems = order.getOrderItems();
        if (orderItems != null) {
            log.info("has list order items");
        }
        final BigDecimal[] subtotal = {BigDecimal.ZERO};
        orderItems.forEach(orderItem -> {
            MenuItem menuItem = menuItemRepository.findByMenuItemId(orderItem.getMenuItem().getMenuItemId())
                    .orElseThrow(() -> new AppException(ErrorCode.MENU_ITEM_NOT_FOUND));

            subtotal[0] = subtotal[0].add(menuItem.getPrice().multiply(new BigDecimal(orderItem.getQuantity())));
        });
        BillResponse billResponse = paymentService.createBill(order, null, subtotal[0]);

        orderSession.setExpiredAt(LocalDateTime.now());
        orderSessionRepository.save(orderSession);
        table.setStatus(TableEntity.TableStatus.AVAILABLE);
        tableRepository.save(table);
        reservation.setCheckoutTime(LocalDateTime.now());
        reservation.setStatus(Reservation.ReservationStatus.CHECKEDOUT);
        reservationRepository.save(reservation);
        order.setIsPaid(true);
        orderRepository.save(order);

        return billResponse;
    }
    public Order getCurrentUserOrder(Integer sessionId){
        OrderSession orderSession = orderSessionRepository.findById(sessionId).orElseThrow(() -> new AppException(ErrorCode.ORDER_SESSION_NOT_FOUND));

        Reservation reservation = orderSession.getReservation();
        TableEntity table =  reservation.getTable();
        Order order = orderRepository.findByOrderSession(orderSession);
        if (order != null) {
            log.info("has order");
        }
        return order;
    }
    @jakarta.transaction.Transactional
    public BigDecimal getSubTotal(User currentUser, Order order) {
        List<OrderItem> orderItems = order.getOrderItems();
        if (orderItems != null) {
            log.info("has list order items");
        }
        BigDecimal[] subtotal = {BigDecimal.ZERO};
        orderItems.forEach(orderItem -> {
            MenuItem menuItem = menuItemRepository.findByMenuItemId(orderItem.getMenuItem().getMenuItemId())
                    .orElseThrow(() -> new AppException(ErrorCode.MENU_ITEM_NOT_FOUND));

            subtotal[0] = subtotal[0].add(menuItem.getPrice().multiply(new BigDecimal(orderItem.getQuantity())));
        });

        return subtotal[0];
    }

    public void cancelOrderItem(Integer orderItemId){
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_ITEM_NOT_FOUND));
        if(orderItem.getStatus().equals(OrderItem.OrderItemStatus.PENDING)){
            orderItemRepository.delete(orderItem);
            firestoreService.removeOrderItem(orderItem.getOrder().getOrderId().toString(),orderItem.getOrderItemId().toString());
            firestoreService.decreaseBillItemQuantity(orderItem.getOrder().getOrderId().toString(),orderItem);
            redisTemplate.opsForZSet().remove(redisProperties.getZsetKey(), String.valueOf(orderItem.getOrderItemId()));

            Map<String, String> deleteData = new HashMap<>();
            deleteData.put("orderItemId", String.valueOf(orderItem.getOrderItemId()));
            deleteData.put("orderId", String.valueOf(orderItem.getOrder().getOrderId()));
            deleteData.put("type", "DELETE");

            redisTemplate.opsForStream().add(redisProperties.getStreamKey(), deleteData);

            log.info("OrderItem {} đã bị hủy: xóa khỏi DB, Firestore, Redis ZSet và thông báo lên Stream", orderItemId);
        }
    }
}
