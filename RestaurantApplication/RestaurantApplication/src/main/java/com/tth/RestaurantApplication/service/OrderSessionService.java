package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.response.OrderResponse;
import com.tth.RestaurantApplication.dto.response.OrderSessionResponse;
import com.tth.RestaurantApplication.entity.*;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.OrderMapper;
import com.tth.RestaurantApplication.mapper.OrderSessionMapper;
import com.tth.RestaurantApplication.mapper.ReservationMapper;
import com.tth.RestaurantApplication.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderSessionService {
    OrderSessionRepository orderSessionRepository;
    OrderSessionMapper orderSessionMapper;
    MenuItemRepository menuItemRepository;
    OrderRepository orderRepository;
    OrderMapper orderMapper;
    FirestoreService firestoreService;
    ReservationRepository reservationRepository;
    PaymentService paymentService;
    ReservationMapper reservationMapper;
    TableRepository tableRepository;

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
    public void requestPayment(Integer sessionId) {
        OrderSession orderSession = orderSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_SESSION_NOT_FOUND));

        Reservation reservation = orderSession.getReservation();
        reservation.setStatus(Reservation.ReservationStatus.REQUEST_PAYMENT);
        reservationRepository.save(reservation);

        Integer resId = reservation.getReservationId();
        firestoreService.updateReservationStatus(resId, Reservation.ReservationStatus.REQUEST_PAYMENT.toString());
        log.info("Payment requested for reservation {}", resId);
    }

    public Order getCurrentUserOrder(Integer sessionId){
        return orderSessionRepository.findById(sessionId)
                .map(orderRepository::findByOrderSession)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_SESSION_NOT_FOUND));
    }

    @Transactional
    public BigDecimal getSubTotal(User currentUser, Order order) {
        List<OrderItem> orderItems = order.getOrderItems();
        if (orderItems == null) return BigDecimal.ZERO;

        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItem orderItem : orderItems) {
            MenuItem menuItem = menuItemRepository.findByMenuItemId(orderItem.getMenuItem().getMenuItemId())
                    .orElseThrow(() -> new AppException(ErrorCode.MENU_ITEM_NOT_FOUND));

            subtotal = subtotal.add(menuItem.getPrice().multiply(new BigDecimal(orderItem.getQuantity())));
        }

        return subtotal;
    }

    @Transactional
    public com.tth.RestaurantApplication.dto.response.BillResponse pay(Integer sessionId) {
        OrderSession orderSession = orderSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_SESSION_NOT_FOUND));
        
        Order order = orderRepository.findByOrderSession(orderSession);
        if (order == null) throw new AppException(ErrorCode.ORDER_NOT_FOUND);

        BigDecimal subTotal = getSubTotal(null, order);
        
        // This will handle Table/Reservation status updates and Firestore deletion
        return paymentService.createBillForDineInOrder(order, null, subTotal);
    }
}

