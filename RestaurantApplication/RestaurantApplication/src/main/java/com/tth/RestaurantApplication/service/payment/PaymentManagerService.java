package com.tth.RestaurantApplication.service.payment;

import com.tth.RestaurantApplication.constant.PaymentType;
import com.tth.RestaurantApplication.dto.response.BillResponse;
import com.tth.RestaurantApplication.entity.Order;
import com.tth.RestaurantApplication.entity.User;
import com.tth.RestaurantApplication.exception.AppException;
import com.tth.RestaurantApplication.exception.ErrorCode;
import com.tth.RestaurantApplication.repository.OnlineCartRepository;
import com.tth.RestaurantApplication.repository.OrderRepository;
import com.tth.RestaurantApplication.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentManagerService {

    private final List<PaymentGateway> gateways;
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final OnlineCartRepository cartRepository;

    public PaymentGateway getGateway(PaymentType type) {
        return gateways.stream()
                .filter(g -> g.getPaymentType() == type)
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION)); // Or a better error code
    }

    public String createPaymentUrl(Order order, PaymentType type, Long amount, String returnUrl) throws Exception {
        PaymentGateway gateway = getGateway(type);
        return gateway.createPaymentUrl(order.getOrderId(), amount, returnUrl);
    }

    @Transactional
    public BillResponse handlePaymentReturn(PaymentType type, Map<String, String> params, User currentUser) throws Exception {
        PaymentGateway gateway = getGateway(type);

        if (!gateway.verifySignature(params)) {
            throw new AppException(ErrorCode.INVALID_SIGNATURE);
        }

        String orderIdStr = gateway.getOrderId(params);
        Integer orderId = Integer.valueOf(orderIdStr);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (gateway.isSuccess(params)) {
            return finalizePayment(order, params, currentUser);
        } else {
            log.warn("Payment failed for order {} using {}", orderId, type);
            throw new AppException(ErrorCode.PAYMENT_FAILED);
        }
    }

    @Transactional
    public String handlePaymentIpn(PaymentType type, Map<String, String> params) throws Exception {
        PaymentGateway gateway = getGateway(type);

        try {
            if (!gateway.verifySignature(params)) {
                return "{\"RspCode\":\"01\",\"Message\":\"Invalid signature\"}";
            }

            String orderIdStr = gateway.getOrderId(params);
            Integer orderId = Integer.valueOf(orderIdStr);
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

            if (Boolean.TRUE.equals(order.getIsPaid())) {
                return "{\"RspCode\":\"02\",\"Message\":\"Order already confirmed\"}";
            }

            if (gateway.isSuccess(params)) {
                finalizePayment(order, params, null);
                return "{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}";
            } else {
                return "{\"RspCode\":\"00\",\"Message\":\"Payment failed reported\"}";
            }
        } catch (Exception e) {
            log.error("IPN Error", e);
            return "{\"RspCode\":\"99\",\"Message\":\"Unknown error\"}";
        }
    }

    private BillResponse finalizePayment(Order order, Map<String, String> params, User currentUser) {
        // Extract amount from params (gateway specific or generic if possible)
        // For now, keep it simple or add getAmount to Gateway interface
        // VNPay amount is in params.get("vnp_Amount") / 100
        Long amountLong = 0L;
        if (params.containsKey("vnp_Amount")) {
            amountLong = Long.parseLong(params.get("vnp_Amount")) / 100;
        }

        order.setIsPaid(true);
        orderRepository.save(order);

        User user = (currentUser != null) ? currentUser :
                (order.getOrderSession() != null ? order.getOrderSession().getReservation().getUser() :
                        (order.getOnlineOrder() != null ? order.getOnlineOrder().getUser() : null));

        if (user != null) {
            cartRepository.deleteByUser(user);
        }

        if (order.getOrderSession() != null) {
            return paymentService.createBillForDineInOrder(order, null, BigDecimal.valueOf(amountLong));
        } else {
            return paymentService.createBill(order, null, BigDecimal.valueOf(amountLong));
        }
    }
}
