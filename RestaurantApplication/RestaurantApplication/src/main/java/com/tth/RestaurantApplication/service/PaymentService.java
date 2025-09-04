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
    private Bill buildBill(Order order, PaymentRequest request, BigDecimal subTotal) {
        Promotion promotions = null;
        if (request != null) {
            promotions = promotionsRepository.findByName(request.getPromotionName());
        }

        BigDecimal discountAmount = promotions != null ? subTotal.multiply(promotions.getValue()) : BigDecimal.ZERO;
        BigDecimal totalAmount = subTotal.subtract(discountAmount);

        Bill bill = new Bill();
        bill.setOrder(order);
        bill.setCreatedAt(LocalDateTime.now());
        bill.setSubTotal(subTotal);
        bill.setDiscountAmount(discountAmount);
        bill.setTotalAmount(totalAmount);
        bill.setStatus(Bill.BillStatus.PAID);
        bill.setPaymentTime(LocalDateTime.now());
        return bill;
    }
    BillResponse createBill(Order order, PaymentRequest request, BigDecimal subTotal) {
        Bill bill = buildBill(order, request, subTotal);
        billRepository.save(bill);
        return billMapper.toBillResponse(bill);
    }

    BillResponse createBillForDineInOrder(Order order, PaymentRequest request, BigDecimal subTotal) {
        Bill bill = buildBill(order, request, subTotal);
        billRepository.save(bill);

        // extra dine-in logic
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

        return billMapper.toBillResponse(bill);
    }
}
