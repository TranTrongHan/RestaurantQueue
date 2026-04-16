package com.tth.RestaurantApplication.service;


import com.tth.RestaurantApplication.dto.response.CustomerOrderHistoryResponse;
import com.tth.RestaurantApplication.dto.response.OrderItemResponse;
import com.tth.RestaurantApplication.entity.*;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.OnlineOrderMapper;
import com.tth.RestaurantApplication.mapper.OrderItemMapper;
import com.tth.RestaurantApplication.mapper.OrderMapper;
import com.tth.RestaurantApplication.repository.*;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
public class OrderManagementService {
    OnlineOrderRepository onlineOrderRepository;
    OrderRepository orderRepository;
    OnlineCartRepository cartRepository;
    MenuItemRepository menuItemRepository;
    OrderItemRepository orderItemRepository;
    OnlineOrderMapper onlineOrderMapper;
    OrderMapper orderMapper;
    OrderSessionRepository orderSessionRepository;
    ReservationRepository reservationRepository;
    OrderItemMapper orderItemMapper;

    @Transactional
    public Order createForOnlineOrder(User currentUser) {
        if(currentUser.getAddress()== null){
            throw new AppException(ErrorCode.ADDRESS_BLANK);
        }
        OnlineOrder onlineOrder = new OnlineOrder();
        onlineOrder.setUser(currentUser);
        onlineOrder.setDeliveryAddress(currentUser.getAddress());
        onlineOrder.setCreatedAt(new Date());
        onlineOrder.setNote(null);

        onlineOrderRepository.save(onlineOrder);
        log.info("online order {} created", onlineOrder.getOnlineOrderId());
        Order order = new Order();
        order.setOnlineOrder(onlineOrder);
        order.setOrderSession(null);
        order.setCreatedAt(LocalDateTime.now());
        order.setIsPaid(false);
        order.setStatus(Order.OrderStatus.PENDING);
        orderRepository.save(order);
        log.info(" order {} created", order.getOrderId());
        return order;
    }

    @Transactional
    public BigDecimal createOrderItemsFromCartForOnlineOrderAndGetSubTotal(User currentUser, Order order) {
        List<OnlineCart> onlineCartList = cartRepository.findByUserOrderByAddedAtDesc(currentUser);
        BigDecimal subTotal = BigDecimal.ZERO;
        if (onlineCartList == null || onlineCartList.isEmpty()) {
            log.info("to here");
            throw new AppException(ErrorCode.CART_EMPTY);
        }
        for (OnlineCart cartItem : onlineCartList) {
            MenuItem menuItem = menuItemRepository.findByMenuItemId(cartItem.getMenuItem().getMenuItemId())
                    .orElseThrow(() -> new AppException(ErrorCode.MENU_ITEM_NOT_FOUND));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setStatus(OrderItem.OrderItemStatus.DONE);
            orderItem.setEstimateTime(null);
            orderItem.setStartTime(null);
            orderItem.setDeadlineTime(null);
            orderItem.setNote(null);
            subTotal = subTotal.add(menuItem.getPrice().multiply(new BigDecimal(orderItem.getQuantity())));
            orderItemRepository.save(orderItem);
        }
        // Xóa đoạn code xoá cart ở đây để giữ lại giỏ hàng cho đến khi thanh toán thành công
        return subTotal;
    }

    // === PHẦN XỬ LÝ IN-HOUSE ORDER (CHECK-IN) ===
    @Transactional
    public OrderSession createInHouseOrderFromReservation(Reservation reservation) {
        // Tạo OrderSession
        OrderSession orderSession = new OrderSession();
        orderSession.setReservation(reservation);
        orderSession.setSessionToken(UUID.randomUUID().toString());
        orderSession.setCreatedAt(LocalDateTime.now());
        orderSession.setExpiredAt(LocalDateTime.now().plusHours(3));
        orderSession.setIsActive(true);
        log.info("created orderSession");
        orderSessionRepository.save(orderSession);

        // Tạo Order
        Order order = new Order();
        order.setOrderSession(orderSession);
        order.setOnlineOrder(null);
        order.setCreatedAt(LocalDateTime.now());
        order.setIsPaid(false);
        orderRepository.save(order);
        log.info("created order");
        reservation.setOrderSession(orderSession);
        reservationRepository.save(reservation);
        log.info("set ordersession for reservation");


        return orderSession;
    }

