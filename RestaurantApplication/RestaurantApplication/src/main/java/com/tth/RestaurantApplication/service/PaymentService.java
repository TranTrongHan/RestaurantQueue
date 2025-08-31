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
    BillResponse createBill(Order order, PaymentRequest request, BigDecimal subTotal){
        Promotion promotions = null;

        if(request!= null){
            log.info("promotionName : {}",request.getPromotionName());
            promotions = promotionsRepository.findByName(request.getPromotionName());
        }
        log.info("no promotion");
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;

        if(promotions!=null){
            discountAmount = subTotal.multiply(promotions.getValue());
            totalAmount = subTotal.subtract(discountAmount);
        } else {
            totalAmount = subTotal;
        }
        Bill bill = new Bill();
        bill.setOrder(order);
        bill.setCreatedAt(LocalDateTime.now());
        bill.setSubTotal(subTotal);
        bill.setDiscountAmount(discountAmount);
        bill.setTotalAmount(totalAmount);
        bill.setStatus(Bill.BillStatus.PAID);
        bill.setPaymentTime(LocalDateTime.now());

        billRepository.save(bill);
        return billMapper.toBillResponse(bill);
    }
    BillResponse createBillForDineInOrder(Order order, PaymentRequest request, BigDecimal subTotal){
        BillResponse response = createBill(order,request,subTotal);
        OrderSession orderSession = order.getOrderSession();

        Reservation reservation = orderSession.getReservation();
        TableEntity table =  reservation.getTable();
        orderSession.setExpiredAt(LocalDateTime.now());
        orderSessionRepository.save(orderSession);
        table.setStatus(TableEntity.TableStatus.AVAILABLE);
        tableRepository.save(table);
        reservation.setCheckoutTime(LocalDateTime.now());
        reservation.setStatus(Reservation.ReservationStatus.CHECKEDOUT);
        reservationRepository.save(reservation);
        order.setIsPaid(true);
        orderRepository.save(order);

        return response;
    }
}
