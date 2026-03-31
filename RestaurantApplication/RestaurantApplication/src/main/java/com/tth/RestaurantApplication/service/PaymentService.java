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

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
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

    public BillResponse createBill(Order order, PaymentRequest request, BigDecimal subTotal) {
        // Kiểm tra xem đã có Bill cho Order này chưa (tránh trùng lặp giữa IPN và Return URL)
        if (billRepository.existsByOrder_OrderId(order.getOrderId())) {
            log.info("Bill for order {} already exists, skipping creation.", order.getOrderId());
            Bill existingBill = billRepository.findByOrder_OrderId(order.getOrderId())
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
            return billMapper.toBillResponse(existingBill);
        }

        Bill bill = billService.buildBill(order, request, subTotal);
        billRepository.save(bill);
        return billMapper.toBillResponse(bill);
    }

    public BillResponse createBillForDineInOrder(Order order, PaymentRequest request, BigDecimal subTotal) {
        // Kiểm tra trùng lặp
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

        // Xóa Reservation trên Firestore để Tablet quay về màn Check-in
        firestoreService.deleteReservation(reservation.getReservationId());

        return billMapper.toBillResponse(bill);
    }

}