    @Transactional
    public List<CustomerOrderHistoryResponse> getCustomerOrderHistory(Integer userId) {
        List<CustomerOrderHistoryResponse> history = new java.util.ArrayList<>();

        // 1. Fetch Online Orders
        List<OnlineOrder> onlineOrders = onlineOrderRepository.findByUser_UserId(userId);
        for (OnlineOrder oo : onlineOrders) {
            Order order = oo.getOrder();
            if (order != null) {
                history.add(mapToHistoryResponse(order, CustomerOrderHistoryResponse.OrderType.ONLINE));
            }
        }

        // 2. Fetch Dine-In Orders
        List<Order> dineInOrders = orderRepository.findByOrderSession_Reservation_User_UserIdOrderByCreatedAtDesc(userId);
        for (Order o : dineInOrders) {
            history.add(mapToHistoryResponse(o, CustomerOrderHistoryResponse.OrderType.DINE_IN));
        }

        // 3. Sort by createdAt descending
        history.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        return history;
    }

    private CustomerOrderHistoryResponse mapToHistoryResponse(Order order, CustomerOrderHistoryResponse.OrderType type) {
        List<OrderItemResponse> itemResponses = order.getOrderItems().stream()
                .map(orderItemMapper::toOrderItemResponse)
                .toList();

        BigDecimal subTotal = BigDecimal.ZERO;
        BigDecimal discount = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        String status = order.getStatus() != null ? order.getStatus().toString() : "UNPAID";

        if (order.getBill() != null) {
            subTotal = order.getBill().getSubTotal();
            discount = order.getBill().getDiscountAmount();
            total = order.getBill().getTotalAmount();
        }

        java.util.Map<String, String> metadata = new java.util.HashMap<>();
        if (type == CustomerOrderHistoryResponse.OrderType.ONLINE && order.getOnlineOrder() != null) {
            metadata.put("deliveryAddress", order.getOnlineOrder().getDeliveryAddress());
            metadata.put("note", order.getOnlineOrder().getNote());
        } else if (type == CustomerOrderHistoryResponse.OrderType.DINE_IN && order.getOrderSession() != null) {
            metadata.put("tableName", order.getOrderSession().getReservation().getTable().getTableName());
            metadata.put("reservationId", order.getOrderSession().getReservation().getReservationId().toString());
        }

        return CustomerOrderHistoryResponse.builder()
                .orderId(order.getOrderId())
                .orderType(type)
                .createdAt(order.getCreatedAt())
                .isPaid(order.getIsPaid())
                .subTotal(subTotal)
                .discountAmount(discount)
                .totalAmount(total)
                .status(status)
                .items(itemResponses)
                .metadata(metadata)
                .build();
    }

    public BigDecimal calculateGrossSubtotal(Integer orderId) {
        List<OrderItem> items = orderItemRepository.findByOrder_OrderId(orderId);
        if (items == null || items.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return items.stream()
                .map(item -> item.getMenuItem().getPrice().multiply(new BigDecimal(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public BigDecimal calculateCartSubtotal(User currentUser) {
        List<OnlineCart> onlineCartList = cartRepository.findByUserOrderByAddedAtDesc(currentUser);
        if (onlineCartList == null || onlineCartList.isEmpty()) {
            throw new AppException(ErrorCode.CART_EMPTY);
        }
        return onlineCartList.stream()
                .map(cartItem -> cartItem.getMenuItem().getPrice().multiply(new BigDecimal(cartItem.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
