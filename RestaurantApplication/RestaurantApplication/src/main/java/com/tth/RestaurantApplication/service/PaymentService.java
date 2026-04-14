package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.request.PaymentRequest;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.entity.*;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.BillMapper;
import com.tth.RestaurantApplication.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PaymentService {
    BillRepository billRepository;
    PromotionsRepository promotionsRepository;
    BillMapper billMapper;
    OrderSessionRepository orderSessionRepository;
    TableRepository tableRepository;
    ReservationRepository reservationRepository;
    OrderRepository orderRepository;
    BillService billService;
    FirestoreService firestoreService;
    MembershipService membershipService;

    @Transactional
    public BillResponse createBill(Order order, PaymentRequest request, BigDecimal subTotal) {
        // Check if Bill already exists
        if (billRepository.existsByOrder_OrderId(order.getOrderId())) {
            log.info("Bill for order {} already exists, skipping creation.", order.getOrderId());
            Bill existingBill = billRepository.findByOrder_OrderId(order.getOrderId())
                    .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
            return billMapper.toBillResponse(existingBill);
        }

        Bill bill = billService.buildBill(order, request, subTotal);
        billRepository.save(bill);

        // Process Loyalty Points
        processLoyaltyPoints(order, subTotal, bill);

        return billMapper.toBillResponse(bill);
    }

    @Transactional
    public BillResponse createBillForDineInOrder(Order order, PaymentRequest request, BigDecimal subTotal) {
        // Check for duplicates
        if (billRepository.existsByOrder_OrderId(order.getOrderId())) {
            log.info("Bill for dine-in order {} already exists, skipping creation.", order.getOrderId());
            Bill existingBill = billRepository.findByOrder_OrderId(order.getOrderId())
                    .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
            return billMapper.toBillResponse(existingBill);
        }

        Bill bill = billService.buildBill(order, request, subTotal);
        billRepository.save(bill);
        log.info("saved 1 bill for dine-in order {}", order.getOrderId());

        OrderSession orderSession = order.getOrderSession();
        Reservation reservation = orderSession.getReservation();
        TableEntity table = reservation.getTable();

        orderSession.setExpiredAt(LocalDateTime.now());
        orderSessionRepository.save(orderSession);

        table.setStatus(TableEntity.TableStatus.AVAILABLE);
        tableRepository.save(table);

        reservation.setCheckoutTime(LocalDateTime.now());
        reservation.setStatus(Reservation.ReservationStatus.CHECKEDOUT);
        reservationRepository.save(reservation);

        order.setIsPaid(true);
        orderRepository.save(order);

        // Delete Firestore reservation
        firestoreService.deleteReservation(reservation.getReservationId());

        // Process Loyalty Points
        processLoyaltyPoints(order, subTotal, bill);

        return billMapper.toBillResponse(bill);
    }

    private void processLoyaltyPoints(Order order, BigDecimal paidAmount, Bill bill) {
        User user = null;
        if (order.getOrderSession() != null) {
            user = order.getOrderSession().getReservation().getUser();
        } else if (order.getOnlineOrder() != null) {
            user = order.getOnlineOrder().getUser();
        }

        if (user != null) {
            try {
                membershipService.processSuccessfulPayment(user, paidAmount, bill);
                log.info("[Loyalty] Points processed for user={}", user.getUsername());
            } catch (Exception e) {
                log.error("[Loyalty] Failed to process points for user={}: {}", user.getUsername(), e.getMessage());
            }
        }
    }

}
