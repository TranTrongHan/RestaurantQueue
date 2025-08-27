package com.tth.RestaurantApplication.service;


import com.tth.RestaurantApplication.entity.*;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.OnlineOrderMapper;
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

    @Transactional
    Order createForOnlineOrder(User currentUser) {
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
        order.setIsPaid(true);
        orderRepository.save(order);
        log.info(" order {} created", order.getOrderId());
        return order;
    }

    @Transactional
    BigDecimal createOrderItemsFromCartForOnlineOrderAndGetSubTotal(User currentUser, Order order) {
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
        // Xóa danh sách cart khi tạo xong OrderItem
        onlineCartList.forEach(cartRepository::delete);
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
}
