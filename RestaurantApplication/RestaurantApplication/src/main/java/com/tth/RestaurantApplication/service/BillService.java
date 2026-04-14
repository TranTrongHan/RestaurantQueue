package com.tth.RestaurantApplication.service;

import com.tth.RestaurantApplication.dto.request.PaymentRequest;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.dto.response.BillSummaryResponse;
import com.tth.RestaurantApplication.dto.response.OrderItemResponse;
import com.tth.RestaurantApplication.entity.Bill;
import com.tth.RestaurantApplication.entity.Order;
import com.tth.RestaurantApplication.entity.OrderItem;
import com.tth.RestaurantApplication.entity.Promotion;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.mapper.BillMapper;
import com.tth.RestaurantApplication.mapper.BillSumaryMapper;
import com.tth.RestaurantApplication.mapper.OrderItemMapper;
import com.tth.RestaurantApplication.repository.BillRepository;
import com.tth.RestaurantApplication.repository.OrderItemRepository;
import com.tth.RestaurantApplication.repository.PromotionsRepository;
import com.tth.RestaurantApplication.repository.UserRepository;
import com.tth.RestaurantApplication.service.VoucherService;
import com.tth.RestaurantApplication.entity.Voucher;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.service.AuthenticateService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@RequiredArgsConstructor
@Service
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class BillService {
    BillRepository billRepository;
    OrderItemRepository orderItemRepository;
    BillMapper billMapper;
    BillSumaryMapper billSumaryMapper;
    OrderItemMapper orderItemMapper;
    PromotionsRepository promotionsRepository;
    VoucherService voucherService;
    AuthenticateService authenticateService;
    OrderManagementService orderManagementService;

    public Bill buildBill(Order order, PaymentRequest request, BigDecimal amountPaid) {
        BigDecimal grossSubTotal = orderManagementService.calculateGrossSubtotal(order.getOrderId());
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (request != null && request.getPromotionName() != null && !request.getPromotionName().isEmpty()) {
            String code = request.getPromotionName();
            // 1. Try Global Promotion first
            Promotion promotions = promotionsRepository.findByName(code);
            if (promotions != null) {
                discountAmount = grossSubTotal.multiply(promotions.getValue());
            } else {
                // 2. Try User Voucher
                try {
                    User user = (order.getOrderSession() != null)
                            ? order.getOrderSession().getReservation().getUser()
                            : (order.getOnlineOrder() != null ? order.getOnlineOrder().getUser() : null);

                    if (user != null) {
                        // Identify order type (Online or Dine-In)
                        Voucher.ApplyType applyType = (order.getOnlineOrder() != null) ? Voucher.ApplyType.ONLINE
                                : Voucher.ApplyType.DINE_IN;

                        discountAmount = voucherService.validateAndCalculateDiscount(code, grossSubTotal, user,
                                applyType);

                        // If successful, mark it as used
                        voucherService.markVoucherAsUsed(user, code);
                    }
                } catch (Exception e) {
                    log.error("Failed to apply voucher code {}: {}", code, e.getMessage());
                }
            }
        }

        // Final sanity check or just trust the amountPaid
        // totalAmount = amountPaid;
        // discountAmount = grossSubTotal - amountPaid; (This is more accurate if gateway handles everything correctly)

        Bill bill = new Bill();
        bill.setOrder(order);
        bill.setCreatedAt(LocalDateTime.now());
        bill.setSubTotal(grossSubTotal);
        bill.setDiscountAmount(grossSubTotal.subtract(amountPaid));
        bill.setTotalAmount(amountPaid);
        bill.setStatus(Bill.BillStatus.PAID);
        bill.setPaymentTime(LocalDateTime.now());
        log.info("return bill of order {} with total {}", order.getOrderId(), amountPaid);
        return bill;
    }
    public BillResponse getBillDetail(Integer billId){
        Bill bill = billRepository.findByIdWithOrderAndItems(billId);
        List<OrderItem> orderItems = orderItemRepository.findByOrder_OrderId(bill.getOrder().getOrderId());
        List<OrderItemResponse> orderItemResponses = new ArrayList<>();
        if(!orderItems.isEmpty()){
            log.info("has orderItem");
            orderItems.forEach(orderItem -> {
                log.info("orderItemId: {}",orderItem.getOrderItemId());
                log.info("menuItem: {}",orderItem.getMenuItem().getName() != null ? orderItem.getMenuItem().getName() : "NULL");
                OrderItemResponse orderItemResponse = orderItemMapper.toOrderItemResponse(orderItem);
                orderItemResponses.add(orderItemResponse);
            });
        }
        BillResponse billResponse = billMapper.toBillResponse(bill);
        billResponse.getOrder().setItems(orderItemResponses);
        return billResponse;
    }
    public List<BillSummaryResponse> getBills(){
        List<Bill> bills = billRepository.findAll();
        return bills.stream().map(billSumaryMapper::toBillSummaryResponse).toList();
    }
}
