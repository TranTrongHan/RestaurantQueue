package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.request.PaymentRequest;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.entity.Bill;
import com.tth.RestaurantApplication.entity.Order;
import com.tth.RestaurantApplication.entity.Promotion;
import com.tth.RestaurantApplication.mapper.BillMapper;
import com.tth.RestaurantApplication.repository.BillRepository;
import com.tth.RestaurantApplication.repository.PromotionsRepository;
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
}
